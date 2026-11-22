ALTER TABLE public.dfc_z37_points_configs
  ADD COLUMN allow_short_start boolean NOT NULL DEFAULT false;

ALTER TABLE public.dfc_z37_points_matches
  ADD COLUMN flexible_capacity smallint
    CHECK (flexible_capacity BETWEEN 2 AND 4 AND flexible_capacity >= players);

CREATE FUNCTION dfc_private.snapshot_points_capacity()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.dfc_z37_points_configs c
    WHERE c.id=NEW.config_id AND c.allow_short_start
  ) THEN
    NEW.flexible_capacity:=NEW.players;
  END IF;
  RETURN NEW;
END
$function$;
REVOKE ALL ON FUNCTION dfc_private.snapshot_points_capacity() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER dfc_points_snapshot_capacity
BEFORE INSERT ON public.dfc_z37_points_matches
FOR EACH ROW EXECUTE FUNCTION dfc_private.snapshot_points_capacity();


CREATE OR REPLACE FUNCTION public.dfc_z37_admin_save_points(p_input jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_enabled boolean;
 v_pass_fee numeric:=(p_input->>'pass_fee_fc')::numeric;
 v_id uuid; v_name text; v_players smallint; v_target int;
 v_fc numeric; v_diamonds bigint; v_limit bigint; v_pct numeric; v_min_pass numeric;
begin
 if (select auth.uid()) is null or not public.dfc_z37_is_admin() then raise exception 'Acceso no autorizado'; end if;
 v_enabled=(p_input->>'enabled')::boolean;
 v_name=trim(p_input->>'name');
 v_players=(p_input->>'players')::smallint;
 v_target=(p_input->>'target_points')::int;
 v_fc=(p_input->>'entry_fc')::numeric;
 v_diamonds=(p_input->>'entry_diamonds')::bigint;
 v_limit=0;
 v_pct=(p_input->>'admin_pct')::numeric; v_min_pass=(p_input->>'min_pass_balance_fc')::numeric;
 if v_name is null or v_players is null or v_target is null or v_fc is null or
    v_diamonds is null or v_limit is null or v_pct is null or
    length(v_name) not between 1 and 160 or v_players not between 2 and 4 or v_target<1 or
    (v_pass_fee is not null and (v_pass_fee<0 or v_pass_fee>999999 or round(v_pass_fee,3)<>v_pass_fee)) or
    v_fc<0 or v_diamonds<0 or v_limit<0 or v_pct not between 0 and 50 OR (v_min_pass IS NOT NULL AND (v_min_pass<0 OR v_min_pass>10000 OR round(v_min_pass,3)<>v_min_pass)) then
    raise exception 'Configuración inválida';
 end if;
 if p_input ? 'id' and p_input->>'id' is not null then
  v_id=(p_input->>'id')::uuid;
  -- Serialize visibility changes with seating, bot admission and rematch rotation.
  IF v_enabled IS FALSE THEN
   perform pg_advisory_xact_lock(hashtextextended(v_id::text,37));
   if exists(
     select 1 from public.dfc_z37_points_matches m
     join public.dfc_z37_points_participants p on p.match_id=m.id
     join public.dfc_z37_points_configs c on c.id=m.config_id and c.enabled
     where m.config_id=v_id and m.state='waiting' and m.replay_from is null
   ) then
     raise exception 'Hay jugadores esperando. La mesa seguirá visible hasta que comience la partida o se desocupe.';
   end if;
  END IF;
  update public.dfc_z37_points_configs
  set allow_short_start=coalesce((p_input->>'allow_short_start')::boolean,allow_short_start),min_pass_balance_fc=coalesce(v_min_pass,min_pass_balance_fc),pass_fee_fc=coalesce(v_pass_fee,pass_fee_fc),bots_allowed=coalesce((p_input->>'bots_allowed')::boolean,bots_allowed),name=v_name,players=v_players,target_points=v_target,entry_fc=v_fc,
      entry_diamonds=v_diamonds,max_negative_diamonds=v_limit,admin_pct=v_pct,diamond_admin_pct=coalesce((p_input->>'diamond_admin_pct')::numeric,diamond_admin_pct),
      enabled=coalesce(v_enabled,enabled),updated_at=now()
  where id=v_id and archived_at is null;
  if not found then raise exception 'Mesa por puntos no encontrada'; end if;
 else
  insert into public.dfc_z37_points_configs(allow_short_start,min_pass_balance_fc,pass_fee_fc,bots_allowed,name,players,target_points,entry_fc,entry_diamonds,max_negative_diamonds,admin_pct,diamond_admin_pct,enabled)
  values(coalesce((p_input->>'allow_short_start')::boolean,false),coalesce(v_min_pass,0),coalesce(v_pass_fee,0),coalesce((p_input->>'bots_allowed')::boolean,false),v_name,v_players,v_target,v_fc,v_diamonds,v_limit,v_pct,coalesce((p_input->>'diamond_admin_pct')::numeric,v_pct),coalesce(v_enabled,false)) returning id into v_id;
 end if;
 return v_id;
end;
$function$;



CREATE OR REPLACE FUNCTION dfc_private.points_start_time(p_table bigint, p_capacity integer, p_seated integer, p_previous timestamp with time zone)
 RETURNS timestamp with time zone
 LANGUAGE sql
 SET search_path TO ''
AS $function$
 select case
  when p_seated>=2 and p_seated<=p_capacity and exists (
    select 1 from public.dfc_z37_points_matches m
    where m.engine_table_id=p_table and m.state='waiting' and m.flexible_capacity is not null
  ) then case
    when p_seated=p_capacity and not exists (
      select 1 from public.rf_domino_seats s
      join public.rf_domino_bot_instances_v18 b on b.table_id=s.table_id and b.user_id=s.user_id
      where s.table_id=p_table and s.state='active'
    ) then clock_timestamp()
    else coalesce(p_previous,clock_timestamp()+interval '10 seconds')
  end
  when p_capacity in (3,4) and p_seated<p_capacity then null
  when p_capacity in (3,4) and exists(
    select 1 from public.rf_domino_seats s
    join public.rf_domino_bot_instances_v18 b on b.table_id=s.table_id and b.user_id=s.user_id
    where s.table_id=p_table and s.state='active'
  ) then clock_timestamp()+interval '10 seconds'
  when p_seated>=p_capacity then clock_timestamp()
  when p_seated>=2 then coalesce(p_previous,clock_timestamp()+interval '10 seconds')
 end;
$function$;



CREATE OR REPLACE FUNCTION dfc_private.start_waiting_points_match(p_config uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT coalesce((
   SELECT dfc_private.start_waiting_points_match(m.config_id,m.engine_table_id)
   FROM public.dfc_z37_points_matches m
   WHERE m.config_id=p_config AND m.state='waiting' AND m.starts_at<=clock_timestamp()
     AND m.engine_table_id IS NOT NULL
   ORDER BY m.starts_at,m.id LIMIT 1
 ),false);
$function$;

CREATE OR REPLACE FUNCTION dfc_private.start_waiting_points_match(p_config uuid, p_table bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE game public.dfc_z37_points_matches%rowtype; seated integer; result jsonb;
BEGIN
 IF NOT pg_try_advisory_xact_lock(hashtextextended(p_config::text,37)) THEN RETURN false; END IF;
 SELECT m.* INTO game FROM public.dfc_z37_points_matches m
 JOIN public.dfc_z37_points_configs c ON c.id=m.config_id AND c.enabled
 WHERE m.config_id=p_config AND m.state='waiting'
   AND m.starts_at<=clock_timestamp() AND m.engine_table_id=p_table
 ORDER BY m.created_at LIMIT 1 FOR UPDATE OF m;
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT count(*) INTO seated FROM public.dfc_z37_points_participants p
 JOIN public.rf_domino_seats s ON s.user_id=p.user_id AND s.table_id=game.engine_table_id AND s.state='active'
 WHERE p.match_id=game.id AND p.charged;
 IF seated<2 OR seated>game.players OR (seated<>game.players AND game.flexible_capacity IS NULL) THEN
  UPDATE public.dfc_z37_points_matches SET starts_at=NULL WHERE id=game.id;
  RETURN false;
 END IF;
 -- Keep the table waiting and eligible for the next server cycle.
 -- The contribution check must use the roster that actually starts.
 game.players:=seated;
 IF NOT dfc_private.points_contributions_ready(game) THEN
  RETURN false;
 END IF;
 -- Keep the confirmed seats if the previous hand is still being shown.
 BEGIN
 UPDATE public.dfc_z37_points_participants p
 SET team=CASE WHEN seated=4 THEN 1+mod(p.seat_number+1,2) ELSE ranked.position END
 FROM (
  SELECT user_id,row_number() OVER (ORDER BY seat_number) AS position
  FROM public.dfc_z37_points_participants WHERE match_id=game.id
 ) ranked WHERE p.match_id=game.id AND p.user_id=ranked.user_id;
 UPDATE public.dfc_z37_points_matches SET state='playing',players=seated,starts_at=NULL WHERE id=game.id;
 result:=public.rf_domino_try_start_v189(game.engine_table_id);
 IF result->>'status'='celebration_pending' THEN
  RAISE SQLSTATE 'DF003';
 END IF;
 IF NOT coalesce((result->>'started')::boolean,false) THEN
  RAISE EXCEPTION 'No se pudo iniciar la partida: %',result;
 END IF;
 RETURN true;
 EXCEPTION WHEN SQLSTATE 'DF003' THEN
  RETURN false;
 END;
END;
$function$;



CREATE OR REPLACE FUNCTION dfc_private.confirm_points_replay_at_terms(p_match_id uuid, p_terms jsonb)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT dfc_private.confirm_points_replay_at_terms(p_match_id,p_terms,false)
$function$;

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
 if (quoted_terms->>'players')::int<>coalesce(g.flexible_capacity,g.players) then
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
 IF NOT cfg.enabled OR (current_terms->>'players')::integer<>coalesce(game.flexible_capacity,game.players) THEN
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



CREATE OR REPLACE FUNCTION dfc_private.points_replay_funding_required(m dfc_z37_points_matches, p_user uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.dfc_z37_points_configs c
    JOIN public.dfc_z37_points_participants p ON p.match_id=m.id
    JOIN public.rf_domino_seats s ON s.table_id=m.engine_table_id AND s.user_id=p.user_id
    WHERE c.id=m.config_id AND c.enabled AND c.players=coalesce(m.flexible_capacity,m.players)
      AND p.replay_confirmed_at IS NULL AND s.state='active' AND s.table_balance<c.min_pass_balance_fc
      AND (p_user IS NULL OR p.user_id=p_user)
      AND NOT EXISTS (SELECT 1 FROM public.rf_domino_bot_instances_v18 b WHERE b.user_id=p.user_id)
  )
$function$;



CREATE OR REPLACE FUNCTION dfc_private.points_scoreboard_with_final(p_table_id bigint)
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
  'replay_can_confirm',c.enabled and (replay.terms->>'players')::int=coalesce(m.flexible_capacity,m.players),
  'replay_closed_reason',case when not c.enabled then 'disabled' when (replay.terms->>'players')::int<>coalesce(m.flexible_capacity,m.players) then 'capacity' end,
  'replay_terms',case when m.state='settled' and viewer.is_participant then replay.terms end,
  'replay_pass_fee_fc',(replay.terms->>'pass_fee_fc')::numeric,
  'can_join',c.enabled and dfc_private.points_waiting_board_eligible(m,c) and
    dfc_private.points_board_can_join(m),
  'my_prize',(select jsonb_build_object('id',g.id,'amount',g.amount,'redeemed',g.redeemed_at is not null) from public.dfc_z31_gift_cards g where g.points_match_id=m.id and g.recipient_id=auth.uid() and g.points_full_prize),
  'allow_short_start',m.flexible_capacity is not null,
  'waiting_for_next',c.enabled and m.flexible_capacity is not null and m.state in ('playing','settled') and not viewer.is_participant,
  'capacity',coalesce(m.flexible_capacity,m.players),'entry_fc',m.entry_fc,'entry_diamonds',m.entry_diamonds,'starts_at',m.starts_at,'match_id',m.id,'target',m.target_points,'state',m.state,'winner_team',m.winner_team,
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



CREATE OR REPLACE FUNCTION dfc_private.rotate_paid_points(p_table bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare g public.dfc_z37_points_matches%rowtype; n uuid; s record; kept int; enabled boolean; cfg public.dfc_z37_points_configs%rowtype; next_game public.dfc_z37_points_matches%rowtype;
begin
 select * into g from public.dfc_z37_points_matches where engine_table_id=p_table and state='settled';
 if not found or not pg_try_advisory_xact_lock(hashtextextended(g.config_id::text,37)) then return; end if;
 select * into strict g from public.dfc_z37_points_matches where id=g.id for update;
 if g.engine_table_id is distinct from p_table or not dfc_private.points_replay_can_rotate(g) then return; end if;
 select * into strict cfg from public.dfc_z37_points_configs c where c.id=g.config_id;
 enabled:=cfg.enabled;
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
   update public.dfc_z37_points_matches set engine_table_id=p_table,replay_from=null where id=n;
   update public.dfc_z37_points_matches set
    starts_at=case when next_game.flexible_capacity is not null and kept<next_game.players
                        and kept>=2 then clock_timestamp()+interval '10 seconds'
                   when next_game.players in (3,4) then dfc_private.points_start_time(p_table,next_game.players,kept,null)
                   when kept>=2 then clock_timestamp() end where id=n;
   return;
  end if;
 end if;
 update public.dfc_z37_points_matches set engine_table_id=null where id=g.id;
 IF enabled AND g.flexible_capacity IS NOT NULL AND cfg.allow_short_start THEN
   INSERT INTO public.dfc_z37_points_matches
     (config_id,players,target_points,entry_fc,entry_diamonds,admin_pct,diamond_admin_pct,pass_fee_fc,engine_table_id)
   VALUES (cfg.id,cfg.players,cfg.target_points,cfg.entry_fc,cfg.entry_diamonds,cfg.admin_pct,cfg.diamond_admin_pct,cfg.pass_fee_fc,p_table);
 END IF;
end $function$;

