-- Rollback: previous definitions of the four functions, 2026-11-25.
-- Does not undo any completed financial transaction. Review before using.
BEGIN;
CREATE OR REPLACE FUNCTION dfc_private.seat_points_bot(t bigint)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare g public.dfc_z37_points_matches%rowtype; bot record; seat smallint; seated int; target int; inserted int:=0; bots int;
begin
 select * into g from public.dfc_z37_points_matches where engine_table_id=t;
 if not found or g.state<>'waiting' or not pg_try_advisory_xact_lock(hashtextextended(g.config_id::text,37)) then return 0; end if;
 select * into strict g from public.dfc_z37_points_matches where id=g.id for update;
 if g.state<>'waiting' or not exists(select 1 from public.dfc_z37_points_configs where id=g.config_id and enabled and bots_allowed)
 then return 0; end if;
 -- A board-specific setting wins. Reuse the last explicit setting when the
 -- lobby replaces its board, with the same cap used by the shared engine.
 select coalesce(
   (select target_count from public.rf_domino_bot_targets_v19 where table_id=t),
   (select tg.target_count from public.rf_domino_bot_targets_v19 tg
    join public.dfc_z37_points_matches m on m.engine_table_id=tg.table_id
    where m.config_id=g.config_id order by tg.updated_at desc,tg.table_id desc limit 1),
   3) into target;
 select count(*) into bots from public.rf_domino_seats s
 join public.rf_domino_bot_instances_v18 i on i.table_id=s.table_id and i.user_id=s.user_id
 where s.table_id=t;
 while bots<least(target,3) loop
 exit when not exists(select 1 from public.rf_domino_bot_fund_v17 where id=1 and enabled and balance>=g.entry_fc)
 or (g.entry_diamonds>0 and not exists(select 1 from public.dfc_z15_admin_diamond_vault where id=1 and balance>=g.entry_diamonds));
 select i.table_id,i.slot,i.user_id into bot from public.rf_domino_bot_instances_v18 i
 join public.rf_domino_bot_agents_v17 a on a.slot=i.slot and a.enabled

 where i.user_id is not null and (
   exists(select 1 from public.dfc_z37_points_matches m where m.engine_table_id=i.table_id and m.config_id=g.config_id)
   or exists(select 1 from dfc_private.points_bot_catalog x where x.user_id=i.user_id and x.config_id=g.config_id)
 ) and not exists(select 1 from public.rf_domino_seats s where s.user_id=i.user_id)
 and (i.table_id=t or not exists(select 1 from public.rf_domino_bot_instances_v18 x where x.table_id=t and x.slot=i.slot))
 order by (i.table_id=t) desc,i.slot limit 1 for update of i skip locked;
 exit when not found;
 select n into seat from generate_series(1,g.players) n where not exists(select 1 from public.rf_domino_seats s where s.table_id=t and s.seat_no=n) order by n limit 1;
 exit when seat is null;
 if bot.table_id<>t then update public.rf_domino_bot_instances_v18 set table_id=t where table_id=bot.table_id and slot=bot.slot; end if;
 insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready,last_seen_at) values(t,bot.user_id,seat,0,'active',true,now());
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged) values(g.id,bot.user_id,seat,1,true);
 bots:=bots+1;
 inserted:=inserted+1;
 end loop;
 if inserted>0 then
   select count(*) into seated from public.dfc_z37_points_participants p
   join public.rf_domino_seats s on s.table_id=t and s.user_id=p.user_id and s.state='active'
   where p.match_id=g.id and p.charged;
   update public.dfc_z37_points_matches
   set starts_at=dfc_private.points_start_time(t,g.players,seated,starts_at)
   where id=g.id;
 end if;
 perform dfc_private.start_waiting_points_match(g.config_id,t);
 return inserted;
end $function$;

CREATE OR REPLACE FUNCTION public.dfc_z11_turn_watchdog()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE r record; v_n int:=0;
BEGIN
 IF NOT pg_try_advisory_xact_lock(1921100111::bigint) THEN RETURN 0; END IF;
 FOR r IN SELECT DISTINCT table_id FROM public.rf_domino_hands
  WHERE status IN ('playing','shuffling') ORDER BY table_id LIMIT 150 LOOP
   BEGIN
     -- Mantener asiento en modo automático mientras sigue vigente (15 min).
     -- Escribir la presencia sólo si lleva >=20 segundos sin actualizarse.
     UPDATE public.rf_domino_seats AS s SET last_seen_at=clock_timestamp()
      FROM public.dfc_z11_seat_control AS ctl
      WHERE s.table_id=r.table_id AND s.user_id=ctl.user_id
        AND ctl.table_id=s.table_id AND ctl.auto_mode=true
        AND ctl.updated_at>clock_timestamp()-interval '15 minutes'
        AND s.state='active'
        AND (s.last_seen_at IS NULL OR s.last_seen_at<clock_timestamp()-interval '20 seconds')
        AND EXISTS(SELECT 1 FROM public.rf_domino_hands AS h
           JOIN public.rf_domino_hand_players AS hp ON hp.hand_id=h.id
           WHERE h.table_id=s.table_id AND h.status='playing' AND hp.user_id=s.user_id);
     PERFORM public.rf_domino_tick_v11(r.table_id);
     v_n:=v_n+1;
   EXCEPTION WHEN OTHERS THEN
     RAISE WARNING 'dfc_z11_turn_watchdog mesa %: %',r.table_id,SQLERRM;
   END;
 END LOOP;
 RETURN v_n;
