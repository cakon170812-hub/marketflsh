alter table public.dfc_z37_points_configs add column bots_allowed boolean not null default false;
update public.dfc_z37_points_configs c set bots_allowed=true where exists(select 1 from public.dfc_z37_points_matches m join public.rf_domino_bot_tables_v18 b on b.table_id=m.engine_table_id where m.config_id=c.id and b.enabled);
create function dfc_private.points_bot_diamonds(delta numeric,uid uuid,event text) returns void language plpgsql security definer set search_path='' as $$
declare b numeric; begin
update public.dfc_z15_admin_diamond_vault set balance=balance+delta,updated_at=now() where id=1 and balance+delta>=0 returning balance into strict b;
insert into public.dfc_z15_admin_diamond_ledger(event_key,delta,balance_after,movement_type,target_id) values(event,delta,b,'DOMINO_PUNTOS_BOT',uid);
end $$;
revoke all on function dfc_private.points_bot_diamonds(numeric,uuid,text) from public;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_reserve_fc()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare game public.dfc_z37_points_matches%rowtype; new_balance numeric;
begin
 select * into strict game from public.dfc_z37_points_matches where id=new.match_id for update;
 if game.entry_fc=0 or not new.charged then return new; end if;
 if game.state<>'waiting' then raise exception 'La mesa no admite este aporte'; end if;
 insert into public.dfc_z37_points_fc_reserves(match_id,user_id,amount,status)
 values(game.id,new.user_id,game.entry_fc,'reserved')
 on conflict(match_id,user_id) do update set amount=excluded.amount,status='reserved'
 where dfc_z37_points_fc_reserves.status='refunded';
 if not found then raise exception 'El aporte de esta partida ya está registrado'; end if;
 if exists(select 1 from public.rf_domino_bot_instances_v18 where user_id=new.user_id) then perform public.rf_domino_bot_book_v17(-game.entry_fc,'DOMINO_PUNTOS_BOT',new.user_id,game.engine_table_id); return new; end if;
 update public.rf_profiles set balance=balance-game.entry_fc,updated_at=now()
 where id=new.user_id and balance>=game.entry_fc returning balance into new_balance;
 if not found then raise exception 'FlashCoin insuficiente para sentarse'; end if;
 insert into public.rf_wallet_ledger(user_id,delta,balance_after,movement_type,reference)
 values(new.user_id,-game.entry_fc,new_balance,'DOMINO_PUNTOS_APORTE','PUNTOS:'||game.id);
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_reserve_diamonds()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare game public.dfc_z37_points_matches%rowtype; ref text:='points-diamond:'||gen_random_uuid();
begin
 select * into strict game from public.dfc_z37_points_matches where id=new.match_id for update;
 if game.entry_diamonds=0 or not new.charged then return new; end if;
 if game.state<>'waiting' then raise exception 'Mesa de diamantes no disponible'; end if;
 insert into public.dfc_z37_points_diamond_reserves values(game.id,new.user_id,game.entry_diamonds,ref,'reserved')
 on conflict(match_id,user_id) do update set amount=excluded.amount,debit_key=excluded.debit_key,state='reserved'
 where dfc_z37_points_diamond_reserves.state='refunded';
 if not found then raise exception 'El aporte de diamantes ya está registrado'; end if;
 if exists(select 1 from public.rf_domino_bot_instances_v18 where user_id=new.user_id) then perform dfc_private.points_bot_diamonds(-game.entry_diamonds,new.user_id,ref); return new; end if;
 if not public.dfc_z9_diamond_transfer(new.user_id,null,game.entry_diamonds,ref,'DOMINO_PUNTOS_APORTE',false,jsonb_build_object('match_id',game.id)) then
  raise exception 'Aporte de diamantes duplicado';
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_release_fc(p_match_id uuid, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v record; balance_after numeric;
begin
 for v in update public.dfc_z37_points_fc_reserves set status='refunded'
  where match_id=p_match_id and status='reserved' and (p_user_id is null or user_id=p_user_id)
  returning user_id,amount
 loop
  if exists(select 1 from public.rf_domino_bot_instances_v18 where user_id=v.user_id) then perform public.rf_domino_bot_book_v17(v.amount,'DOMINO_PUNTOS_BOT',v.user_id,(select engine_table_id from public.dfc_z37_points_matches where id=p_match_id)); continue; end if;
  update public.rf_profiles set balance=balance+v.amount,updated_at=now()
  where id=v.user_id returning balance into strict balance_after;
  insert into public.rf_wallet_ledger(user_id,delta,balance_after,movement_type,reference)
  values(v.user_id,v.amount,balance_after,'DOMINO_PUNTOS_DEVOLUCION','PUNTOS:'||p_match_id);
 end loop;
end $function$
;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_refund_diamonds(p_match uuid, p_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r record;
begin
 for r in update public.dfc_z37_points_diamond_reserves set state='refunded'
  where match_id=p_match and state='reserved' and (p_user is null or user_id=p_user)
  returning user_id,amount,debit_key
 loop
  if exists(select 1 from public.rf_domino_bot_instances_v18 where user_id=r.user_id) then perform dfc_private.points_bot_diamonds(r.amount,r.user_id,r.debit_key||':refund'); continue; end if;
  if not public.dfc_z9_diamond_transfer(null,r.user_id,r.amount,r.debit_key||':refund','DOMINO_PUNTOS_DEVOLUCION',false,'{}') then
    raise exception 'Devolución de diamantes duplicada';
  end if;
 end loop;
end $function$
;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_pay_on_exit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare payout record; wallet numeric; days integer;
begin
 if tg_op='UPDATE' and (new.state='active' or new.state=old.state) then return new; end if;
 for payout in
   select p.*,c.name room from public.dfc_z37_points_payouts p
   join public.dfc_z37_points_matches m on m.id=p.match_id and m.engine_table_id=old.table_id and m.state='settled'
   join public.dfc_z37_points_configs c on c.id=m.config_id
   where p.user_id=old.user_id and p.paid_at is null
   for update of p
 loop
   if exists(select 1 from public.rf_domino_bot_instances_v18 where user_id=payout.user_id) then
    if payout.fc_principal+payout.fc_profit>0 then perform public.rf_domino_bot_book_v17(payout.fc_principal+payout.fc_profit,'DOMINO_PUNTOS_BOT',payout.user_id,old.table_id); end if;
    if payout.diamond_principal+payout.diamond_profit>0 then perform dfc_private.points_bot_diamonds(payout.diamond_principal+payout.diamond_profit,payout.user_id,'points-bot-prize:'||payout.match_id||':'||payout.user_id); end if;
    update public.dfc_z37_points_payouts set paid_at=clock_timestamp() where match_id=payout.match_id and user_id=payout.user_id;
    continue;
   end if;
   if payout.fc_principal>0 then
    update public.rf_profiles set balance=balance+payout.fc_principal,updated_at=now()
     where id=payout.user_id returning balance into strict wallet;
    insert into public.rf_wallet_ledger(user_id,delta,balance_after,movement_type,reference)
     values(payout.user_id,payout.fc_principal,wallet,'DOMINO_PUNTOS_RETORNO_APORTE','PUNTOS:'||payout.match_id);
   end if;
   if payout.fc_profit>0 then
    select expiry_days into days from dfc_private.z32_gift_expiry_config where id=1;
    insert into public.dfc_z31_gift_cards(points_match_id,recipient_id,amount,origin_name,origin_detail,expires_at)
    values(payout.match_id,payout.user_id,payout.fc_profit,'Premio de mesa por puntos',payout.room,
     case when days is not null then now()+make_interval(days=>days) end);
   end if;
   if payout.diamond_principal>0 and not public.dfc_z9_diamond_transfer(null,payout.user_id,payout.diamond_principal,
      'points-diamond-principal:'||payout.match_id||':'||payout.user_id,'DOMINO_PUNTOS_RETORNO_APORTE',false,'{}') then
    raise exception 'Aporte de diamantes ya devuelto';
   end if;
   if payout.diamond_profit>0 then
    insert into public.dfc_z37_points_diamond_cards(match_id,user_id,amount,origin)
    values(payout.match_id,payout.user_id,payout.diamond_profit,'Premio · '||payout.room);
   end if;
   update public.dfc_z37_points_payouts set paid_at=clock_timestamp() where match_id=payout.match_id and user_id=payout.user_id;
 end loop;
 if tg_op='DELETE' then return old; end if;
 return new;
end $function$;

create function dfc_private.seat_points_bot(t bigint) returns integer language plpgsql security definer set search_path='' as $$
declare g public.dfc_z37_points_matches%rowtype; bot record; seat smallint; seated int;
begin
 select * into g from public.dfc_z37_points_matches where engine_table_id=t;
 if not found or g.state<>'waiting' or not pg_try_advisory_xact_lock(hashtextextended(g.config_id::text,37)) then return 0; end if;
 select * into strict g from public.dfc_z37_points_matches where id=g.id for update;
 if g.state<>'waiting' or not exists(select 1 from public.dfc_z37_points_configs where id=g.config_id and enabled and bots_allowed)
 or not exists(select 1 from public.rf_domino_bot_fund_v17 where id=1 and enabled and balance>=g.entry_fc)
 or (g.entry_diamonds>0 and not exists(select 1 from public.dfc_z15_admin_diamond_vault where id=1 and balance>=g.entry_diamonds))
 or not exists(select 1 from public.rf_domino_seats s where s.table_id=t and s.state='active' and not exists(select 1 from public.rf_domino_bot_instances_v18 where user_id=s.user_id))
 or exists(select 1 from public.rf_domino_seats s where s.table_id=t and exists(select 1 from public.rf_domino_bot_instances_v18 where user_id=s.user_id)) then return 0; end if;
 select i.table_id,i.slot,i.user_id into bot from public.rf_domino_bot_instances_v18 i
 join public.rf_domino_bot_agents_v17 a on a.slot=i.slot and a.enabled
 join public.dfc_z37_points_matches m on m.engine_table_id=i.table_id and m.config_id=g.config_id
 where i.user_id is not null and not exists(select 1 from public.rf_domino_seats s where s.user_id=i.user_id)
 and (i.table_id=t or not exists(select 1 from public.rf_domino_bot_instances_v18 x where x.table_id=t and x.slot=i.slot))
 order by (i.table_id=t) desc,i.slot limit 1 for update of i skip locked;
 if not found then return 0; end if;
 select n into seat from generate_series(1,g.players) n where not exists(select 1 from public.rf_domino_seats s where s.table_id=t and s.seat_no=n) order by n limit 1;
 if seat is null then return 0; end if;
 if bot.table_id<>t then update public.rf_domino_bot_instances_v18 set table_id=t where table_id=bot.table_id and slot=bot.slot; end if;
 insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready,last_seen_at) values(t,bot.user_id,seat,0,'active',true,now());
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged) values(g.id,bot.user_id,seat,1,true);
 select count(*) into seated from public.dfc_z37_points_participants where match_id=g.id;
 update public.dfc_z37_points_matches set starts_at=case when seated=g.players then clock_timestamp() else coalesce(starts_at,clock_timestamp()+interval '10 seconds') end where id=g.id;
 perform dfc_private.start_waiting_points_match(g.config_id);
 return 1;
