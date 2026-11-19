CREATE OR REPLACE FUNCTION public.dfc_z11_set_auto_mode(p_table_id bigint, p_enabled boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_id uuid:=auth.uid();
BEGIN
 IF v_id IS NULL OR p_table_id IS NULL OR p_enabled IS NULL THEN RAISE EXCEPTION 'Sesion o mesa invalida'; END IF;
 PERFORM pg_advisory_xact_lock(1241000000::bigint+p_table_id);
 IF NOT EXISTS (SELECT 1 FROM public.rf_domino_seats s WHERE s.user_id=v_id
        AND s.table_id=p_table_id AND s.state='active') THEN
   RAISE EXCEPTION 'No tienes un asiento activo en esta mesa';
 END IF;
 IF p_enabled THEN
   INSERT INTO public.dfc_z29_table_presence(user_id,table_id,inside_table,pending_hand_id,left_screen_at,updated_at)
   SELECT v_id,p_table_id,false,h.id,clock_timestamp(),clock_timestamp()
   FROM public.rf_domino_hands h JOIN public.rf_domino_hand_players hp ON hp.hand_id=h.id
   WHERE h.table_id=p_table_id AND h.status IN ('playing','shuffling') AND hp.user_id=v_id
   ORDER BY h.id DESC LIMIT 1
   ON CONFLICT(user_id,table_id) DO UPDATE SET inside_table=false,pending_hand_id=excluded.pending_hand_id,
     left_screen_at=excluded.left_screen_at,updated_at=excluded.updated_at;
 ELSE
   UPDATE public.dfc_z37_points_participants p SET absent_at=NULL
   FROM public.dfc_z37_points_matches m
   WHERE m.id=p.match_id AND m.engine_table_id=p_table_id AND m.state='playing'
     AND p.user_id=v_id AND p.absent_at IS NOT NULL;
   UPDATE public.rf_domino_hands h
   SET auto_pass_started_at=NULL,turn_deadline=clock_timestamp()+make_interval(secs=>c.turn_seconds)
   FROM public.rf_domino_tables t JOIN public.rf_domino_configs c ON c.id=t.config_id
   WHERE h.table_id=p_table_id AND h.table_id=t.id AND h.turn_user_id=v_id
     AND h.status='playing' AND EXISTS (
       SELECT 1 FROM public.dfc_z11_seat_control a
       WHERE a.user_id=v_id AND a.table_id=p_table_id AND a.auto_mode
     );
   UPDATE public.dfc_z29_table_presence
   SET inside_table=true,pending_hand_id=NULL,left_screen_at=NULL,updated_at=clock_timestamp()
   WHERE user_id=v_id AND table_id=p_table_id AND pending_hand_id IS NOT NULL;
 END IF;
 INSERT INTO public.dfc_z11_seat_control(user_id,table_id,auto_mode,updated_at)
 VALUES(v_id,p_table_id,p_enabled,clock_timestamp())
 ON CONFLICT(user_id) DO UPDATE SET table_id=excluded.table_id,
 auto_mode=excluded.auto_mode,updated_at=clock_timestamp();
 RETURN jsonb_build_object('ok',true,'table_id',p_table_id,'auto_mode',p_enabled);
END $function$;

CREATE OR REPLACE FUNCTION dfc_private.domino_auto_play_takeover()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_table bigint;
BEGIN
  SELECT table_id INTO v_table FROM public.rf_domino_hands WHERE id=NEW.hand_id AND status='playing';
  IF v_table IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.rf_domino_seats s WHERE s.table_id=v_table AND s.user_id=NEW.user_id AND s.state='active'
  ) OR EXISTS (
    SELECT 1 FROM public.rf_domino_bot_instances_v18 b WHERE b.table_id=v_table AND b.user_id=NEW.user_id
  ) THEN RETURN NEW; END IF;
  INSERT INTO public.dfc_z29_table_presence(user_id,table_id,inside_table,pending_hand_id,left_screen_at,updated_at)
  VALUES(NEW.user_id,v_table,false,NEW.hand_id,clock_timestamp(),clock_timestamp())
  ON CONFLICT(user_id,table_id) DO UPDATE
  SET inside_table=false,pending_hand_id=excluded.pending_hand_id,left_screen_at=excluded.left_screen_at,updated_at=excluded.updated_at
  WHERE dfc_z29_table_presence.pending_hand_id IS DISTINCT FROM excluded.pending_hand_id
     OR dfc_z29_table_presence.inside_table;
  INSERT INTO public.dfc_z11_seat_control(user_id,table_id,auto_mode,updated_at)
  VALUES(NEW.user_id,v_table,true,clock_timestamp())
  ON CONFLICT(user_id) DO UPDATE SET table_id=excluded.table_id,auto_mode=true,updated_at=excluded.updated_at
  WHERE NOT dfc_z11_seat_control.auto_mode OR dfc_z11_seat_control.table_id IS DISTINCT FROM excluded.table_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rf_domino_tick_v11(p_table_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_hand public.rf_domino_hands;
  v_cfg public.rf_domino_configs;
  v_state text;
  v_left_table boolean:=false;
  v_tiles jsonb;
  v_has_legal boolean:=true;
  v_auto_started timestamptz;
  v_trial boolean;
  v_trial_absent boolean;
begin
  perform pg_advisory_xact_lock(1241000000::bigint+p_table_id);

  select dh.*
  into v_hand
  from public.rf_domino_hands dh
  where dh.table_id=p_table_id
    and dh.status in ('shuffling','playing')
  order by dh.id desc
  limit 1
  for update;

  if not found then
    perform public.rf_domino_maybe_start_hand_v11(p_table_id);
    return;
  end if;

  select dc.*
  into v_cfg
  from public.rf_domino_tables dt
  join public.rf_domino_configs dc on dc.id=dt.config_id
  where dt.id=p_table_id;

  -- Sólo se pasa a jugando cuando TODOS recibieron 7 fichas distintas.
  -- La mano se reparte en el servidor, incluso si sólo hay robots.
  if v_hand.status='shuffling' and clock_timestamp()>=v_hand.play_starts_at then
    if exists (select 1 from public.rf_domino_hand_players hp
               where hp.hand_id=v_hand.id and jsonb_array_length(hp.tiles)=0) then
      if session_user='postgres' or exists (
        select 1 from public.rf_domino_hand_players hp
        where hp.hand_id=v_hand.id and hp.user_id=auth.uid()) then
         perform public.rf_domino_finish_shuffle_v012d(v_hand.id);
      else
         return;  -- El cron del servidor terminará el reparto.
      end if;
    end if;
    if (select count(*) from public.rf_domino_hand_players hp where hp.hand_id=v_hand.id) not between 2 and 4
       or exists (select 1 from public.rf_domino_hand_players hp where hp.hand_id=v_hand.id
                   and (jsonb_typeof(hp.tiles)<>'array' or jsonb_array_length(hp.tiles)<>7))
       or (select count(distinct tile.tile::text) from public.rf_domino_hand_players hp
           cross join lateral jsonb_array_elements(hp.tiles) tile(tile)
           where hp.hand_id=v_hand.id) <>
          (select count(*)*7 from public.rf_domino_hand_players hp where hp.hand_id=v_hand.id)
    then return; end if;
    -- Si el reparto se hizo ahora, conservar los siete segundos de visualización.
    if clock_timestamp() < (select h.play_starts_at from public.rf_domino_hands h where h.id=v_hand.id) then return; end if;
    update public.rf_domino_hands
    set status='playing', turn_deadline=clock_timestamp()+make_interval(secs=>v_cfg.turn_seconds),
        auto_pass_started_at=null where id=v_hand.id;
    return;
  end if;

  -- Sólo reparar una mano antigua atascada sin movimientos, sin tablero y sin fichas.
  -- No reinicia cobros, no recrea mano y no toca jugadas ya válidas.
  if v_hand.status='playing' and jsonb_array_length(v_hand.board)=0
     and not exists (select 1 from public.rf_domino_moves m where m.hand_id=v_hand.id)
     and (select count(*) from public.rf_domino_hand_players hp where hp.hand_id=v_hand.id) between 2 and 4
     and not exists(select 1 from public.rf_domino_hand_players hp where hp.hand_id=v_hand.id
             and (jsonb_typeof(hp.tiles)<>'array' or jsonb_array_length(hp.tiles)<>0))
  then
    update public.rf_domino_hands
    set status='shuffling', play_starts_at=clock_timestamp()+interval '8 seconds',
        turn_deadline=null, auto_pass_started_at=null where id=v_hand.id;
    return;
  end if;

  if v_hand.status='playing' then
    select ds.state
    into v_state
    from public.rf_domino_seats ds
    where ds.table_id=p_table_id
      and ds.user_id=v_hand.turn_user_id;

    select hp.tiles,coalesce(hp.left_table,false)
    into v_tiles,v_left_table
    from public.rf_domino_hand_players hp
    where hp.hand_id=v_hand.id
      and hp.user_id=v_hand.turn_user_id;

    select true, (p.absent_at is not null or coalesce(s.last_seen_at,'-infinity'::timestamptz)<clock_timestamp()-interval '30 seconds')
    into v_trial,v_trial_absent
    from public.dfc_z37_points_matches m join public.dfc_z37_points_participants p on p.match_id=m.id
    left join public.rf_domino_seats s on s.table_id=m.engine_table_id and s.user_id=p.user_id
    where m.engine_table_id=p_table_id and m.state='playing'
      and p.user_id=v_hand.turn_user_id
      and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.table_id=p_table_id and b.user_id=p.user_id);
    if coalesce(v_trial_absent,false) then
      if v_hand.auto_pass_started_at is null then
        update public.rf_domino_hands set auto_pass_started_at=clock_timestamp(),turn_deadline=clock_timestamp()+interval '2 seconds' where id=v_hand.id;
      elsif clock_timestamp()>=v_hand.auto_pass_started_at+interval '2 seconds' then
        update public.rf_domino_hands set auto_pass_started_at=null where id=v_hand.id;
        perform public.rf_domino_auto_action_v11(v_hand.id,v_hand.turn_user_id);
      end if;
      return;
    end if;

    -- 1.9.9: robot sentado y participante: usar siempre la rapidez guardada
    -- en la plantilla. Evita el auto-pase alternativo de 2 s del tick
    -- y la auto-jugada de vencimiento, que ignoraban el tiempo elegido.
    -- Un participante real conserva las reglas originales del tick.
    if v_state='active' and not coalesce(v_left_table,false)
       and exists (
         select 1 from public.rf_domino_bot_instances_v18 bi
         join public.rf_domino_seats ds on ds.user_id=bi.user_id
         where bi.user_id=v_hand.turn_user_id
           and bi.table_id=p_table_id
           and ds.table_id=p_table_id and ds.state='active'
       ) then
      perform public.rf_domino_bot_play_v18(v_hand.id,v_hand.turn_user_id);
      return;
    end if;

    if v_state='active' and exists (
      select 1 from public.dfc_z11_seat_control a
      where a.table_id=p_table_id and a.user_id=v_hand.turn_user_id and a.auto_mode
    ) then
      if v_hand.auto_pass_started_at is null then
        update public.rf_domino_hands set auto_pass_started_at=clock_timestamp(),
          turn_deadline=clock_timestamp()+interval '2 seconds' where id=v_hand.id;
      elsif clock_timestamp()>=v_hand.auto_pass_started_at+interval '2 seconds' then
        update public.rf_domino_hands set auto_pass_started_at=null where id=v_hand.id;
        perform public.rf_domino_auto_action_v11(v_hand.id,v_hand.turn_user_id);
      end if;
      return;
    end if;

    v_has_legal:=public.rf_domino_has_legal_v11(
      coalesce(v_tiles,'[]'::jsonb),
      v_hand.open_left,
      v_hand.open_right,
      jsonb_array_length(v_hand.board)=0
    );

    -- Abandono definitivo / asiento ya separado: acción inmediata del servidor.
    if not coalesce(v_trial,false) and (coalesce(v_left_table,false)
       or coalesce(v_state,'')='abandoned') then
      update public.rf_domino_hands
      set auto_pass_started_at=null
      where id=v_hand.id;

      perform public.rf_domino_auto_action_v11(
        v_hand.id,v_hand.turn_user_id
      );
      return;
    end if;

    -- Sin ficha válida: exactamente una ventana corta de 2 segundos.
    if not v_has_legal then
      v_auto_started:=v_hand.auto_pass_started_at;

      if v_auto_started is null then
        update public.rf_domino_hands
        set auto_pass_started_at=now(),
            turn_deadline=now()+interval '2 seconds'
        where id=v_hand.id;
        return;
      end if;

      if now()>=v_auto_started+interval '2 seconds' then
        update public.rf_domino_hands
        set auto_pass_started_at=null
        where id=v_hand.id;

        perform public.rf_domino_pass_internal_v11(
          v_hand.id,v_hand.turn_user_id,true
        );
      end if;
      return;
    end if;

    -- Si ahora sí existe una jugada válida, elimina cualquier marca vieja.
    if v_hand.auto_pass_started_at is not null then
      update public.rf_domino_hands
      set auto_pass_started_at=null
      where id=v_hand.id;
    end if;

    -- Incluye leave_after_hand: al salir solo un momento NO juega de inmediato.
    -- Puede volver mientras su turno siga vivo; al vencer, el servidor actúa.
    if v_hand.turn_deadline is not null
       and now()>=v_hand.turn_deadline then
      perform public.rf_domino_auto_action_v11(
        v_hand.id,v_hand.turn_user_id
      );
    end if;
  end if;
