-- Correction 10 / candidate only; DO NOT deploy without staging and release approval.
-- Live logs 2026-11-25: table 397 watchdog settlement waits on bot fund row;
-- bot cycle holds fund transaction and waits for table advisory lock.
-- Table 398 also observed waiting in deadlock. Preserve financial/game logic.
-- Candidate: reserve config/table before seat mutations; busy worker yields by
-- rolling back its per-table subtransaction. Successful table locks remain
-- until transaction end; cross-table shared fund / sweep paths still require
-- concurrent staging tests and lock-order audit. This is NOT a complete proof.
-- Before installation compare current function bodies against reviewed originals,
-- check function owner/grants, and run two-session staging tests of simultaneous
-- bot cycle, watchdog, human joins/plays/exits, settlements and sweep.
-- Verify no duplicate ledger movements, no missing turns, and no starvation.
BEGIN;
-- Verify the exact production baseline examined in correction 15.
-- Abort rather than overwrite an intervening fix.
DO $guard$
BEGIN
  IF md5(pg_get_functiondef('public.dfc_z11_turn_watchdog()'::regprocedure))
    IS DISTINCT FROM 'b3fda9d8bd0082199543afb7c179957b' THEN
    RAISE EXCEPTION 'Watchdog baseline changed; re-review before deploying';
  END IF;
  IF md5(pg_get_functiondef('public.rf_domino_bot_server_cycle_v19()'::regprocedure))
    IS DISTINCT FROM '21b970cd9ebf1029b19068aac9f4bf2d' THEN
    RAISE EXCEPTION 'Bot cycle baseline changed; re-review before deploying';
  END IF;
END
$guard$;
CREATE OR REPLACE FUNCTION public.dfc_z11_turn_watchdog()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE r record; v_n int:=0; v_config smallint;
BEGIN
 IF NOT pg_try_advisory_xact_lock(1921100111::bigint) THEN RETURN 0; END IF;
 FOR r IN SELECT DISTINCT table_id FROM public.rf_domino_hands
  WHERE status IN ('playing','shuffling') ORDER BY table_id LIMIT 150 LOOP
   BEGIN
     SELECT t.config_id INTO v_config FROM public.rf_domino_tables t WHERE t.id=r.table_id;
     IF v_config IS NULL OR NOT pg_try_advisory_xact_lock(1242990000::bigint+v_config::bigint) THEN
       RAISE lock_not_available USING MESSAGE='config busy';
     END IF;
     IF NOT pg_try_advisory_xact_lock(1241000000::bigint+r.table_id) THEN
       RAISE lock_not_available USING MESSAGE='table busy';
     END IF;
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
   EXCEPTION WHEN lock_not_available THEN
     NULL; -- subtransaction rolls back; retry on next scheduled cycle
   WHEN OTHERS THEN
     RAISE WARNING 'dfc_z11_turn_watchdog mesa %: %',r.table_id,SQLERRM;
   END;
 END LOOP;
 RETURN v_n;
END $function$;
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
       RAISE lock_not_available USING MESSAGE='config busy';
     END IF;
   END IF;
   IF NOT pg_try_advisory_xact_lock(1251900000::bigint+r.table_id) THEN
     RAISE lock_not_available USING MESSAGE='worker busy';
   END IF;
   IF NOT pg_try_advisory_xact_lock(1241000000::bigint+r.table_id) THEN
     RAISE lock_not_available USING MESSAGE='table busy';
   END IF;
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
  EXCEPTION WHEN lock_not_available THEN
   NULL; -- subtransaction rolls back; retry on next scheduled cycle
  WHEN OTHERS THEN
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
