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
  v_z37_match_id uuid;
  v_z37_players integer;
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
      and not exists (select 1 from public.dfc_z37_points_matches m where m.engine_table_id=p_table_id
        and m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' and m.state='playing' and last_hand.settled_at<m.created_at)
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

    SELECT m.id,m.players INTO v_z37_match_id,v_z37_players
    FROM public.dfc_z37_points_matches m
    WHERE m.engine_table_id=p_table_id AND m.state='playing'
    ORDER BY m.created_at DESC LIMIT 1;

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

    IF v_z37_match_id IS NOT NULL THEN
      UPDATE public.rf_domino_seats ds
      SET is_ready=(ds.state='active' AND EXISTS (
        SELECT 1 FROM public.dfc_z37_points_participants p
        WHERE p.match_id=v_z37_match_id AND p.user_id=ds.user_id AND p.charged))
      WHERE ds.table_id=p_table_id;
      SELECT count(*) INTO v_count FROM public.rf_domino_seats ds
      WHERE ds.table_id=p_table_id AND ds.state='active' AND ds.is_ready;
      IF v_count<>v_z37_players THEN
        RETURN jsonb_build_object('ok',true,'started',false,'status','waiting_ready','ready_players',v_count);
      END IF;
    ELSE
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
    IF v_z37_match_id IS NULL AND v_points_mode AND v_existing_match.id IS NULL THEN
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

