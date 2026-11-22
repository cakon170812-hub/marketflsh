CREATE TABLE dfc_private.points_final_players (
  match_id uuid NOT NULL REFERENCES public.dfc_z37_points_matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  seat_number smallint NOT NULL,
  table_id bigint,
  place integer NOT NULL,
  table_balance numeric,
  auto_mode boolean NOT NULL,
  continued_at timestamptz,
  legacy_until timestamptz,
  manual_client boolean NOT NULL DEFAULT false,
  PRIMARY KEY (match_id,user_id)
);
CREATE INDEX points_final_players_auto_table_idx
 ON dfc_private.points_final_players(user_id,table_id,match_id) WHERE auto_mode;
ALTER TABLE dfc_private.points_final_players ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON dfc_private.points_final_players FROM PUBLIC, anon, authenticated;

CREATE FUNCTION dfc_private.points_replay_opens_for(m public.dfc_z37_points_matches, p_user uuid)
RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT CASE WHEN f.match_id IS NOT NULL THEN coalesce(f.continued_at,f.legacy_until) ELSE dfc_private.points_replay_opens(m) END
  FROM (SELECT 1) seed LEFT JOIN dfc_private.points_final_players f ON f.match_id=m.id AND f.user_id=p_user
$function$;
REVOKE ALL ON FUNCTION dfc_private.points_replay_opens_for(public.dfc_z37_points_matches,uuid) FROM PUBLIC;

CREATE FUNCTION dfc_private.points_replay_can_rotate(m public.dfc_z37_points_matches)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT dfc_private.points_replay_ready(m) OR CASE
    WHEN EXISTS (SELECT 1 FROM dfc_private.points_final_players f WHERE f.match_id=m.id) THEN NOT EXISTS (
      SELECT 1
      FROM dfc_private.points_final_players f
      JOIN public.dfc_z37_points_participants p ON p.match_id=f.match_id AND p.user_id=f.user_id
      JOIN public.rf_domino_seats s ON s.table_id=m.engine_table_id AND s.user_id=p.user_id AND s.state='active'
      WHERE f.match_id=m.id AND NOT f.auto_mode AND p.replay_confirmed_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM public.rf_domino_bot_instances_v18 b WHERE b.user_id=p.user_id)
        AND (coalesce(f.continued_at,f.legacy_until) IS NULL
             OR coalesce(f.continued_at,f.legacy_until)+interval '10 seconds'>clock_timestamp()
             OR dfc_private.points_replay_funding_required(m,p.user_id))
    )
    ELSE dfc_private.points_replay_opens(m)+interval '10 seconds'<=clock_timestamp()
      AND NOT dfc_private.points_replay_funding_required(m)
  END
$function$;
REVOKE ALL ON FUNCTION dfc_private.points_replay_can_rotate(public.dfc_z37_points_matches) FROM PUBLIC;

CREATE OR REPLACE FUNCTION dfc_private.issue_points_fc_card()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE payout record; paid_balance numeric;
BEGIN
 INSERT INTO dfc_private.points_final_players(match_id,user_id,seat_number,table_id,place,table_balance,auto_mode)
 SELECT new.id,p.user_id,p.seat_number,new.engine_table_id,
   dense_rank() OVER (ORDER BY (p.team IS NOT DISTINCT FROM new.winner_team) DESC,
     CASE WHEN new.players=4 THEN CASE p.team WHEN 1 THEN new.team_a_points ELSE new.team_b_points END
          ELSE p.points_individual END DESC),
   s.table_balance,
   p.absent_at IS NOT NULL OR coalesce(ctrl.auto_mode,false)
 FROM public.dfc_z37_points_participants p
 LEFT JOIN public.rf_domino_seats s ON s.table_id=new.engine_table_id AND s.user_id=p.user_id
 LEFT JOIN public.dfc_z11_seat_control ctrl ON ctrl.table_id=new.engine_table_id AND ctrl.user_id=p.user_id
 WHERE p.match_id=new.id
 ON CONFLICT (match_id,user_id) DO NOTHING;

 FOR payout IN
   SELECT p.* FROM public.dfc_z37_points_payouts p
   JOIN dfc_private.points_final_players f USING(match_id,user_id)
   WHERE p.match_id=new.id AND f.auto_mode AND p.paid_at IS NULL AND NOT p.fc_card_issued
     AND NOT EXISTS (SELECT 1 FROM public.rf_domino_bot_instances_v18 b WHERE b.user_id=p.user_id)
   ORDER BY p.user_id FOR UPDATE OF p
 LOOP
   IF payout.fc_principal+payout.fc_profit>0 THEN
     UPDATE public.rf_profiles SET balance=balance+payout.fc_principal+payout.fc_profit,updated_at=clock_timestamp()
     WHERE id=payout.user_id RETURNING balance INTO STRICT paid_balance;
     INSERT INTO public.rf_wallet_ledger(user_id,delta,balance_after,movement_type,reference)
     VALUES(payout.user_id,payout.fc_principal+payout.fc_profit,paid_balance,
       'DOMINO_PUNTOS_PREMIO_AUTOMATICO','PUNTOS-AUTO:'||new.id||':'||payout.user_id);
   END IF;
   IF payout.diamond_principal+payout.diamond_profit>0 THEN
     PERFORM public.dfc_z9_diamond_transfer(NULL,payout.user_id,payout.diamond_principal+payout.diamond_profit,
       'points-diamond-auto:'||new.id||':'||payout.user_id,'DOMINO_PUNTOS_PREMIO_AUTOMATICO',false,'{}');
   END IF;
   UPDATE public.dfc_z37_points_payouts SET paid_at=clock_timestamp()
   WHERE match_id=new.id AND user_id=payout.user_id;
 END LOOP;

 insert into public.dfc_z31_gift_cards(points_match_id,recipient_id,amount,origin_name,origin_detail,expires_at,points_full_prize)
 select new.id,p.user_id,p.fc_principal+p.fc_profit,'Premio de mesa por puntos',c.name,
 case when e.expiry_days is not null then clock_timestamp()+make_interval(days=>e.expiry_days) end,true
 from public.dfc_z37_points_payouts p
 join public.dfc_z37_points_configs c on c.id=new.config_id
 left join dfc_private.z32_gift_expiry_config e on e.id=1
 where p.match_id=new.id and p.paid_at is null and p.fc_principal+p.fc_profit>0
 and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=p.user_id)
 on conflict do nothing;
 update public.dfc_z37_points_payouts p set fc_card_issued=true where p.match_id=new.id and exists(select 1 from public.dfc_z31_gift_cards g where g.points_match_id=p.match_id and g.recipient_id=p.user_id and g.points_full_prize);
 return new;