end
$function$;

CREATE OR REPLACE FUNCTION public.dfc_z29_mark_exit_after_hand()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
 IF NEW.status='settled' AND OLD.status IN ('playing','shuffling') AND NOT exists(select 1 from public.dfc_z37_points_matches m where m.engine_table_id=NEW.table_id and m.state='playing')
    AND NOT exists(select 1 from public.rf_domino_012n_matches m where m.table_id=NEW.table_id and m.status='active') THEN
  UPDATE public.rf_domino_seats s
  SET state='leave_after_hand',is_ready=false
  FROM public.dfc_z29_table_presence p
  WHERE p.user_id=s.user_id AND p.table_id=NEW.table_id
    AND p.pending_hand_id=NEW.id AND p.inside_table=false
    AND s.table_id=NEW.table_id AND s.state='active';
 END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.dfc_z29_finish_departures()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE r record; v_seat uuid; v_done integer:=0; v_wait integer:=0; v_errors jsonb:='[]'::jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role'
  AND session_user NOT IN ('postgres','supabase_admin') THEN
  RAISE EXCEPTION 'Solo mantenimiento del servidor';
 END IF;
 FOR r IN SELECT user_id,table_id,pending_hand_id FROM public.dfc_z29_table_presence
  WHERE inside_table=false AND pending_hand_id IS NOT NULL
  ORDER BY table_id,user_id LIMIT 100 LOOP
  BEGIN
   PERFORM pg_advisory_xact_lock(1243000000::bigint+r.table_id);
   IF NOT pg_try_advisory_xact_lock(1241000000::bigint+r.table_id) THEN CONTINUE; END IF;
   IF NOT EXISTS (SELECT 1 FROM public.dfc_z29_table_presence p
     WHERE p.user_id=r.user_id AND p.table_id=r.table_id AND p.pending_hand_id=r.pending_hand_id
       AND NOT p.inside_table) THEN CONTINUE; END IF;
   IF EXISTS(SELECT 1 FROM public.dfc_z37_points_matches m
     WHERE m.engine_table_id=r.table_id AND m.state='playing') THEN
     v_wait:=v_wait+1; CONTINUE;
   END IF;
   IF EXISTS (SELECT 1 FROM public.rf_domino_hands h
      WHERE h.id=r.pending_hand_id AND h.table_id=r.table_id
      AND h.status IN ('playing','shuffling')) THEN
    v_wait:=v_wait+1; CONTINUE;
   END IF;
   IF NOT EXISTS (SELECT 1 FROM public.rf_domino_hands h
      WHERE h.id=r.pending_hand_id AND h.table_id=r.table_id AND h.status='settled') THEN
    v_errors:=v_errors||jsonb_build_array(jsonb_build_object('user_id',r.user_id,
      'table_id',r.table_id,'reason','mano_sin_liquidacion_confirmada'));
    CONTINUE;
   END IF;
   -- Una partida de puntos que sigue activa requiere su propia liquidación:
   -- no retirar de manera unilateral el dinero reservado en el bote.
   IF EXISTS (SELECT 1 FROM public.rf_domino_012n_matches m
     WHERE m.table_id=r.table_id AND m.status='active') THEN
    v_wait:=v_wait+1; CONTINUE;
   END IF;
   IF EXISTS (SELECT 1 FROM public.rf_domino_hands h
     JOIN public.rf_domino_hand_players hp ON hp.hand_id=h.id
     WHERE h.table_id=r.table_id AND hp.user_id=r.user_id
       AND h.status IN ('playing','shuffling')) THEN
    v_wait:=v_wait+1; CONTINUE;
   END IF;
   SELECT s.id INTO v_seat FROM public.rf_domino_seats s
    WHERE s.user_id=r.user_id AND s.table_id=r.table_id FOR UPDATE;
   IF v_seat IS NOT NULL THEN
    PERFORM public.rf_domino_return_seat_v11(v_seat,'Retirada Z29 tras finalizar mano');
   END IF;
   DELETE FROM public.dfc_z29_table_presence p
    WHERE p.user_id=r.user_id AND p.table_id=r.table_id
     AND p.pending_hand_id=r.pending_hand_id AND p.inside_table=false;
   DELETE FROM public.dfc_z11_seat_control c
    WHERE c.user_id=r.user_id AND c.table_id=r.table_id;
   v_done:=v_done+1;
  EXCEPTION WHEN OTHERS THEN
   v_errors:=v_errors||jsonb_build_array(jsonb_build_object('user_id',r.user_id,
    'table_id',r.table_id,'reason',left(SQLERRM,160)));
  END;
 END LOOP;
 RETURN jsonb_build_object('ok',jsonb_array_length(v_errors)=0,
   'returned_seats',v_done,'waiting',v_wait,'errors',v_errors);
END $function$;

CREATE FUNCTION dfc_private.points_mark_auto_departures()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  UPDATE public.rf_domino_seats s SET state='leave_after_hand',is_ready=false
  FROM public.dfc_z37_points_participants p
  WHERE p.match_id=NEW.id AND s.table_id=NEW.engine_table_id AND s.user_id=p.user_id
    AND s.state='active' AND (p.absent_at IS NOT NULL OR EXISTS (
      SELECT 1 FROM public.dfc_z11_seat_control a
      WHERE a.table_id=s.table_id AND a.user_id=s.user_id AND a.auto_mode
    ));
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION dfc_private.points_mark_auto_departures() FROM PUBLIC;
CREATE TRIGGER zz_dfc_z37_points_mark_auto_departures
AFTER UPDATE OF state ON public.dfc_z37_points_matches
FOR EACH ROW WHEN (OLD.state='playing' AND NEW.state='settled')
EXECUTE FUNCTION dfc_private.points_mark_auto_departures();