end $$;
revoke all on function dfc_private.seat_points_bot(bigint) from public;

CREATE OR REPLACE FUNCTION public.rf_domino_bot_manage_v18(p_table_id bigint)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
 v_cfg public.rf_domino_configs%ROWTYPE;
 v_enabled boolean; v_fund_enabled boolean; v_target integer:=0;
 v_humans integer:=0; v_bots integer:=0; v_need numeric(18,3);
 v_last smallint; v_seat integer; r record; v_live boolean;
BEGIN
 IF p_table_id IS NULL THEN RETURN 0; END IF;
 IF EXISTS (SELECT 1 FROM public.dfc_z37_points_matches WHERE engine_table_id=p_table_id AND config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') THEN
  IF EXISTS (SELECT 1 FROM public.dfc_z37_points_matches m JOIN public.dfc_z37_points_configs c ON c.id=m.config_id
    WHERE m.engine_table_id=p_table_id AND c.bots_allowed) THEN
   RETURN public.dfc_z37_seat_trial_bot(p_table_id);
  END IF;
  RETURN 0;
 END IF;
 IF EXISTS(SELECT 1 FROM public.dfc_z37_points_matches WHERE engine_table_id=p_table_id) THEN
  RETURN dfc_private.seat_points_bot(p_table_id);
 END IF;
 PERFORM pg_advisory_xact_lock(1251800000::bigint+p_table_id);
 SELECT enabled INTO v_enabled FROM public.rf_domino_bot_tables_v18 WHERE table_id=p_table_id;
 IF NOT COALESCE(v_enabled,false) THEN RETURN 0; END IF;
 SELECT c.* INTO v_cfg FROM public.rf_domino_tables t
 JOIN public.rf_domino_configs c ON c.id=t.config_id WHERE t.id=p_table_id;
 IF NOT FOUND OR NOT COALESCE(v_cfg.active,false) THEN RETURN 0; END IF;
 SELECT EXISTS(SELECT 1 FROM public.rf_domino_hands h WHERE h.table_id=p_table_id
    AND h.status IN ('playing','shuffling')) INTO v_live;
 IF v_live THEN
  RETURN (SELECT count(*)::int FROM public.rf_domino_seats s
   JOIN public.rf_domino_bot_instances_v18 i ON i.table_id=s.table_id AND i.user_id=s.user_id
   WHERE s.table_id=p_table_id);
 END IF;
 SELECT count(*)::int INTO v_humans FROM public.rf_domino_seats s WHERE s.table_id=p_table_id
 AND NOT EXISTS(SELECT 1 FROM public.rf_domino_bot_instances_v18 i
                 WHERE i.table_id=s.table_id AND i.user_id=s.user_id);
 SELECT COALESCE(target_count,0) INTO v_target FROM public.rf_domino_bot_targets_v19
 WHERE table_id=p_table_id;
 v_target:=LEAST(GREATEST(COALESCE(v_target,0),0),GREATEST(3-v_humans,0));
 v_need:=ROUND(GREATEST(v_cfg.hand_stake,v_cfg.min_continue_balance),3);
 -- Sacar entre manos bots que no pueden continuar, que esperan salir,
 -- se deshabilitaron individualmente, o exceden el cupo.
 FOR r IN SELECT s.id,s.state,s.table_balance,i.slot,COALESCE(a.enabled,false) AS agent_enabled
 FROM public.rf_domino_seats s JOIN public.rf_domino_bot_instances_v18 i
   ON i.user_id=s.user_id AND i.table_id=s.table_id
 LEFT JOIN public.rf_domino_bot_agents_v17 a ON a.slot=i.slot
 WHERE s.table_id=p_table_id ORDER BY i.slot DESC FOR UPDATE OF s LOOP
  SELECT count(*)::int INTO v_bots FROM public.rf_domino_seats s
   JOIN public.rf_domino_bot_instances_v18 i ON i.table_id=s.table_id AND i.user_id=s.user_id
   WHERE s.table_id=p_table_id;
  IF r.state<>'active' OR r.table_balance<v_need OR NOT r.agent_enabled OR v_bots>v_target THEN
   PERFORM public.rf_domino_return_seat_v11(r.id,'Rotación bot Z29 entre manos');
  END IF;
 END LOOP;
 -- Usar funciones contables anteriores para no inventar otro saldo.
 PERFORM public.rf_domino_bot_sweep_v18();
 SELECT count(*)::int INTO v_bots FROM public.rf_domino_seats s
  JOIN public.rf_domino_bot_instances_v18 i ON i.table_id=s.table_id AND i.user_id=s.user_id
  WHERE s.table_id=p_table_id;
 SELECT COALESCE(enabled,false) INTO v_fund_enabled FROM public.rf_domino_bot_fund_v17 WHERE id=1;
 IF NOT COALESCE(v_fund_enabled,false) OR v_bots>=v_target THEN RETURN v_bots; END IF;
 INSERT INTO public.dfc_z29_bot_rotation(table_id) VALUES(p_table_id)
 ON CONFLICT(table_id) DO NOTHING;
 SELECT last_slot INTO v_last FROM public.dfc_z29_bot_rotation WHERE table_id=p_table_id FOR UPDATE;
 FOR r IN SELECT i.slot,i.user_id FROM public.rf_domino_bot_instances_v18 i
 JOIN public.rf_domino_bot_agents_v17 a ON a.slot=i.slot AND a.enabled=true
 WHERE i.table_id=p_table_id AND i.user_id IS NOT NULL
   AND NOT EXISTS(SELECT 1 FROM public.rf_domino_seats s WHERE s.user_id=i.user_id)
 ORDER BY CASE WHEN v_last IS NULL OR i.slot>v_last THEN 0 ELSE 1 END,i.slot LOOP
  EXIT WHEN v_bots>=v_target;
  SELECT x.n INTO v_seat FROM generate_series(1,4) x(n)
    WHERE NOT EXISTS(SELECT 1 FROM public.rf_domino_seats s
       WHERE s.table_id=p_table_id AND s.seat_no=x.n)
    ORDER BY x.n LIMIT 1;
  EXIT WHEN v_seat IS NULL;
  -- El fondo nunca puede tener saldo negativo; book realiza el débito atómico.
  IF (SELECT balance FROM public.rf_domino_bot_fund_v17 WHERE id=1) <
     ROUND(GREATEST(v_cfg.min_entry,v_cfg.min_continue_balance+v_cfg.hand_stake),3)
  THEN EXIT; END IF;
  PERFORM public.rf_domino_bot_book_v17(
   -ROUND(GREATEST(v_cfg.min_entry,v_cfg.min_continue_balance+v_cfg.hand_stake),3),
   'ENTRADA_MESA_Z29',r.user_id,p_table_id);
  INSERT INTO public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready,last_seen_at)
  VALUES(p_table_id,r.user_id,v_seat,
   ROUND(GREATEST(v_cfg.min_entry,v_cfg.min_continue_balance+v_cfg.hand_stake),3),
   'active',true,clock_timestamp());
  UPDATE public.dfc_z29_bot_rotation SET last_slot=r.slot,updated_at=clock_timestamp()
   WHERE table_id=p_table_id;
  v_last:=r.slot; v_bots:=v_bots+1;
 END LOOP;
 IF v_bots+v_humans>=2 THEN PERFORM public.rf_domino_maybe_start_hand_v11(p_table_id); END IF;
 RETURN v_bots;
