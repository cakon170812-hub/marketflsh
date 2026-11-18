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
                     +v_points>=target_points then 'settlement_pending' else state end
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
begin
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

  if exists (
    select 1 from public.dfc_z37_points_matches m
    where m.engine_table_id=p_table_id and m.winner_team is not null
  ) then
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

  begin
    select dc.*
    into v_cfg
    from public.rf_domino_tables dt
    join public.rf_domino_configs dc on dc.id=dt.config_id
    where dt.id=p_table_id;

    if not found or not v_cfg.active then
      return jsonb_build_object(
        'ok',false,'started',false,'status','config_unavailable',
        'error','Configuración de Dominó no disponible'
      );
    end if;

    -- Salen antes de la nueva mano los asientos que no pueden cubrirla.
    for v_rec in
      select ds.id
      from public.rf_domino_seats ds
      where ds.table_id=p_table_id
        and (
          ds.state<>'active'
          or ds.table_balance<greatest(v_cfg.min_continue_balance,v_cfg.hand_stake)
        )
      for update
    loop
      perform public.rf_domino_return_seat_v11(
        v_rec.id,'Saldo insuficiente / salida antes de nueva mano'
      );
    end loop;

    select count(*)
    into v_count
    from public.rf_domino_seats ds
    where ds.table_id=p_table_id
      and ds.state='active'
      and ds.is_ready=true
      and ds.table_balance>=greatest(v_cfg.min_continue_balance,v_cfg.hand_stake);

    if v_count<2 then
      return jsonb_build_object(
        'ok',true,'started',false,'status','waiting_ready','ready_players',v_count
      );
    end if;

    if v_count>4 then
      raise exception 'Cantidad inválida de jugadores confirmados: %',v_count;
    end if;

    v_player_count:=v_count;
    v_stake:=round(v_cfg.hand_stake*v_count,3);
    v_commission:=round(v_stake*v_cfg.commission_pct/100,3);

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

    insert into public.rf_domino_hands(
      table_id,status,pot,commission,play_starts_at
    )
    values(
      p_table_id,'shuffling',v_stake,v_commission,
      now()+make_interval(secs=>v_cfg.shuffle_seconds)
    )
    returning id into v_hand_id;

    select jsonb_agg(
             jsonb_build_array(gs_left.v_left,gs_right.v_right)
             order by random()
           )
    into v_deck
    from generate_series(0,6) as gs_left(v_left)
    cross join lateral generate_series(gs_left.v_left,6) as gs_right(v_right);

    if coalesce(jsonb_array_length(v_deck),0)<>28 then
      raise exception 'Mazo inválido: se esperaban 28 fichas.';
    end if;

    for v_rec in
      select ds.user_id,ds.seat_no
      from public.rf_domino_seats ds
      where ds.table_id=p_table_id
        and ds.state='active'
        and ds.is_ready=true
      order by ds.seat_no
    loop
      v_hand_tiles:='[]'::jsonb;

      for v_j in 0..6 loop
        v_tile:=v_deck->(v_offset+v_j*v_player_count);

        if v_tile is null or jsonb_typeof(v_tile)<>'array' then
          raise exception 'Fallo interno al repartir la ficha % al asiento %.',
            v_j+1,v_rec.seat_no;
        end if;

        v_hand_tiles:=v_hand_tiles||jsonb_build_array(v_tile);
      end loop;

      if jsonb_array_length(v_hand_tiles)<>7 then
        raise exception 'El jugador del asiento % no recibió 7 fichas.',
          v_rec.seat_no;
      end if;

      insert into public.rf_domino_hand_players(
        hand_id,user_id,seat_no,tiles
      )
      values(v_hand_id,v_rec.user_id,v_rec.seat_no,v_hand_tiles);

      v_players_dealt:=v_players_dealt+1;

      for v_j in 0..6 loop
        v_tile:=v_hand_tiles->v_j;
        v_a:=(v_tile->>0)::integer;
        v_b:=(v_tile->>1)::integer;

        if v_a=v_b and v_a>v_best_double then
          v_best_double:=v_a;
          v_start_user:=v_rec.user_id;
        elsif v_best_double<0 and v_a+v_b>v_best_sum then
          v_best_sum:=v_a+v_b;
          v_start_user:=v_rec.user_id;
        end if;
      end loop;

      v_offset:=v_offset+1;
    end loop;

    if v_players_dealt<>v_count then
      raise exception 'Reparto incompleto: % de % jugadores.',v_players_dealt,v_count;
    end if;

    select
      count(*)::integer,
      count(distinct e.tile::text)::integer
    into v_tiles_dealt,v_unique_tiles
    from public.rf_domino_hand_players hp
    cross join lateral jsonb_array_elements(hp.tiles) as e(tile)
    where hp.hand_id=v_hand_id;

    if v_tiles_dealt<>(v_count*7) then
      raise exception 'Reparto inválido: % fichas para % jugadores.',
        v_tiles_dealt,v_count;
    end if;

    if v_unique_tiles<>v_tiles_dealt then
      raise exception 'Se detectaron fichas duplicadas en el reparto.';
    end if;

    if v_start_user is null then
      raise exception 'No se pudo determinar el primer turno.';
    end if;

    update public.rf_domino_hands h
    set turn_user_id=v_start_user
    where h.id=v_hand_id;

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
$function$;