end $function$;

CREATE OR REPLACE FUNCTION dfc_private.points_mark_auto_departures()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.rf_domino_seats s SET state='leave_after_hand',is_ready=false
  FROM dfc_private.points_final_players f
  WHERE f.match_id=NEW.id AND f.user_id=s.user_id AND f.auto_mode
    AND s.table_id=NEW.engine_table_id AND s.state='active';
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.dfc_points_close_panel(p_match_id uuid, p_hand_id bigint, p_phase text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  uid uuid:=auth.uid();
  g public.dfc_z37_points_matches%rowtype;
  latest_hand bigint;
  hand_settled timestamptz;
  begins_at timestamptz;
  ends_at timestamptz;
  closed uuid[];
  finished timestamptz;
begin
  if uid is null or p_phase is null or p_phase not in ('hand','victory') then return false; end if;
  select * into g from public.dfc_z37_points_matches where id=p_match_id;
  if not found then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(g.config_id::text,37));
  select * into g from public.dfc_z37_points_matches where id=p_match_id for update;
  if not found or g.engine_table_id is null or g.state not in ('playing','settled') or not exists (
    select 1 from public.dfc_z37_points_participants p
    join public.rf_domino_seats s on s.table_id=g.engine_table_id and s.user_id=p.user_id and s.state='active'
    where p.match_id=g.id and p.user_id=uid
      and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=uid)
  ) then return false; end if;

  IF p_phase='victory' AND EXISTS (SELECT 1 FROM dfc_private.points_final_players f WHERE f.match_id=g.id) THEN
    IF g.state<>'settled' OR p_hand_id IS DISTINCT FROM 0 OR clock_timestamp()<dfc_private.points_victory_opens(g) THEN RETURN false; END IF;
    UPDATE dfc_private.points_final_players
    SET continued_at=coalesce(continued_at,clock_timestamp())
    WHERE match_id=g.id AND user_id=uid AND NOT auto_mode;
    RETURN found;
  END IF;

  if p_phase='hand' then
    select h.id,h.settled_at into latest_hand,hand_settled
    from public.dfc_z37_points_events e
    join public.rf_domino_hands h on h.id=e.engine_hand_id and h.status='settled'
    where e.match_id=g.id order by h.id desc limit 1;
    if latest_hand is null or p_hand_id is distinct from latest_hand then return false; end if;
    if exists(select 1 from public.rf_domino_hands h where h.table_id=g.engine_table_id
        and h.id>latest_hand and h.status in ('playing','shuffling')) then return false; end if;
    ends_at:=coalesce(g.settled_at,hand_settled)+interval '10 seconds';
  else
    if g.state<>'settled' or p_hand_id is distinct from 0 then return false; end if;
    begins_at:=dfc_private.points_victory_opens(g);
    ends_at:=begins_at+interval '10 seconds';
  end if;
  if ends_at is null or clock_timestamp()>=ends_at or clock_timestamp()<begins_at then return false; end if;

  insert into dfc_private.points_panel_closures as c(match_id,hand_id,phase,closed_by,is_final)
  values(g.id,p_hand_id,p_phase,array[uid],g.state='settled')
  on conflict (match_id,hand_id,phase) do update
  set closed_by=case when uid=any(c.closed_by) then c.closed_by else array_append(c.closed_by,uid) end,
      is_final=c.is_final or excluded.is_final
  returning c.closed_by,c.completed_at into closed,finished;
  if finished is not null then return true; end if;

  if not exists(
    select 1 from public.dfc_z37_points_participants p
    join public.rf_domino_seats s on s.table_id=g.engine_table_id and s.user_id=p.user_id and s.state='active'
    where p.match_id=g.id and not (p.user_id=any(closed))
      and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=p.user_id)
  ) then
    update dfc_private.points_panel_closures set completed_at=clock_timestamp()
    where match_id=g.id and hand_id=p_hand_id and phase=p_phase;
    if p_phase='hand' and g.state='playing' then
      begin
        perform public.rf_domino_try_start_v189(g.engine_table_id);
      exception when others then
        raise warning 'Reintento de barajeo Por puntos %: %', g.engine_table_id, SQLSTATE;
      end;
    end if;
  end if;
  return true;