END $function$
;

CREATE OR REPLACE FUNCTION public.rf_domino_bot_server_cycle_v19()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r record; h public.rf_domino_hands; active boolean; processed integer:=0; msg text;
BEGIN
 -- Incluso en llamadas solapadas, una ejecución global como máximo.
 IF NOT pg_try_advisory_xact_lock(1919000005::bigint) THEN RETURN 0; END IF;
 FOR r IN SELECT DISTINCT x.table_id FROM (
   SELECT table_id FROM public.rf_domino_bot_tables_v18 WHERE enabled
   UNION ALL
   SELECT m.engine_table_id FROM public.dfc_z37_points_matches m JOIN public.dfc_z37_points_configs c ON c.id=m.config_id
   WHERE m.state='waiting' AND m.engine_table_id IS NOT NULL AND c.enabled AND c.bots_allowed
   UNION ALL
   SELECT s.table_id FROM public.rf_domino_seats s
    JOIN public.rf_domino_bot_instances_v18 i ON i.user_id=s.user_id
 ) x ORDER BY table_id LOOP
  BEGIN
   IF NOT pg_try_advisory_xact_lock(1251900000::bigint+r.table_id) THEN CONTINUE; END IF;
   SELECT enabled INTO active FROM public.rf_domino_bot_tables_v18 WHERE table_id=r.table_id;
   active:=coalesce(active,false) OR EXISTS(SELECT 1 FROM public.dfc_z37_points_matches m JOIN public.dfc_z37_points_configs c ON c.id=m.config_id
     WHERE m.engine_table_id=r.table_id AND c.enabled AND c.bots_allowed);
   UPDATE public.rf_domino_seats s SET last_seen_at=clock_timestamp()
    WHERE s.table_id=r.table_id AND EXISTS(
      SELECT 1 FROM public.rf_domino_bot_instances_v18 i WHERE i.user_id=s.user_id);
   IF coalesce(active,false) THEN PERFORM public.rf_domino_bot_manage_v18(r.table_id); END IF;
   PERFORM public.rf_domino_tick_v11(r.table_id);
    IF NOT coalesce(active,false) AND NOT EXISTS(SELECT 1 FROM public.rf_domino_hands WHERE table_id=r.table_id
     AND status IN ('playing','shuffling')) THEN
     PERFORM public.rf_domino_bot_cleanup_v18(r.table_id);
   END IF;
   processed:=processed+1;
  EXCEPTION WHEN OTHERS THEN
   -- Un fallo en una mesa no impide avanzar las otras; queda registro de soporte.
   INSERT INTO public.rf_domino_bot_worker_log_v19(table_id,ok,details)
   VALUES(r.table_id,false,left(SQLERRM,900));
  END;
 END LOOP;
 -- Barrido global solo una vez por ciclo, no por mesa.
 BEGIN
   PERFORM public.rf_domino_bot_sweep_v18();
 EXCEPTION WHEN OTHERS THEN
   RAISE WARNING 'Sweep global no ejecutado: %',SQLERRM;
 END;
 INSERT INTO public.rf_domino_bot_health_v19(id,last_cycle_at,cycles)
 VALUES(1,clock_timestamp(),1) ON CONFLICT(id) DO UPDATE
 SET last_cycle_at=excluded.last_cycle_at,cycles=public.rf_domino_bot_health_v19.cycles+1;
 -- Limita historial en tabla propia. Cron conserva su propio historial aparte.
 DELETE FROM public.rf_domino_bot_worker_log_v19
 WHERE created_at<clock_timestamp()-interval '14 days';
 RETURN processed;