END $function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_seat_trial_bot(p_table_id bigint)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  game public.dfc_z37_points_matches%rowtype;
  human_seat integer;
  bot_seat integer;
  bot_user uuid;
  started jsonb;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('b3abde40-ea42-4a52-ab24-0ce93c090200',37)) then return 0; end if;
  select * into game from public.dfc_z37_points_matches
  where engine_table_id=p_table_id and config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' and players=2
    and entry_fc=0 and entry_diamonds=0 and admin_pct=0 and state='waiting' for update;
  if not found then return 0; end if;
  if not exists (select 1 from public.dfc_z37_points_configs c where c.id=game.config_id and c.enabled
    and c.players=2 and c.entry_fc=0 and c.entry_diamonds=0 and c.admin_pct=0) then return 0; end if;
  if not exists (
    select 1 from public.rf_domino_bot_tables_v18 t
    join public.rf_domino_bot_targets_v19 g using(table_id)
    where t.table_id=p_table_id and t.enabled and g.target_count>0
  ) or not exists (select 1 from public.rf_domino_bot_fund_v17 where id=1 and enabled) then return 0; end if;
  if (select count(*) from public.rf_domino_seats where table_id=p_table_id)<>1 then return 0; end if;
  select s.seat_no into human_seat from public.rf_domino_seats s
  join public.dfc_z37_points_participants p on p.match_id=game.id and p.user_id=s.user_id
  where s.table_id=p_table_id and s.state='active' and s.is_ready and s.seat_no in (1,2)
    and not exists (select 1 from public.rf_domino_bot_instances_v18 i where i.user_id=s.user_id);
  if human_seat is null then return 0; end if;
  select i.user_id into bot_user from public.rf_domino_bot_instances_v18 i
  join public.rf_domino_bot_agents_v17 a on a.slot=i.slot and a.enabled
  where i.table_id=p_table_id and not exists (select 1 from public.rf_domino_seats s where s.user_id=i.user_id)
  order by i.slot limit 1;
  if bot_user is null then return 0; end if;
  bot_seat:=3-human_seat;
  insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready)
  values(p_table_id,bot_user,bot_seat,0,'active',true)
  on conflict do nothing;
  if not found then return 0; end if;
  insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged)
  values(game.id,bot_user,bot_seat,bot_seat,true);
  update public.dfc_z37_points_matches set state='playing' where id=game.id;
  started:=public.rf_domino_try_start_v189(p_table_id);
  if not coalesce((started->>'started')::boolean,false) then
    raise exception 'El motor no inició la prueba con bot: %',started;
  end if;
  return 1;
end $function$;

CREATE OR REPLACE FUNCTION public.rf_domino_bot_server_cycle_v19()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r record; h public.rf_domino_hands; active boolean; processed integer:=0; msg text; points_config smallint;
BEGIN
 -- One global bot cycle per transaction.
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
   -- For points games acquire the engine config lock before any per-table
   -- lock: progress_v012i and try_start_v189 use this same order.
   -- Nonblocking acquisition means a busy table retries on the next cron tick,
   -- instead of creating a config/table deadlock with an active player.
   points_config:=NULL;
   IF EXISTS (
     SELECT 1 FROM public.dfc_z37_points_matches m
     WHERE m.engine_table_id=r.table_id AND m.state IN ('waiting','playing')
   ) THEN
     SELECT t.config_id INTO points_config
     FROM public.rf_domino_tables t WHERE t.id=r.table_id;
     IF points_config IS NULL OR
        NOT pg_try_advisory_xact_lock(1242990000::bigint+points_config::bigint) THEN
       CONTINUE;
     END IF;
   END IF;
   IF NOT pg_try_advisory_xact_lock(1251900000::bigint+r.table_id) THEN CONTINUE; END IF;
   SELECT enabled INTO active FROM public.rf_domino_bot_tables_v18 WHERE table_id=r.table_id;
   active:=coalesce(active,false) OR EXISTS(
     SELECT 1 FROM public.dfc_z37_points_matches m
     JOIN public.dfc_z37_points_configs c ON c.id=m.config_id
     WHERE m.engine_table_id=r.table_id AND c.enabled AND c.bots_allowed
   );
   UPDATE public.rf_domino_seats s SET last_seen_at=clock_timestamp()
   WHERE s.table_id=r.table_id AND EXISTS(
      SELECT 1 FROM public.rf_domino_bot_instances_v18 i WHERE i.user_id=s.user_id
   );
   IF coalesce(active,false) THEN PERFORM public.rf_domino_bot_manage_v18(r.table_id); END IF;
   PERFORM public.rf_domino_tick_v11(r.table_id);
   IF NOT coalesce(active,false) AND NOT EXISTS(
     SELECT 1 FROM public.rf_domino_hands WHERE table_id=r.table_id AND status IN ('playing','shuffling')
   ) THEN
     PERFORM public.rf_domino_bot_cleanup_v18(r.table_id);
   END IF;
   processed:=processed+1;
  EXCEPTION WHEN OTHERS THEN
   INSERT INTO public.rf_domino_bot_worker_log_v19(table_id,ok,details)
   VALUES(r.table_id,false,left(SQLERRM,900));
  END;
 END LOOP;
 BEGIN
   PERFORM public.rf_domino_bot_sweep_v18();
 EXCEPTION WHEN OTHERS THEN
   RAISE WARNING 'Sweep global no ejecutado: %',SQLERRM;
 END;
 INSERT INTO public.rf_domino_bot_health_v19(id,last_cycle_at,cycles)
 VALUES(1,clock_timestamp(),1) ON CONFLICT(id) DO UPDATE
 SET last_cycle_at=excluded.last_cycle_at,cycles=public.rf_domino_bot_health_v19.cycles+1;
 DELETE FROM public.rf_domino_bot_worker_log_v19
 WHERE created_at<clock_timestamp()-interval '14 days';
 RETURN processed;
END $function$;
COMMIT;
