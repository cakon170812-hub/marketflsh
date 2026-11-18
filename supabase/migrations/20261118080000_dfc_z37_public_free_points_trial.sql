
alter table public.dfc_z37_points_matches add column engine_table_id bigint unique references public.rf_domino_tables(id);
CREATE OR REPLACE FUNCTION public.dfc_z37_prepare_points_table_internal(p_match uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_match public.dfc_z37_points_matches%rowtype;
 v_name text;
 v_template public.rf_domino_configs%rowtype;
 v_config_id smallint;
 v_table_id bigint;
begin
 select * into v_match
 from public.dfc_z37_points_matches
 where id=p_match
 for update;
 if not found then
  raise exception 'Partida por puntos no encontrada';
 end if;
 if v_match.engine_table_id is not null then
  return v_match.engine_table_id;
 end if;
 if v_match.state <> 'waiting' then
  raise exception 'Solo se puede preparar una partida en espera';
 end if;

 select name into strict v_name
 from public.dfc_z37_points_configs where id=v_match.config_id;

 select * into v_template
 from public.rf_domino_configs
 where mode='normal'
 order by active desc,id
 limit 1;
 if not found then
  raise exception 'No hay una configuración de Por gane para usar como base';
 end if;

 perform pg_catalog.pg_advisory_xact_lock(1242999999::bigint);
 select candidate.id::smallint into v_config_id
 from pg_catalog.generate_series(8,32767) as candidate(id)
 where not exists (select 1 from public.rf_domino_configs c where c.id=candidate.id)
 order by candidate.id
 limit 1;
 if v_config_id is null then
  raise exception 'Se alcanzó el límite del catálogo de mesas';
 end if;

 -- The points match owns the entry and pot; the board must not collect them.
 insert into public.rf_domino_configs
  (id,name,mode,active,min_entry,hand_stake,commission_pct,pass_fee,min_continue_balance,turn_seconds,shuffle_seconds)
 values
  (v_config_id,pg_catalog.left(v_name,80),'normal',false,v_template.min_entry,0,0,0,0,v_template.turn_seconds,v_template.shuffle_seconds);

 insert into public.rf_domino_tables(config_id,table_no)
 values(v_config_id,1)
 returning id into v_table_id;

 update public.dfc_z37_points_matches
 set engine_table_id=v_table_id
 where id=p_match;

 return v_table_id;
end;
$function$;
revoke all on function public.dfc_z37_prepare_points_table_internal(uuid) from public, anon, authenticated, service_role;


alter table public.dfc_z37_points_events
  add column engine_hand_id bigint references public.rf_domino_hands(id),
  add constraint dfc_z37_points_events_one_score_per_hand unique (engine_hand_id);

create function public.dfc_z37_record_points_hand()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
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
  where hp.hand_id=new.id and p.team<>v_team;
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
$function$;

revoke all on function public.dfc_z37_record_points_hand() from public, anon, authenticated, service_role;

create trigger dfc_z37_score_completed_hand
after update of status on public.rf_domino_hands
for each row
when (old.status is distinct from new.status and new.status='settled')
execute function public.dfc_z37_record_points_hand();


CREATE OR REPLACE FUNCTION public.rf_domino_try_start_v189(p_table_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_cfg public.rf_domino_configs;
  v_config_id smallint;
  v_rec record;
  v_count integer:=0;
  v_hand_id bigint;
  v_existing_hand bigint;
  v_deck jsonb;
  v_player_count integer:=0;
  v_offset integer:=0;
  v_j integer;
  v_hand_tiles jsonb;
  v_stake numeric(18,3):=0;
  v_commission numeric(18,3):=0;
  v_start_user uuid;
  v_best_double integer:=-1;
  v_best_sum integer:=-1;
  v_tile jsonb;
  v_a integer;
  v_b integer;
  v_debited integer:=0;
  v_players_dealt integer:=0;
  v_tiles_dealt integer:=0;
  v_unique_tiles integer:=0;
  v_points_mode boolean:=false;
  v_existing_match public.rf_domino_012n_matches%rowtype;
  v_roster jsonb;
  v_match_target integer;
  v_match_capicua integer;
  v_match_round integer;
  v_entry_stake numeric(18,3);
  v_is_visible boolean;
  v_table_commission_pct numeric(7,3);
  v_points_seats_target integer:=4;
  v_new_match_id bigint;
  v_escrow_count integer:=0;
  v_new_roster jsonb:='[]'::jsonb;
  v_new_count integer:=0;
  v_old_count integer:=0;
  v_auto_row record;
begin
  IF auth.uid() IS NULL AND session_user <> 'postgres' THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
  if p_table_id is null then
    return jsonb_build_object(
      'ok',false,'started',false,'status','invalid_table','error','Mesa inválida'
    );
  end if;

  select dt.config_id
  into v_config_id
  from public.rf_domino_tables dt
  where dt.id=p_table_id;

  if v_config_id is null then
    return jsonb_build_object(
      'ok',false,'started',false,'status','table_not_found','error','La mesa no existe'
    );
  end if;

  perform pg_advisory_xact_lock(1242990000::bigint+v_config_id::bigint);
  perform pg_advisory_xact_lock(1242900000::bigint+p_table_id);

  if exists (select 1 from public.dfc_z37_points_matches m where m.engine_table_id=p_table_id and m.state in ('settled','cancelled')) then
    return jsonb_build_object('ok',true,'started',false,'status','points_target_reached');
  end if;

  select h.id
  into v_existing_hand
  from public.rf_domino_hands h
  where h.table_id=p_table_id
    and h.status in ('shuffling','playing')
  order by h.id desc
  limit 1;

  if v_existing_hand is not null then
    return jsonb_build_object(
      'ok',true,'started',false,'status','already_live','hand_id',v_existing_hand
    );
  end if;

  -- 0.12F: dar a todos los teléfonos tiempo de ver la última ficha,
  -- la celebración y la llegada visual de monedas al saldo.
  if exists (
    select 1 from public.rf_domino_hands last_hand
    where last_hand.table_id=p_table_id and last_hand.status='settled'
      and last_hand.settled_at > clock_timestamp() - (CASE WHEN coalesce(last_hand.winner_reason,'') ILIKE '%TRANQUE%' THEN interval '21 seconds' ELSE interval '13 seconds' END)
  ) then
    return jsonb_build_object('ok',true,'started',false,'status','celebration_pending');
  end if;

  begin
    select dc.*
    into v_cfg
    from public.rf_domino_tables dt
    join public.rf_domino_configs dc on dc.id=dt.config_id
    where dt.id=p_table_id;

    if not found or (not v_cfg.active and not exists (select 1 from public.dfc_z37_points_matches m where m.engine_table_id=p_table_id and m.state='playing')) then
      return jsonb_build_object(
        'ok',false,'started',false,'status','config_unavailable',
        'error','Configuración de Dominó no disponible'
      );
    end if;

    -- 0.12O: la modalidad pertenece al ID físico de mesa, nunca a toda la categoría.
    SELECT (coalesce(m.game_mode,'normal')='points'),
      coalesce(m.points_target,100),coalesce(m.capicua_bonus,30),
      coalesce(m.pass_round_bonus,20)
      INTO v_points_mode,v_match_target,v_match_capicua,v_match_round
    FROM public.rf_domino_tables t
      LEFT JOIN public.rf_domino_012o_table_modes m ON m.table_id=t.id
    WHERE t.id=p_table_id;
    IF v_points_mode THEN
      SELECT coalesce(points_seats_target,4) INTO v_points_seats_target
      FROM public.rf_domino_012o_table_modes WHERE table_id=p_table_id;
      SELECT * INTO v_existing_match FROM public.rf_domino_012n_matches
      WHERE table_id=p_table_id AND status='active' FOR UPDATE;
    END IF;
    -- 0.12P: un aporte fijo POR PARTIDA de puntos, no por mano.
    SELECT coalesce(m.is_visible,true),greatest(v_cfg.min_entry,coalesce(m.entry_stake,v_cfg.hand_stake)),m.commission_pct
      INTO v_is_visible,v_entry_stake,v_table_commission_pct
    FROM public.rf_domino_012o_table_modes m WHERE m.table_id=p_table_id;
    IF coalesce(v_is_visible,true)=false AND (NOT v_points_mode OR v_existing_match.id IS NULL) THEN
      RETURN jsonb_build_object('ok',true,'started',false,'status','table_hidden');
    END IF;
    IF v_points_mode THEN
      v_cfg.hand_stake:=coalesce(v_entry_stake,greatest(v_cfg.min_entry,v_cfg.hand_stake));
      v_cfg.min_continue_balance:=v_cfg.hand_stake;
    END IF;

    -- 1.9.9: antes de cobrar/repartir, conservar un asiento libre para la próxima persona.
    -- Si una mano está en curso el reconciliador NO mueve ningún asiento.
    IF NOT v_points_mode THEN
      perform public.rf_domino_bot_reconcile_idle_v199(p_table_id);
    END IF;

    -- 0.12Z: rearmar el aporte de una NUEVA partida por puntos de modo
    -- ATÓMICO y solo desde saldo ya transferido a la mesa, nunca del principal.
    -- El clic original «Sentarme» consiente esta continuidad; no repetir comisión.
    IF v_points_mode AND v_existing_match.id IS NULL THEN
      FOR v_auto_row IN
       SELECT ds.id AS seat_id,ds.user_id,e.amount
       FROM public.rf_domino_seats ds
       JOIN public.rf_domino_012r_escrow e ON e.table_id=ds.table_id AND e.user_id=ds.user_id
       JOIN public.rf_domino_012z_auto_consent a ON a.table_id=ds.table_id AND a.user_id=ds.user_id
       WHERE ds.table_id=p_table_id AND ds.state='active' AND e.status IN('paid','refunded')
         AND ds.table_balance>=e.amount AND e.amount>0
       ORDER BY ds.seat_no FOR UPDATE OF ds,e
      LOOP
       UPDATE public.rf_domino_seats ds
         SET table_balance=table_balance-v_auto_row.amount,is_ready=true
         WHERE ds.id=v_auto_row.seat_id AND ds.table_balance>=v_auto_row.amount;
       IF NOT FOUND THEN RAISE EXCEPTION 'Reserva automática concurrente: reintentar'; END IF;
       UPDATE public.rf_domino_012r_escrow e SET status='reserved',match_id=NULL,updated_at=now()
        WHERE e.table_id=p_table_id AND e.user_id=v_auto_row.user_id AND e.status IN('paid','refunded');
       IF NOT FOUND THEN RAISE EXCEPTION 'El aporte ya fue reservado en otra operación';END IF;
      END LOOP;
    END IF;
    -- 0.12Z: la segunda confirmación fue eliminada; preparar asientos aptos.
    IF v_points_mode THEN
      UPDATE public.rf_domino_seats ds SET is_ready=true
      WHERE ds.table_id=p_table_id AND ds.state='active' AND ds.is_ready=false
       AND EXISTS(SELECT 1 FROM public.rf_domino_012r_escrow e
        WHERE e.table_id=p_table_id AND e.user_id=ds.user_id AND
         ((v_existing_match.id IS NULL AND e.status='reserved') OR
          (v_existing_match.id IS NOT NULL AND
           ((e.status='committed' AND e.match_id=v_existing_match.id) OR e.status='reserved'))));
    ELSE
      UPDATE public.rf_domino_seats ds SET is_ready=true
       WHERE ds.table_id=p_table_id AND ds.state='active' AND ds.is_ready=false
        AND ds.table_balance>=greatest(v_cfg.min_continue_balance,v_cfg.hand_stake);
    END IF;

    -- 0.12J: No expulsar al jugador con saldo bajo. Mantener su asiento,
    -- pausar su confirmación y ofrecer la transferencia personal→mesa.
    -- Los jugadores con saldo suficiente sí pueden iniciar la siguiente mano.
    IF NOT v_points_mode THEN
    update public.rf_domino_seats ds set is_ready=false
      where ds.table_id=p_table_id and ds.state='active'
        and ds.table_balance<greatest(v_cfg.min_continue_balance,v_cfg.hand_stake)
        and ds.is_ready is distinct from false;
    END IF;
    -- Los asientos ya abandonados siguen las reglas originales de salida.
    for v_rec in
      select ds.id from public.rf_domino_seats ds
      where ds.table_id=p_table_id and ds.state<>'active' for update
    loop
      perform public.rf_domino_return_seat_v11(v_rec.id,'Salida antes de nueva mano');
    end loop;

    select count(*)
    into v_count
    from public.rf_domino_seats ds
    where ds.table_id=p_table_id
      and ds.state='active'
      and ds.is_ready=true
      and ((v_points_mode AND EXISTS(
          SELECT 1 FROM public.rf_domino_012r_escrow e
          WHERE e.table_id=ds.table_id AND e.user_id=ds.user_id
          AND ((v_existing_match.id IS NULL AND e.status='reserved') OR
               (v_existing_match.id IS NOT NULL AND ((e.status='committed' AND e.match_id=v_existing_match.id) OR e.status='reserved')))
       )) OR
           (NOT v_points_mode AND ds.table_balance>=greatest(v_cfg.min_continue_balance,v_cfg.hand_stake)));

    if v_count<2 then
      return jsonb_build_object(
        'ok',true,'started',false,'status','waiting_ready','ready_players',v_count
      );
    end if;

    if v_count>4 then
      raise exception 'Cantidad inválida de jugadores confirmados: %',v_count;
    end if;

    -- Se permiten 2,3 o 4 jugadores según el cupo máximo de la mesa.
    IF v_points_mode AND v_count>v_points_seats_target THEN
      RAISE EXCEPTION 'Superado cupo de mesa por puntos';END IF;
    IF v_points_mode AND v_existing_match.id IS NOT NULL THEN
      -- Los participantes originales mantienen sus puntos y participaciones;
      -- los nuevos aparecen SOLO desde este siguiente reparto.
      SELECT coalesce(jsonb_agg(jsonb_build_object('user_id',ds.user_id,'seat_no',ds.seat_no)
        ORDER BY ds.seat_no),'[]'::jsonb),count(*)
        INTO v_new_roster,v_new_count
      FROM public.rf_domino_seats ds
      JOIN public.rf_domino_012r_escrow e ON e.table_id=ds.table_id AND e.user_id=ds.user_id
      WHERE ds.table_id=p_table_id AND ds.state='active' AND ds.is_ready=true
        AND e.status='reserved';
      v_old_count:=jsonb_array_length(v_existing_match.roster);
      IF v_old_count+v_new_count>v_points_seats_target THEN
        RETURN jsonb_build_object('ok',true,'started',false,'status','points_capacity_reached');END IF;
      -- Deben mantenerse en la mesa 2 participantes aptos como mínimo.
    END IF;
    v_player_count:=v_count;
    v_stake:=CASE WHEN v_points_mode AND v_existing_match.id IS NOT NULL
       THEN coalesce((SELECT sum(e.amount) FROM public.rf_domino_012r_escrow e
           WHERE e.table_id=p_table_id AND e.status='reserved'
             AND EXISTS(SELECT 1 FROM public.rf_domino_seats ds WHERE ds.table_id=e.table_id
               AND ds.user_id=e.user_id AND ds.state='active' AND ds.is_ready=true)),0)
       ELSE round(v_cfg.hand_stake*v_count,3) END;
    IF v_points_mode AND v_existing_match.id IS NULL THEN
      SELECT count(*),coalesce(sum(e.amount),0) INTO v_escrow_count,v_stake
      FROM public.rf_domino_012r_escrow e
      JOIN public.rf_domino_seats ds ON ds.table_id=e.table_id AND ds.user_id=e.user_id
      WHERE e.table_id=p_table_id AND e.status='reserved'
       AND ds.state='active' AND ds.is_ready=true;
      IF v_escrow_count<>v_count THEN RAISE EXCEPTION 'Faltan aportes reservados'; END IF;
    END IF;
    v_commission:=round(v_stake*coalesce(v_table_commission_pct,v_cfg.commission_pct)/100,3);

    IF NOT v_points_mode THEN
    update public.rf_domino_seats ds
    set table_balance=ds.table_balance-v_cfg.hand_stake
    where ds.table_id=p_table_id
      and ds.state='active'
      and ds.is_ready=true
      and ds.table_balance>=greatest(v_cfg.min_continue_balance,v_cfg.hand_stake);

    get diagnostics v_debited = row_count;

    if v_debited<>v_count then
      raise exception 'No se pudo reservar la apuesta de todos los jugadores (%/%).',
        v_debited,v_count;
    end if;

    END IF;

    insert into public.rf_domino_hands(
      table_id,status,pot,commission,play_starts_at
    )
    values(
      p_table_id,'shuffling',v_stake,v_commission,
      now()+interval '14 seconds'
    )
    returning id into v_hand_id;

    -- Stage 1: persist the roster but NOT any actual tile. No user owns a tile during shuffle.
    insert into public.rf_domino_hand_players(hand_id,user_id,seat_no,tiles)
    select v_hand_id,ds.user_id,ds.seat_no,'[]'::jsonb
    from public.rf_domino_seats ds
    where ds.table_id=p_table_id and ds.state='active' and ds.is_ready=true
    order by ds.seat_no;
    IF v_points_mode AND v_existing_match.id IS NULL THEN
      SELECT coalesce(jsonb_agg(jsonb_build_object('user_id',hp.user_id,'seat_no',hp.seat_no)
        ORDER BY hp.seat_no),'[]'::jsonb) INTO v_roster
      FROM public.rf_domino_hand_players hp WHERE hp.hand_id=v_hand_id;
      INSERT INTO public.rf_domino_012n_matches(table_id,config_id,roster,target,
        capicua_bonus,pass_round_bonus,stake_pot,commission)
      VALUES(p_table_id,v_config_id,v_roster,v_match_target,
        v_match_capicua,v_match_round,v_stake,v_commission) RETURNING id INTO v_new_match_id;
      UPDATE public.rf_domino_012r_escrow e SET status='committed',match_id=v_new_match_id,updated_at=now()
      FROM public.rf_domino_hand_players hp
      WHERE hp.hand_id=v_hand_id AND e.table_id=p_table_id AND e.user_id=hp.user_id AND e.status='reserved';
      GET DIAGNOSTICS v_debited=ROW_COUNT;
      IF v_debited<>v_count THEN RAISE EXCEPTION 'No se confirmó el bote completo'; END IF;
    END IF;
    IF v_points_mode AND v_existing_match.id IS NOT NULL AND v_new_count>0 THEN
       IF EXISTS(SELECT 1 FROM jsonb_array_elements(v_new_roster) j
         WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(v_existing_match.roster) prior
         WHERE (j->>'user_id')=prior->>'user_id' OR (j->>'seat_no')=prior->>'seat_no'))
       THEN RAISE EXCEPTION 'Jugador o asiento duplicado en la partida por puntos';END IF;
       UPDATE public.rf_domino_012n_matches m
        SET roster=m.roster||v_new_roster,stake_pot=m.stake_pot+v_stake,
            commission=m.commission+v_commission
        WHERE m.id=v_existing_match.id AND m.status='active';
       UPDATE public.rf_domino_012r_escrow e SET status='committed',
         match_id=v_existing_match.id,updated_at=now()
       FROM public.rf_domino_hand_players hp WHERE hp.hand_id=v_hand_id
         AND e.table_id=p_table_id AND e.user_id=hp.user_id AND e.status='reserved';
       GET DIAGNOSTICS v_debited=ROW_COUNT;
       IF v_debited<>v_new_count THEN RAISE EXCEPTION 'Aporte nuevo no comprometido';END IF;
    END IF;
    v_players_dealt:=0;v_tiles_dealt:=0;v_unique_tiles:=0;
    -- Stage 2 is triggered by rf_domino_finish_shuffle_v012d, only after 7 real seconds.
    if v_commission>0 then
      perform public.rf_domino_credit_admin_v11(
        v_commission,
        'DOMINO_COMISION',
        'Comisión de mano · Mesa '||p_table_id||' · Mano '||v_hand_id,
        null
      );
    end if;

    return jsonb_build_object(
      'ok',true,
      'started',true,
      'status','started',
      'hand_id',v_hand_id,
      'ready_players',v_count,
      'players_dealt',v_players_dealt,
      'tiles_dealt',v_tiles_dealt,
      'unique_tiles',v_unique_tiles
    );

  exception when others then
    return jsonb_build_object(
      'ok',false,
      'started',false,
      'status','start_error',
      'error',sqlerrm,
      'sqlstate',sqlstate,
      'table_id',p_table_id
    );
  end;
end
$function$
;
insert into public.dfc_z37_points_configs(id,name,enabled,players,target_points,entry_fc,entry_diamonds,max_negative_diamonds,admin_pct)
values('b3abde40-ea42-4a52-ab24-0ce93c090200','Mesa por puntos · Prueba gratis',true,2,200,0,0,0,0);
create function public.dfc_z37_points_join_engine(p_config uuid, p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid := auth.uid();
  game public.dfc_z37_points_matches%rowtype;
  seat_count integer;
  table_key bigint;
  started jsonb;
begin
  if uid is null or p_request is null or p_config is distinct from 'b3abde40-ea42-4a52-ab24-0ce93c090200'::uuid then
    raise exception 'Inicia sesión para entrar a la mesa de prueba';
  end if;
  perform pg_advisory_xact_lock(pg_catalog.hashtextextended(p_config::text,37));
  perform 1 from public.dfc_z37_points_configs where id=p_config and enabled and players=2
    and entry_fc=0 and entry_diamonds=0 and admin_pct=0 and target_points=200 for share;
  if not found then raise exception 'Mesa de prueba fuera de servicio'; end if;
  select m.* into game from public.dfc_z37_points_matches m
  join public.dfc_z37_points_participants p on p.match_id=m.id
  where p.user_id=uid and m.config_id=p_config and m.state in ('waiting','playing')
  order by m.created_at desc limit 1 for update of m;
  if found and game.state='playing' then
    return jsonb_build_object('state','playing','table_id',game.engine_table_id);
  end if;
  if exists (select 1 from public.rf_domino_seats where user_id=uid) then
    raise exception 'Sal de tu mesa actual antes de entrar a la prueba';
  end if;
  if game.id is null then
    select * into game from public.dfc_z37_points_matches
    where config_id=p_config and state='waiting' order by created_at limit 1 for update;
    if not found then
      insert into public.dfc_z37_points_matches(config_id,players,target_points,entry_fc,entry_diamonds,admin_pct)
      values(p_config,2,200,0,0,0) returning * into game;
    end if;
  end if;
  if not exists (select 1 from public.dfc_z37_points_participants where match_id=game.id and user_id=uid) then
    select count(*) into seat_count from public.dfc_z37_points_participants where match_id=game.id;
    insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged)
    values(game.id,uid,seat_count+1,seat_count+1,true);
  end if;
  select count(*) into seat_count from public.dfc_z37_points_participants where match_id=game.id;
  if seat_count<2 then return jsonb_build_object('state','waiting','seated',seat_count,'capacity',2); end if;
  if exists (select 1 from public.rf_domino_seats s join public.dfc_z37_points_participants p on p.user_id=s.user_id where p.match_id=game.id) then
    raise exception 'Uno de los jugadores ya está sentado en otra mesa';
  end if;
  table_key:=public.dfc_z37_prepare_points_table_internal(game.id);
  insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready)
  select table_key,user_id,seat_number,0,'active',true from public.dfc_z37_points_participants where match_id=game.id;
  update public.dfc_z37_points_matches set state='playing' where id=game.id;
  started:=public.rf_domino_try_start_v189(table_key);
  if not coalesce((started->>'started')::boolean,false) then
    raise exception 'El motor no inició la prueba: %',started;
  end if;
  return jsonb_build_object('state','playing','table_id',table_key);
end $$;
revoke all on function public.dfc_z37_points_join_engine(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.dfc_z37_points_join_engine(uuid,uuid) to authenticated;