END $function$
;

CREATE OR REPLACE FUNCTION public.dfc_z37_admin_save_points(p_input jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_enabled boolean;
 v_id uuid; v_name text; v_players smallint; v_target int;
 v_fc numeric; v_diamonds bigint; v_limit bigint; v_pct numeric;
begin
 if (select auth.uid()) is null or not public.dfc_z37_is_admin() then raise exception 'Acceso no autorizado'; end if;
 v_enabled=(p_input->>'enabled')::boolean;
 v_name=trim(p_input->>'name');
 v_players=(p_input->>'players')::smallint;
 v_target=(p_input->>'target_points')::int;
 v_fc=(p_input->>'entry_fc')::numeric;
 v_diamonds=(p_input->>'entry_diamonds')::bigint;
 v_limit=0;
 v_pct=(p_input->>'admin_pct')::numeric;
 if v_name is null or v_players is null or v_target is null or v_fc is null or
    v_diamonds is null or v_limit is null or v_pct is null or
    length(v_name) not between 1 and 160 or v_players not between 2 and 4 or v_target<1 or
    v_fc<0 or v_diamonds<0 or v_limit<0 or v_pct not between 0 and 50 then
    raise exception 'Configuración inválida';
 end if;
 if p_input ? 'id' and p_input->>'id' is not null then
  v_id=(p_input->>'id')::uuid;
  update public.dfc_z37_points_configs
  set bots_allowed=coalesce((p_input->>'bots_allowed')::boolean,bots_allowed),name=v_name,players=v_players,target_points=v_target,entry_fc=v_fc,
      entry_diamonds=v_diamonds,max_negative_diamonds=v_limit,admin_pct=v_pct,diamond_admin_pct=coalesce((p_input->>'diamond_admin_pct')::numeric,diamond_admin_pct),
      enabled=coalesce(v_enabled,enabled),updated_at=now()
  where id=v_id;
  if not found then raise exception 'Mesa por puntos no encontrada'; end if;
 else
  insert into public.dfc_z37_points_configs(bots_allowed,name,players,target_points,entry_fc,entry_diamonds,max_negative_diamonds,admin_pct,diamond_admin_pct,enabled)
  values(coalesce((p_input->>'bots_allowed')::boolean,false),v_name,v_players,v_target,v_fc,v_diamonds,v_limit,v_pct,coalesce((p_input->>'diamond_admin_pct')::numeric,v_pct),coalesce(v_enabled,false)) returning id into v_id;
 end if;
 return v_id;
end;
$function$
;
