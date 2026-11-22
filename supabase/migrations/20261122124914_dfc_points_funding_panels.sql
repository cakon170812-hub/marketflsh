CREATE OR REPLACE FUNCTION public.dfc_z37_points_funding_quote(p_config uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT jsonb_build_object('minimum_fc',c.min_pass_balance_fc,'wallet_fc',u.balance)
  FROM public.dfc_z37_points_configs c
  JOIN public.rf_profiles u ON u.id=auth.uid()
  WHERE c.id=p_config AND c.enabled AND c.archived_at IS NULL
$function$;
REVOKE ALL ON FUNCTION public.dfc_z37_points_funding_quote(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dfc_z37_points_funding_quote(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION dfc_private.points_replay_funding_required(m public.dfc_z37_points_matches, p_user uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.dfc_z37_points_configs c
    JOIN public.dfc_z37_points_participants p ON p.match_id=m.id
    JOIN public.rf_domino_seats s ON s.table_id=m.engine_table_id AND s.user_id=p.user_id
    WHERE c.id=m.config_id AND c.enabled AND c.players=m.players
      AND p.replay_confirmed_at IS NULL AND s.state='active' AND s.table_balance<c.min_pass_balance_fc
      AND (p_user IS NULL OR p.user_id=p_user)
      AND NOT EXISTS (SELECT 1 FROM public.rf_domino_bot_instances_v18 b WHERE b.user_id=p.user_id)
  )
$function$;
REVOKE ALL ON FUNCTION dfc_private.points_replay_funding_required(public.dfc_z37_points_matches,uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_join_engine(p_config uuid, p_request uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  uid uuid := auth.uid();
  game public.dfc_z37_points_matches%rowtype;
  seat_count integer;
  table_key bigint;
  started jsonb;
  minimum_fc numeric;
  pass_balance numeric;
begin
  if uid is null or p_request is null or p_config is distinct from 'b3abde40-ea42-4a52-ab24-0ce93c090200'::uuid then
    raise exception 'Inicia sesión para entrar a la mesa de prueba';
  end if;
  perform pg_advisory_xact_lock(pg_catalog.hashtextextended(p_config::text,37));
  select min_pass_balance_fc into minimum_fc from public.dfc_z37_points_configs where id=p_config and enabled and players=2
    and entry_fc=0 and entry_diamonds=0 and admin_pct=0 and target_points=200 for share;
  if not found then raise exception 'Mesa de prueba fuera de servicio'; end if;
  select m.* into game from public.dfc_z37_points_matches m
  join public.dfc_z37_points_participants p on p.match_id=m.id
  where p.user_id=uid and m.config_id=p_config and m.state in ('waiting','playing')
  order by m.created_at desc limit 1 for update of m;
  if found and game.state='playing' then
    return jsonb_build_object('state','playing','table_id',game.engine_table_id);
  end if;
  if exists (select 1 from public.rf_domino_seats where user_id=uid and table_id is distinct from game.engine_table_id) then
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
  table_key:=public.dfc_z37_prepare_points_table_internal(game.id);
  delete from public.dfc_z37_points_participants p
  where p.match_id=game.id and not exists
    (select 1 from public.rf_domino_seats s where s.table_id=table_key and s.user_id=p.user_id and s.state='active');
  if not exists (select 1 from public.rf_domino_seats where table_id=table_key and user_id=uid and state='active') then
    select n into seat_count from generate_series(1,2) n
    where not exists (select 1 from public.rf_domino_seats s where s.table_id=table_key and s.seat_no=n)
    order by n limit 1;
    if seat_count is null then raise exception 'La mesa de prueba está llena'; end if;
    select coalesce((select amount from dfc_private.points_join_funds_context
      where transaction_id=txid_current() and user_id=uid),0) into pass_balance;
    if pass_balance<minimum_fc then
      raise exception 'Debes reservar por lo menos % FC para pagar pases',minimum_fc;
    end if;
    if pass_balance>0 then
      perform dfc_private.points_require_entry_funds(uid,pass_balance,0);
    end if;
    insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready)
    values(table_key,uid,seat_count,0,'active',true);
    if pass_balance>0 then
      update public.rf_profiles set balance=balance-pass_balance,updated_at=now()
      where id=uid and balance>=pass_balance;
      if not found then raise exception 'FlashCoin insuficiente para saldo de pases'; end if;
      update public.rf_domino_seats set table_balance=pass_balance
      where table_id=table_key and user_id=uid;
      perform public.rf_add_ledger(uid,-pass_balance,'DOMINO_PUNTOS_SALDO_PASES','Mesa por puntos '||table_key,uid);
    end if;
    insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged)
    values(game.id,uid,seat_count,seat_count,true);
  end if;
  select count(*) into seat_count from public.dfc_z37_points_participants where match_id=game.id;
  if seat_count=1 and public.dfc_z37_seat_trial_bot(table_key)=1 then
    return jsonb_build_object('state','playing','table_id',table_key);
  end if;
  if seat_count<2 then
    return jsonb_build_object('state','waiting','table_id',table_key,'seated',seat_count,'capacity',2);
  end if;
  update public.dfc_z37_points_matches set state='playing' where id=game.id;
  started:=public.rf_domino_try_start_v189(table_key);
  if not coalesce((started->>'started')::boolean,false) then
    raise exception 'El motor no inició la prueba: %',started;
  end if;
  return jsonb_build_object('state','playing','table_id',table_key);
end $function$;

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
 if g.state<>'settled' or (not g.replay_v2 and g.config_id<>'b3abde40-ea42-4a52-ab24-0ce93c090200') or g.engine_table_id is null or g.settled_at is null or clock_timestamp()<dfc_private.points_replay_opens(g)
 or (not p_funding_required and clock_timestamp()>=(dfc_private.points_replay_opens(g)+interval '10 seconds')) or not exists(select 1 from public.dfc_z37_points_configs where id=g.config_id and enabled)
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
REVOKE ALL ON FUNCTION dfc_private.confirm_points_replay_at_terms(uuid,jsonb,boolean) FROM PUBLIC;
CREATE OR REPLACE FUNCTION dfc_private.confirm_points_replay_at_terms(p_match_id uuid, p_terms jsonb)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT dfc_private.confirm_points_replay_at_terms(p_match_id,p_terms,false)
$function$;

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
 if not found or game.settled_at is null or clock_timestamp()<dfc_private.points_replay_opens(game)
   or clock_timestamp()>=(dfc_private.points_replay_opens(game)+interval '10 seconds') then raise exception 'La confirmación no está disponible'; end if;
 update public.dfc_z37_points_participants p set replay_confirmed_at=coalesce(p.replay_confirmed_at,clock_timestamp())
 where p.match_id=game.id and p.user_id=auth.uid()
   and exists(select 1 from public.rf_domino_seats s where s.table_id=game.engine_table_id and s.user_id=p.user_id and s.state='active' and s.table_balance>=(select c.min_pass_balance_fc from public.dfc_z37_points_configs c where c.id=game.config_id));
 if not found then raise exception 'Ya no tienes asiento en esta partida'; end if;
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
      AND clock_timestamp()>=(dfc_private.points_replay_opens(game)+interval '10 seconds')) THEN
   PERFORM public.rf_domino_return_seat_v11(seat.id,'Salida de la revancha Por puntos');
   RETURN jsonb_build_object('state','left');
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
 if g.engine_table_id is distinct from p_table or (not dfc_private.points_replay_ready(g) and
    ((dfc_private.points_replay_opens(g)+interval '10 seconds')>clock_timestamp()
     or dfc_private.points_replay_funding_required(g))) then return; end if;
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
   and (dfc_private.points_replay_ready(m) or
     (dfc_private.points_replay_opens(m)+interval '10 seconds'<=clock_timestamp()
      and not dfc_private.points_replay_funding_required(m))) for update;
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
    and ((m.state='settled' and (m.replay_v2 or m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') and (dfc_private.points_replay_ready(m) or
      (dfc_private.points_replay_opens(m)+interval '10 seconds'<=clock_timestamp()
       and not dfc_private.points_replay_funding_required(m))))
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

CREATE OR REPLACE FUNCTION public.dfc_z37_points_scoreboard(p_table_id bigint)
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
  'replay_opens',case when viewer.is_participant and m.state='settled' and (m.replay_v2 or m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') then dfc_private.points_replay_opens(m) end,
  'replay_funding_required',viewer.is_participant and m.state='settled' and dfc_private.points_replay_funding_required(m,auth.uid()),
  'replay_deadline',case when viewer.is_participant and m.state='settled' and (m.replay_v2 or m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') then dfc_private.points_replay_opens(m)+interval '10 seconds' end,
  'match_settled_at',case when viewer.is_participant and m.state='settled' then m.settled_at end,
  'victory_opens',case when viewer.is_participant and m.state='settled' then dfc_private.points_victory_opens(m) end,
  'victory_closed',viewer.is_participant and exists(
    select 1 from dfc_private.points_panel_closures c where c.match_id=m.id and c.hand_id=0
      and c.phase='victory' and auth.uid()=any(c.closed_by)),
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
      'points',case when m.players=4 then case p.team when 1 then m.team_a_points else m.team_b_points end else p.points_individual end,'mine',p.user_id=auth.uid(),
      'name',coalesce(nullif(trim(concat_ws(' ',u.first_name,u.last_name)),''),'Jugador '||p.seat_number))
      order by p.seat_number)
    from public.dfc_z37_points_participants p left join public.rf_profiles u on u.id=p.user_id
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
 where m.engine_table_id=p_table_id and m.state in ('waiting','playing','settled')
 and auth.uid() is not null and (viewer.is_participant or (c.enabled and m.state in ('waiting','playing','settled')));
$function$;
