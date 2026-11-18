create function public.dfc_z37_points_blocked_winner(p_hand_id bigint)
returns uuid language sql stable set search_path=''
as $$
 select hp.user_id
 from public.rf_domino_hand_players hp
 where hp.hand_id=p_hand_id
 order by public.rf_domino_tiles_pips_v11(hp.tiles),
   case when hp.user_id=(
     select move.user_id from public.rf_domino_moves move
     where move.hand_id=p_hand_id and move.action in ('PLAY','AUTO_PLAY')
     order by move.id desc limit 1
   ) then 0 else 1 end,
   hp.seat_no
 limit 1;
$$;
revoke all on function public.dfc_z37_points_blocked_winner(bigint) from public,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.dfc_z37_record_points_hand()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_match public.dfc_z37_points_matches%rowtype;
  v_team smallint;
  v_points integer;
begin
  if new.status <> 'settled' or old.status is not distinct from new.status
     or new.winner_user_id is null
     or coalesce(new.winner_reason,'') not in ('ULTIMA_FICHA','TRANQUE_MENOS_PUNTOS') then
    return new;
  end if;

  select m.* into v_match
  from public.dfc_z37_points_matches m
  where m.engine_table_id=new.table_id and m.state='playing'
  for update;
  if not found then return new; end if;

  select p.team into v_team
  from public.dfc_z37_points_participants p
  where p.match_id=v_match.id and p.user_id=new.winner_user_id and p.charged;
  if not found then return new; end if;

  select coalesce(sum(public.rf_domino_tiles_pips_v11(hp.tiles)),0)
  into v_points
  from public.rf_domino_hand_players hp
  join public.dfc_z37_points_participants p
    on p.match_id=v_match.id and p.user_id=hp.user_id and p.charged
  where hp.hand_id=new.id
    and (new.winner_reason='TRANQUE_MENOS_PUNTOS' or p.team<>v_team);
  if v_points<=0 then return new; end if;

  insert into public.dfc_z37_points_events
    (match_id,external_request_id,user_id,team,event_type,points,engine_hand_id)
  values(v_match.id,pg_catalog.gen_random_uuid(),new.winner_user_id,v_team,
    case new.winner_reason when 'ULTIMA_FICHA' then 'domino' else 'trancazo' end,
    v_points,new.id)
  on conflict (engine_hand_id) do nothing;
  if not found then return new; end if;

  update public.dfc_z37_points_participants
  set points_individual=points_individual+v_points
  where match_id=v_match.id and user_id=new.winner_user_id;

  update public.dfc_z37_points_matches
  set team_a_points=team_a_points+case when v_team=1 then v_points else 0 end,
      team_b_points=team_b_points+case when v_team=2 then v_points else 0 end,
      winner_team=case when (case v_team when 1 then team_a_points else team_b_points end)
                           +v_points>=target_points then v_team else winner_team end,
      state=case when (case v_team when 1 then team_a_points else team_b_points end)
                     +v_points>=target_points then 'settled' else state end,
      settled_at=case when (case v_team when 1 then team_a_points else team_b_points end)+v_points>=target_points then now() else settled_at end
  where id=v_match.id;
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.rf_domino_pass_internal_v11(p_hand_id bigint, p_user uuid, p_auto boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

DECLARE

  v_hand public.rf_domino_hands;

  v_hp public.rf_domino_hand_players;

  v_cfg public.rf_domino_configs;

  v_seat public.rf_domino_seats;

  v_source_seat public.rf_domino_seats;

  v_fee numeric(18,3) := 0;

  v_paid numeric(18,3) := 0;

  v_source_user uuid;

  v_pass_count integer := 0;

  v_player_count integer := 0;

  v_next_user uuid;

  v_winner uuid;

  v_rec record;

  v_min_pips integer := 999999;

  v_pips integer;

  v_current_seat integer;

  v_available numeric(18,3) := 0;

BEGIN

  SELECT dh.*

  INTO v_hand

  FROM public.rf_domino_hands dh

  WHERE
    dh.id = p_hand_id
    AND dh.status = 'playing'

  FOR UPDATE;


  IF NOT FOUND
     OR v_hand.turn_user_id <> p_user
  THEN
    RETURN;
  END IF;


  SELECT hp.*

  INTO v_hp

  FROM public.rf_domino_hand_players hp

  WHERE
    hp.hand_id = v_hand.id
    AND hp.user_id = p_user

  FOR UPDATE;


  IF NOT FOUND THEN
    RETURN;
  END IF;


  IF public.rf_domino_has_legal_v11(

    v_hp.tiles,

    v_hand.open_left,

    v_hand.open_right,

    jsonb_array_length(v_hand.board) = 0

  ) THEN

    RETURN;

  END IF;


  SELECT dc.*

  INTO v_cfg

  FROM public.rf_domino_tables dt

  JOIN public.rf_domino_configs dc

    ON dc.id = dt.config_id

  WHERE dt.id = v_hand.table_id;


  SELECT ds.*

  INTO v_seat

  FROM public.rf_domino_seats ds

  WHERE
    ds.table_id = v_hand.table_id
    AND ds.user_id = p_user

  FOR UPDATE;


  -- Penalizacion configurada
  -- para las modalidades aplicables.

  v_fee := GREATEST(
    COALESCE(v_cfg.pass_fee, 0),
    0
  );

  v_source_user := v_hand.last_play_user_id;


  IF v_seat.id IS NOT NULL THEN

    v_available := v_seat.table_balance;

  ELSE

    v_available :=
      COALESCE(v_hp.detached_balance, 0);

  END IF;


  IF v_fee > 0
     AND v_source_user IS NOT NULL
     AND v_source_user <> p_user

  THEN


    -- Comprobar destinatario existente.

    IF NOT EXISTS (

      SELECT 1

      FROM public.rf_domino_seats ds

      WHERE
        ds.table_id = v_hand.table_id
        AND ds.user_id = v_source_user

    )

    AND NOT EXISTS (

      SELECT 1

      FROM public.rf_domino_hand_players hp2

      WHERE
        hp2.hand_id = v_hand.id
        AND hp2.user_id = v_source_user

    )

    THEN

      RAISE EXCEPTION
        'Pase sin receptor valido, mano %',
        v_hand.id;

    END IF;


    v_paid := LEAST(

      v_fee,

      GREATEST(
        COALESCE(v_available, 0),
        0
      )

    );


    IF v_paid > 0 THEN


      IF v_seat.id IS NOT NULL THEN

        UPDATE public.rf_domino_seats ds

        SET table_balance =
          ds.table_balance - v_paid

        WHERE ds.id = v_seat.id;


      ELSE

        UPDATE public.rf_domino_hand_players hp

        SET detached_balance =
          GREATEST(
            hp.detached_balance - v_paid,
            0
          )

        WHERE
          hp.hand_id = v_hand.id
          AND hp.user_id = p_user;

      END IF;


      SELECT ds.*

      INTO v_source_seat

      FROM public.rf_domino_seats ds

      WHERE
        ds.table_id = v_hand.table_id
        AND ds.user_id = v_source_user

      FOR UPDATE;


      IF v_source_seat.id IS NOT NULL THEN

        UPDATE public.rf_domino_seats ds

        SET table_balance =
          ds.table_balance + v_paid

        WHERE ds.id = v_source_seat.id;


      ELSE

        UPDATE public.rf_domino_hand_players hp

        SET detached_balance =
          hp.detached_balance + v_paid

        WHERE
          hp.hand_id = v_hand.id
          AND hp.user_id = v_source_user;

      END IF;

    END IF;

  END IF;


  INSERT INTO public.rf_domino_moves(

    hand_id,

    user_id,

    action,

    amount

  )

  VALUES (

    v_hand.id,

    p_user,

    CASE
      WHEN p_auto THEN 'AUTO_PASS'
      ELSE 'PASS'
    END,

    v_paid

  );


  v_current_seat := v_hp.seat_no;


  UPDATE public.rf_domino_hands dh

  SET consecutive_passes =
    dh.consecutive_passes + 1

  WHERE dh.id = v_hand.id

  RETURNING dh.consecutive_passes
  INTO v_pass_count;


  SELECT COUNT(*)

  INTO v_player_count

  FROM public.rf_domino_hand_players hp

  WHERE hp.hand_id = v_hand.id;


  IF v_pass_count >= v_player_count THEN
    IF EXISTS (
      SELECT 1 FROM public.dfc_z37_points_matches m
      WHERE m.engine_table_id=v_hand.table_id AND m.state='playing'
    ) THEN
      v_winner := public.dfc_z37_points_blocked_winner(v_hand.id);
      PERFORM public.rf_domino_settle_v11(v_hand.id,v_winner,'TRANQUE_MENOS_PUNTOS');
      RETURN;
    END IF;


    FOR v_rec IN

      SELECT
        hp.user_id,
        hp.tiles

      FROM public.rf_domino_hand_players hp

      WHERE hp.hand_id = v_hand.id

    LOOP

      v_pips :=
        public.rf_domino_tiles_pips_v11(
          v_rec.tiles
        );


      IF v_pips < v_min_pips THEN

        v_min_pips := v_pips;

        v_winner := v_rec.user_id;

      END IF;

    END LOOP;


    PERFORM public.rf_domino_settle_v11(

      v_hand.id,

      v_winner,

      'TRANQUE_MENOS_PUNTOS'

    );

    RETURN;

  END IF;


  v_next_user :=
    public.rf_domino_next_user_v11(
      v_hand.id,
      v_current_seat
    );


  UPDATE public.rf_domino_hands dh

  SET
    turn_user_id = v_next_user,

    turn_deadline =
      NOW() +
      MAKE_INTERVAL(
        secs => v_cfg.turn_seconds
      )

  WHERE dh.id = v_hand.id;

END

$function$
;