end;
$function$;

CREATE FUNCTION dfc_private.points_scoreboard_with_final(p_table_id bigint)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select jsonb_build_object(
  'entry_terms',dfc_private.points_terms(coalesce(m.players,c.players),
   coalesce(m.target_points,c.target_points),coalesce(m.entry_fc,c.entry_fc),coalesce(m.entry_diamonds,c.entry_diamonds),
   coalesce(m.admin_pct,c.admin_pct),coalesce(m.diamond_admin_pct,c.diamond_admin_pct),coalesce(m.pass_fee_fc,c.pass_fee_fc)),
  'config_id',m.config_id,'table_name',c.name,'pass_fee_fc',coalesce(m.pass_fee_fc,c.pass_fee_fc),
  'replay_can_confirm',c.enabled and (replay.terms->>'players')::int=m.players,
  'replay_closed_reason',case when not c.enabled then 'disabled' when (replay.terms->>'players')::int<>m.players then 'capacity' end,
  'replay_terms',case when m.state='settled' and viewer.is_participant then replay.terms end,
  'replay_pass_fee_fc',(replay.terms->>'pass_fee_fc')::numeric,
  'can_join',c.enabled and dfc_private.points_waiting_board_eligible(m,c) and
    dfc_private.points_board_can_join(m),
  'my_prize',(select jsonb_build_object('id',g.id,'amount',g.amount,'redeemed',g.redeemed_at is not null) from public.dfc_z31_gift_cards g where g.points_match_id=m.id and g.recipient_id=auth.uid() and g.points_full_prize),
  'capacity',m.players,'entry_fc',m.entry_fc,'entry_diamonds',m.entry_diamonds,'starts_at',m.starts_at,'match_id',m.id,'target',m.target_points,'state',m.state,'winner_team',m.winner_team,
  'replay_seat_released',m.state='settled' and not exists(
     select 1 from public.rf_domino_seats s where s.table_id=m.engine_table_id and s.user_id=auth.uid() and s.state='active'
  ),
  'replay_fc_missing',case when m.state='settled' and (replay.terms->>'entry_fc')::numeric>0
    then greatest(0,(replay.terms->>'entry_fc')::numeric-coalesce((select u.balance from public.rf_profiles u where u.id=auth.uid()),0)) else 0 end,
  'verifying_contributions',CASE WHEN m.state='waiting' AND (
    SELECT count(*) FROM public.dfc_z37_points_participants p
    JOIN public.rf_domino_seats s
      ON s.table_id=m.engine_table_id AND s.user_id=p.user_id AND s.state='active'
    WHERE p.match_id=m.id AND p.charged
  )=m.players THEN NOT dfc_private.points_contributions_ready(m) ELSE false END,
  'live_pot_fc',coalesce((select sum(r.amount) from public.dfc_z37_points_fc_reserves r where r.match_id=m.id and r.status='reserved'),0),
  'live_pot_diamonds',coalesce((select sum(r.amount) from public.dfc_z37_points_diamond_reserves r where r.match_id=m.id and r.state='reserved'),0),
  'pot_fc',coalesce((select sum(p.fc_principal+p.fc_profit) from public.dfc_z37_points_payouts p where p.match_id=m.id),0),
  'pot_diamonds',coalesce((select sum(p.diamond_principal+p.diamond_profit) from public.dfc_z37_points_payouts p where p.match_id=m.id),0),
  'victory_manual',viewer.is_participant AND EXISTS (SELECT 1 FROM dfc_private.points_final_players f WHERE f.match_id=m.id),
  'victory_auto',viewer.is_participant AND EXISTS (SELECT 1 FROM dfc_private.points_final_players f WHERE f.match_id=m.id AND f.user_id=auth.uid() AND f.auto_mode),
  'replay_opens',case when viewer.is_participant and m.state='settled' and (m.replay_v2 or m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') then dfc_private.points_replay_opens_for(m,auth.uid()) end,
  'replay_funding_required',viewer.is_participant and m.state='settled' and dfc_private.points_replay_funding_required(m,auth.uid()),
  'replay_deadline',case when viewer.is_participant and m.state='settled' and (m.replay_v2 or m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') then dfc_private.points_replay_opens_for(m,auth.uid())+interval '10 seconds' end,
  'match_settled_at',case when viewer.is_participant and m.state='settled' then m.settled_at end,
  'victory_opens',case when viewer.is_participant and m.state='settled' then dfc_private.points_victory_opens(m) end,
  'victory_closed',viewer.is_participant and (exists (
    SELECT 1 FROM dfc_private.points_final_players f WHERE f.match_id=m.id AND f.user_id=auth.uid() AND f.continued_at IS NOT NULL
  ) OR exists(
    select 1 from dfc_private.points_panel_closures c where c.match_id=m.id and c.hand_id=0
      and c.phase='victory' and auth.uid()=any(c.closed_by))),
  'server_time',statement_timestamp(),
  'my_table_funding',case when viewer.is_participant then (
    select jsonb_build_object('table_balance',s.table_balance,'wallet_fc',profile.balance,
      'missing_fc',greatest(0,c.min_pass_balance_fc-s.table_balance))
    from public.rf_domino_seats s
    join public.rf_profiles profile on profile.id=s.user_id
    where s.table_id=m.engine_table_id and s.user_id=auth.uid() and s.state='active'
  ) end,
  'replay_confirmed',exists(select 1 from public.dfc_z37_points_participants p where p.match_id=m.id and p.user_id=auth.uid() and p.replay_confirmed_at is not null),
  'players',coalesce((
    select jsonb_agg(jsonb_build_object('seat',p.seat_number,'team',p.team,
      'avatar',CASE WHEN viewer.is_participant AND m.state='settled' THEN u.avatar_url END,
      'place',f.place,'final_table_balance',f.table_balance,
      'points',case when m.players=4 then case p.team when 1 then m.team_a_points else m.team_b_points end else p.points_individual end,'mine',p.user_id=auth.uid(),
      'name',coalesce(nullif(trim(concat_ws(' ',u.first_name,u.last_name)),''),'Jugador '||p.seat_number))
      order by p.seat_number)
    from public.dfc_z37_points_participants p left join public.rf_profiles u on u.id=p.user_id
    left join dfc_private.points_final_players f on f.match_id=p.match_id and f.user_id=p.user_id and viewer.is_participant
    where p.match_id=m.id
  ),'[]'::jsonb),
  'last_hand',case when viewer.is_participant then (
    select jsonb_build_object('id',h.id::text,'settled_at',h.settled_at,'closed',exists(
        select 1 from dfc_private.points_panel_closures c where c.match_id=m.id and c.hand_id=h.id
          and c.phase='hand' and auth.uid()=any(c.closed_by)), 'points',e.points,'kind',e.event_type,
      'seat',winner.seat_number,'deciding_tile',(
         select mv.tile from public.rf_domino_moves mv where mv.hand_id=h.id and mv.action in ('PLAY','AUTO_PLAY')
         order by mv.id desc limit 1
      ),'remaining',coalesce((
         select jsonb_agg(jsonb_build_object('seat',p.seat_number,'tiles',hp.tiles,
            'points',public.rf_domino_tiles_pips_v11(hp.tiles)) order by p.seat_number)
         from public.rf_domino_hand_players hp
         join public.dfc_z37_points_participants p on p.match_id=m.id and p.user_id=hp.user_id
         where hp.hand_id=h.id
      ),'[]'::jsonb))
    from public.dfc_z37_points_events e join public.rf_domino_hands h on h.id=e.engine_hand_id and h.status='settled'
    join public.dfc_z37_points_participants winner on winner.match_id=m.id and winner.user_id=e.user_id
    where e.match_id=m.id order by h.id desc limit 1
  ) end)
 from public.dfc_z37_points_matches m
 join public.dfc_z37_points_configs c on c.id=m.config_id
 cross join lateral (select exists(select 1 from public.dfc_z37_points_participants p where p.match_id=m.id and p.user_id=auth.uid()) as is_participant) viewer
 cross join lateral (select dfc_private.points_replay_terms(m,c) as terms) replay
 where auth.uid() is not null and (
   (m.engine_table_id=p_table_id and m.state in ('waiting','playing','settled')
      and (viewer.is_participant or (c.enabled and m.state in ('waiting','playing','settled'))))
   or (m.engine_table_id is null and m.state='settled' and m.settled_at>statement_timestamp()-interval '1 day'
     and exists (select 1 from dfc_private.points_final_players f
       where f.match_id=m.id and f.table_id=p_table_id and f.user_id=auth.uid() and f.auto_mode))
 )
 order by (m.engine_table_id is not null and viewer.is_participant) desc, viewer.is_participant desc, m.created_at desc
 limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.dfc_points_replay_choice_with_balance(p_match_id uuid, p_choice text, p_terms jsonb, p_add_fc numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 uid uuid:=auth.uid();
 game public.dfc_z37_points_matches%rowtype;
 cfg public.dfc_z37_points_configs%rowtype;
 seat public.rf_domino_seats%rowtype;
 current_terms jsonb;
 minimum numeric;
 missing numeric;
 funding_required boolean;
 wallet numeric;
 entry numeric;
 total numeric;
 shortage_details text;
BEGIN
 IF uid IS NULL OR p_choice NOT IN ('check','confirm','exit','timeout') THEN
   RAISE EXCEPTION 'Selección de revancha inválida';
 END IF;
 IF p_choice='confirm' AND (p_add_fc IS NULL OR p_add_fc<0 OR p_add_fc>10000
                            OR round(p_add_fc,3)<>p_add_fc) THEN
   RAISE EXCEPTION 'Importe de recarga inválido';
 END IF;
 SELECT * INTO game FROM public.dfc_z37_points_matches WHERE id=p_match_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Partida no disponible'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(game.config_id::text,37));
 SELECT * INTO STRICT game FROM public.dfc_z37_points_matches WHERE id=p_match_id FOR UPDATE;
 IF game.state<>'settled' OR NOT EXISTS(
    SELECT 1 FROM public.dfc_z37_points_participants WHERE match_id=game.id AND user_id=uid
 ) THEN RAISE EXCEPTION 'La revancha no está disponible'; END IF;
 IF EXISTS(SELECT 1 FROM public.dfc_z37_points_participants
           WHERE match_id=game.id AND user_id=uid AND replay_confirmed_at IS NOT NULL) THEN
   RETURN jsonb_build_object('state','confirmed');
 END IF;
 -- Lock profile before seat, consistent with the first-join and cash-transfer flows.
 SELECT balance INTO wallet FROM public.rf_profiles WHERE id=uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Perfil sin cartera de FlashCoin'; END IF;
 SELECT * INTO seat FROM public.rf_domino_seats
 WHERE table_id=game.engine_table_id AND user_id=uid AND state='active' FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('state','left'); END IF;
 funding_required:=dfc_private.points_replay_funding_required(game,uid);
 IF p_choice='exit' OR (p_choice='timeout' AND NOT funding_required
      AND clock_timestamp()>=(dfc_private.points_replay_opens_for(game,uid)+interval '10 seconds')) THEN
   PERFORM public.rf_domino_return_seat_v11(seat.id,'Salida de la revancha Por puntos');
   RETURN jsonb_build_object('state','left');
 END IF;
 IF p_choice='confirm' AND dfc_private.points_replay_opens_for(game,uid) IS NULL THEN
   RAISE EXCEPTION 'Toca Continuar para abrir la revancha';
 END IF;
 IF p_choice='timeout' THEN RETURN jsonb_build_object('state','pending'); END IF;
 SELECT * INTO STRICT cfg FROM public.dfc_z37_points_configs WHERE id=game.config_id FOR SHARE;
 current_terms:=dfc_private.points_replay_terms(game,cfg);
 IF NOT cfg.enabled OR (current_terms->>'players')::integer<>game.players THEN
   IF p_choice='confirm' THEN RAISE EXCEPTION 'La revancha está cerrada. Regresa a Mesas por puntos.'; END IF;
   RETURN jsonb_build_object('state','pending');
 END IF;
 IF current_terms IS DISTINCT FROM p_terms THEN
   IF p_choice='confirm' THEN
     RAISE EXCEPTION USING errcode='DF001',message='Cambiaron las condiciones. Revísalas y confirma de nuevo.';
   END IF;
   RETURN jsonb_build_object('state','pending');
 END IF;
 minimum:=cfg.min_pass_balance_fc;
 missing:=greatest(0,minimum-coalesce(seat.table_balance,0));
 entry:=coalesce((current_terms->>'entry_fc')::numeric,0);
 total:=entry+coalesce(p_add_fc,0);
 IF p_choice='check' THEN
   RETURN jsonb_build_object('state','pending','table_balance',seat.table_balance,
                             'minimum_fc',minimum,'missing_fc',missing,'entry_fc',entry,
                             'wallet_fc',wallet);
 END IF;
 IF p_add_fc<missing THEN
   RETURN jsonb_build_object('state','topup_required','table_balance',seat.table_balance,
                             'minimum_fc',minimum,'missing_fc',missing,'entry_fc',entry);
 END IF;
 BEGIN
  PERFORM dfc_private.points_require_entry_funds(uid,total,(current_terms->>'entry_diamonds')::numeric);
 EXCEPTION WHEN SQLSTATE 'DF004' THEN
  GET STACKED DIAGNOSTICS shortage_details=PG_EXCEPTION_DETAIL;
  RETURN jsonb_build_object('state','insufficient','wallet_fc',wallet,
    'required_fc',total,'entry_fc',entry,'added_fc',p_add_fc,'message',SQLERRM)||shortage_details::jsonb;
 END;
 IF p_add_fc>0 THEN
   UPDATE public.rf_profiles SET balance=balance-p_add_fc,updated_at=now()
   WHERE id=uid AND balance >=entry+p_add_fc;
   IF NOT FOUND THEN RAISE EXCEPTION 'Saldo FlashCoin insuficiente'; END IF;
   UPDATE public.rf_domino_seats SET table_balance=table_balance+p_add_fc WHERE id=seat.id;
   PERFORM public.rf_add_ledger(uid,-p_add_fc,'DOMINO_PUNTOS_RECARGA_REvancha',
                                'Revancha '||game.id,uid);
 END IF;
 PERFORM dfc_private.confirm_points_replay_at_terms(game.id,p_terms,funding_required);
 PERFORM dfc_private.start_confirmed_points_replay(game.id);
 RETURN jsonb_build_object('state','confirmed','added_fc',p_add_fc,
            'table_balance',seat.table_balance+p_add_fc,'entry_fc',entry);
END $function$;

CREATE OR REPLACE FUNCTION dfc_private.confirm_points_replay_at_terms(p_match_id uuid, p_terms jsonb, p_funding_required boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare g public.dfc_z37_points_matches%rowtype; n uuid; quoted_terms jsonb; cfg public.dfc_z37_points_configs%rowtype; s public.rf_domino_seats%rowtype; uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Inicia sesión para continuar'; end if;
 select * into g from public.dfc_z37_points_matches where id=p_match_id;
 if not found then raise exception 'Partida no disponible'; end if;
 perform pg_advisory_xact_lock(hashtextextended(g.config_id::text,37));
 select * into strict g from public.dfc_z37_points_matches where id=p_match_id for update;
 if exists(select 1 from public.dfc_z37_points_participants where match_id=g.id and user_id=uid and replay_confirmed_at is not null) then return true; end if;
 if g.state<>'settled' or (not g.replay_v2 and g.config_id<>'b3abde40-ea42-4a52-ab24-0ce93c090200') or g.engine_table_id is null or g.settled_at is null or dfc_private.points_replay_opens_for(g,uid) is null or clock_timestamp()<dfc_private.points_replay_opens_for(g,uid)
 or (not p_funding_required and clock_timestamp()>=(dfc_private.points_replay_opens_for(g,uid)+interval '10 seconds')) or not exists(select 1 from public.dfc_z37_points_configs where id=g.config_id and enabled)
 then raise exception 'La confirmación no está disponible'; end if;
 select * into s from public.rf_domino_seats where table_id=g.engine_table_id and user_id=uid and state='active' for update;
 if not found then raise exception 'Ya no tienes asiento en esta partida'; end if;
 select * into strict cfg from public.dfc_z37_points_configs where id=g.config_id and enabled for share;
 quoted_terms:=dfc_private.points_replay_terms(g,cfg);
 if (quoted_terms->>'players')::int<>g.players then
  raise exception 'Cambió el cupo de la mesa. Elige la nueva modalidad en Mesas por puntos.';
 end if;
 if quoted_terms is distinct from p_terms then
  raise exception using errcode='DF001',message='Cambiaron las condiciones. Revísalas y confirma de nuevo.';
 end if;
 if s.table_balance<cfg.min_pass_balance_fc then raise exception 'Saldo de mesa insuficiente para la revancha. Recarga primero el importe faltante.'; end if;
 if g.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' then
  update public.dfc_z37_points_participants set replay_confirmed_at=clock_timestamp()
  where match_id=g.id and user_id=uid;
  if not found then raise exception 'Ya no tienes asiento en esta partida'; end if;
  return true;
 end if;
 select id into n from public.dfc_z37_points_matches where replay_from=g.id;
 if n is null then
  insert into public.dfc_z37_points_matches(config_id,players,target_points,entry_fc,entry_diamonds,admin_pct,diamond_admin_pct,replay_from,pass_fee_fc)
  values(g.config_id,cfg.players,cfg.target_points,cfg.entry_fc,cfg.entry_diamonds,cfg.admin_pct,cfg.diamond_admin_pct,g.id,cfg.pass_fee_fc) returning id into n;
 end if;
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged) values(n,uid,s.seat_no,1,true);
 update public.dfc_z37_points_participants set replay_confirmed_at=clock_timestamp() where match_id=g.id and user_id=uid;
 return true;
end $function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_trial_replay_confirm(p_match_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare game public.dfc_z37_points_matches%rowtype;
begin
 if auth.uid() is null then raise exception 'Inicia sesión para continuar'; end if;
 perform pg_advisory_xact_lock(hashtextextended('b3abde40-ea42-4a52-ab24-0ce93c090200',37));
 if not exists(select 1 from public.dfc_z37_points_configs where id='b3abde40-ea42-4a52-ab24-0ce93c090200' and enabled) then
  raise exception 'La confirmación no está disponible';
 end if;
 select * into game from public.dfc_z37_points_matches where id=p_match_id and config_id='b3abde40-ea42-4a52-ab24-0ce93c090200'
   and state='settled' and engine_table_id is not null and entry_fc=0 and entry_diamonds=0 for update;
 if not found or game.settled_at is null or dfc_private.points_replay_opens_for(game,auth.uid()) is null or clock_timestamp()<dfc_private.points_replay_opens_for(game,auth.uid())
   or clock_timestamp()>=(dfc_private.points_replay_opens_for(game,auth.uid())+interval '10 seconds') then raise exception 'La confirmación no está disponible'; end if;
 update public.dfc_z37_points_participants p set replay_confirmed_at=coalesce(p.replay_confirmed_at,clock_timestamp())
 where p.match_id=game.id and p.user_id=auth.uid()
   and exists(select 1 from public.rf_domino_seats s where s.table_id=game.engine_table_id and s.user_id=p.user_id and s.state='active' and s.table_balance>=(select c.min_pass_balance_fc from public.dfc_z37_points_configs c where c.id=game.config_id));
 if not found then raise exception 'Ya no tienes asiento en esta partida'; end if;
 return true;
end $function$;

CREATE OR REPLACE FUNCTION dfc_private.rotate_paid_points(p_table bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare g public.dfc_z37_points_matches%rowtype; n uuid; s record; kept int; enabled boolean; next_game public.dfc_z37_points_matches%rowtype;
begin
 select * into g from public.dfc_z37_points_matches where engine_table_id=p_table and state='settled';
 if not found or not pg_try_advisory_xact_lock(hashtextextended(g.config_id::text,37)) then return; end if;
 select * into strict g from public.dfc_z37_points_matches where id=g.id for update;
 if g.engine_table_id is distinct from p_table or not dfc_private.points_replay_can_rotate(g) then return; end if;
 select c.enabled into enabled from public.dfc_z37_points_configs c where c.id=g.config_id;
 select id into n from public.dfc_z37_points_matches where replay_from=g.id;

 -- Preserve the configuration when the settled match loses its board.
 insert into dfc_private.points_bot_catalog(user_id,config_id)
 select b.user_id,g.config_id from public.rf_domino_bot_instances_v18 b
 where b.table_id=p_table and b.user_id is not null
 on conflict(user_id) do update set config_id=excluded.config_id;

 if n is not null then
  select * into strict next_game from public.dfc_z37_points_matches where id=n;
 end if;

 for s in select id,user_id,state,seat_no,table_balance from public.rf_domino_seats where table_id=p_table order by seat_no for update loop
  if not enabled or s.state<>'active'
     or exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=s.user_id)
     or not exists(select 1 from public.dfc_z37_points_participants where match_id=n and user_id=s.user_id) then
   perform public.rf_domino_return_seat_v11(s.id,'Salida al terminar Por puntos');
  else
   -- Closing an old seat must still emit payouts, but its pass wallet belongs
   -- to the same user across paid-points replay. Reverse the automatic cash-out
   -- in the same transaction and carry the exact seat balance forward.
   perform public.rf_domino_return_seat_v11(s.id,'Cierre de partida Por puntos');
   if s.table_balance<>0 then
     perform dfc_private.settle_pass_wallet(s.user_id,-s.table_balance);
     perform public.rf_add_ledger(s.user_id,-s.table_balance,
       'DOMINO_PUNTOS_SALDO_TRASLADO','Saldo de pases conservado en revancha · Mesa '||p_table,s.user_id);
   end if;
   insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready,last_seen_at)
   values(p_table,s.user_id,s.seat_no,0,'active',true,clock_timestamp());
   if s.table_balance>0 then
     update public.rf_domino_seats set table_balance=s.table_balance
     where table_id=p_table and user_id=s.user_id and state='active';
   elsif s.table_balance<0 then
     perform dfc_private.debit_pass_seat(
       (select id from public.rf_domino_seats where table_id=p_table and user_id=s.user_id and state='active'),
       -s.table_balance);
   end if;
  end if;
 end loop;
 if n is not null then
  delete from public.dfc_z37_points_participants p where p.match_id=n and (not enabled or not exists(
    select 1 from public.rf_domino_seats a where a.table_id=p_table and a.user_id=p.user_id and a.state='active'));
  select count(*) into kept from public.dfc_z37_points_participants where match_id=n;
  if kept=0 then update public.dfc_z37_points_matches set state='cancelled' where id=n;
  else
   update public.dfc_z37_points_matches set engine_table_id=null where id=g.id;
   update public.dfc_z37_points_matches set engine_table_id=p_table,replay_from=null,
    starts_at=case when next_game.players in (3,4) then dfc_private.points_start_time(p_table,next_game.players,kept,null)
                   when kept>=2 then clock_timestamp() end where id=n;
   return;
  end if;
 end if;
 update public.dfc_z37_points_matches set engine_table_id=null where id=g.id;
end $function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_trial_replay_rotate(p_table_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare game public.dfc_z37_points_matches%rowtype; next_game uuid; occupant record; kept integer; enabled boolean;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('b3abde40-ea42-4a52-ab24-0ce93c090200',37)) then return; end if;
 select m.* into game from public.dfc_z37_points_matches m where engine_table_id=p_table_id
   and config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' and state='settled' and entry_fc=0 and entry_diamonds=0
   and dfc_private.points_replay_can_rotate(m) for update;
 if not found then return; end if;
 select c.enabled into enabled from public.dfc_z37_points_configs c where c.id=game.config_id;

 for occupant in
   select s.id,s.state,p.replay_confirmed_at,
     exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=s.user_id) as is_bot
   from public.rf_domino_seats s
   left join public.dfc_z37_points_participants p on p.match_id=game.id and p.user_id=s.user_id
   where s.table_id=p_table_id order by s.seat_no for update of s
 loop
   if not enabled or occupant.state<>'active' or occupant.is_bot or occupant.replay_confirmed_at is null then
     perform public.rf_domino_return_seat_v11(occupant.id,'Salida al terminar la partida de prueba por puntos');
   end if;
 end loop;
 select count(*) into kept from public.rf_domino_seats where table_id=p_table_id and state='active';
 update public.dfc_z37_points_matches set engine_table_id=null where id=game.id;
 insert into public.dfc_z37_points_matches(config_id,players,target_points,entry_fc,entry_diamonds,admin_pct,engine_table_id,state)
 values(game.config_id,2,game.target_points,0,0,0,p_table_id,case when kept=2 then 'playing' else 'waiting' end)
 returning id into next_game;
 update public.rf_domino_seats set is_ready=true,last_seen_at=clock_timestamp() where table_id=p_table_id and state='active';
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged)
 select next_game,user_id,seat_no,seat_no,true from public.rf_domino_seats where table_id=p_table_id and state='active';
end $function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_trial_replay_cycle()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare item record;
begin
 for item in select m.config_id,m.engine_table_id from public.dfc_z37_points_matches m
  join public.dfc_z37_points_configs c on c.id=m.config_id and c.enabled
  where m.state='waiting' and m.starts_at<=clock_timestamp() and m.engine_table_id is not null
  order by m.starts_at,m.id
 loop
  begin
   perform dfc_private.start_waiting_points_match(item.config_id,item.engine_table_id);
  exception when others then
   raise warning 'Inicio Por puntos mesa %: %',item.engine_table_id,SQLERRM;
  end;
 end loop;
 for item in select m.engine_table_id as table_id,m.config_id,m.state from public.dfc_z37_points_matches m
  where m.engine_table_id is not null
    and ((m.state='settled' and (m.replay_v2 or m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') and dfc_private.points_replay_can_rotate(m))
         or m.state='playing')
 loop
   if item.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' then
    perform public.dfc_z37_trial_replay_rotate(item.table_id);
   elsif item.state='settled' then
    begin
     perform dfc_private.rotate_paid_points(item.table_id);
    exception when others then
     raise warning 'Reinicio Por puntos %: %',item.table_id,SQLERRM;
    end;
   end if;
   if exists(select 1 from public.dfc_z37_points_matches m where m.engine_table_id=item.table_id and m.state='playing') then
      perform public.dfc_z37_trial_restore_seats(item.table_id);
      if not exists(select 1 from public.rf_domino_hands h where h.table_id=item.table_id and h.status in ('playing','shuffling')) then
        perform public.rf_domino_try_start_v189(item.table_id);
      else
        perform public.rf_domino_tick_v11(item.table_id);
      end if;
   end if;
 end loop;
end $function$;

CREATE OR REPLACE FUNCTION dfc_private.start_confirmed_points_replay(p_match uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  g public.dfc_z37_points_matches%rowtype;
begin
  select * into g from public.dfc_z37_points_matches where id=p_match and state='settled';
  if not found or g.engine_table_id is null or not dfc_private.points_replay_can_rotate(g) then return; end if;
  if g.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' then
    perform public.dfc_z37_trial_replay_rotate(g.engine_table_id);
    perform public.rf_domino_try_start_v189(g.engine_table_id);
  else
    perform dfc_private.rotate_paid_points(g.engine_table_id);
    perform dfc_private.start_waiting_points_match(g.config_id,g.engine_table_id);
  end if;
exception when others then
  -- Keep a confirmed contribution if the immediate start fails. The regular cycle retries.
  raise warning 'Reintento de revancha Por puntos %: %', p_match, SQLSTATE;
end;
$function$;

REVOKE ALL ON FUNCTION dfc_private.points_scoreboard_with_final(bigint) FROM PUBLIC;

CREATE FUNCTION dfc_private.points_register_victory_client(p_table bigint,p_manual boolean)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path TO ''
AS $function$
  UPDATE dfc_private.points_final_players f
  SET manual_client=p_manual,
      legacy_until=CASE WHEN p_manual THEN NULL ELSE dfc_private.points_victory_opens(m)+interval '10 seconds' END
  FROM public.dfc_z37_points_matches m
  WHERE m.id=f.match_id AND m.engine_table_id=p_table AND m.state='settled'
    AND f.user_id=auth.uid() AND NOT f.auto_mode AND f.continued_at IS NULL
    AND NOT f.manual_client AND (p_manual OR f.legacy_until IS NULL)
$function$;
REVOKE ALL ON FUNCTION dfc_private.points_register_victory_client(bigint,boolean) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_scoreboard(p_table_id bigint)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  PERFORM dfc_private.points_register_victory_client(p_table_id,false);
  RETURN dfc_private.points_scoreboard_with_final(p_table_id);
END
$function$;

CREATE FUNCTION public.dfc_points_scoreboard_victory(p_table_id bigint)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  PERFORM dfc_private.points_register_victory_client(p_table_id,true);
  RETURN dfc_private.points_scoreboard_with_final(p_table_id);
END
$function$;
REVOKE ALL ON FUNCTION public.dfc_points_scoreboard_victory(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dfc_points_scoreboard_victory(bigint) TO authenticated;
