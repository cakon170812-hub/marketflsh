
alter table public.dfc_z37_points_participants add column absent_at timestamptz;
create function public.dfc_z37_trial_keep_seat()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new.state='active' then return new; end if;
 if old.table_balance<>0 or not exists (
  select 1 from public.dfc_z37_points_matches m join public.dfc_z37_points_participants p on p.match_id=m.id
  where m.engine_table_id=old.table_id and m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' and m.state='playing'
    and m.entry_fc=0 and m.entry_diamonds=0 and p.user_id=old.user_id
 ) then
   if tg_op='DELETE' then return old; end if;
   return new;
 end if;
 update public.dfc_z37_points_participants p set absent_at=coalesce(p.absent_at,clock_timestamp())
 from public.dfc_z37_points_matches m
 where m.id=p.match_id and m.engine_table_id=old.table_id and p.user_id=old.user_id;
 if tg_op='DELETE' then return null; end if;
 new.state:='active';
 new.is_ready:=true;
 return new;
end $$;
create trigger dfc_z37_keep_trial_seat before delete or update of state on public.rf_domino_seats
for each row execute function public.dfc_z37_trial_keep_seat();
revoke all on function public.dfc_z37_trial_keep_seat() from public,anon,authenticated,service_role;

create function public.dfc_z37_trial_restore_seats(p_table_id bigint)
returns void language plpgsql security definer set search_path='' as $$
declare game public.dfc_z37_points_matches%rowtype; member record;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('b3abde40-ea42-4a52-ab24-0ce93c090200',37)) then return; end if;
 select * into game from public.dfc_z37_points_matches where engine_table_id=p_table_id and config_id='b3abde40-ea42-4a52-ab24-0ce93c090200'
 and state='playing' and entry_fc=0 and entry_diamonds=0 for update;
 if not found then return; end if;
 for member in select p.user_id,p.seat_number from public.dfc_z37_points_participants p
 where p.match_id=game.id and not exists(select 1 from public.rf_domino_seats s where s.user_id=p.user_id)
 loop
   insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready,last_seen_at)
   values(p_table_id,member.user_id,member.seat_number,0,'active',true,clock_timestamp()-interval '1 minute')
   on conflict do nothing;
   if found then update public.dfc_z37_points_participants set absent_at=coalesce(absent_at,clock_timestamp())
      where match_id=game.id and user_id=member.user_id; end if;
 end loop;
end $$;
revoke all on function public.dfc_z37_trial_restore_seats(bigint) from public,anon,authenticated,service_role;

create or replace function public.rf_domino_heartbeat_v184(p_table_id bigint)
returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); present boolean;
begin
 if uid is null then return false; end if;
 update public.rf_domino_seats set last_seen_at=now()
 where table_id=p_table_id and user_id=uid and state='active';
 present:=found;
 if present then
   update public.dfc_z37_points_participants p set absent_at=null
   from public.dfc_z37_points_matches m
   where m.id=p.match_id and m.engine_table_id=p_table_id and m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200'
     and m.state='playing' and p.user_id=uid and p.absent_at is not null;
 end if;
 return present;
end $$;
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
    where m.engine_table_id=p_table_id and m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' and m.state='playing'
      and p.user_id=v_hand.turn_user_id
      and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.table_id=p_table_id and b.user_id=p.user_id);
    if coalesce(v_trial_absent,false) then
      if v_hand.auto_pass_started_at is null then
        update public.rf_domino_hands set auto_pass_started_at=clock_timestamp(),turn_deadline=clock_timestamp()+interval '2.5 seconds' where id=v_hand.id;
      elsif clock_timestamp()>=v_hand.auto_pass_started_at+interval '2.5 seconds' then
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
$function$
;
CREATE OR REPLACE FUNCTION public.dfc_z37_trial_replay_cycle()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare item record;
begin
 for item in select m.engine_table_id as table_id from public.dfc_z37_points_matches m
  where m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' and m.engine_table_id is not null
    and ((m.state='settled' and m.settled_at+interval '13 seconds'<=clock_timestamp())
         or m.state='playing')
 loop
   perform public.dfc_z37_trial_replay_rotate(item.table_id);
   if exists(select 1 from public.dfc_z37_points_matches m where m.engine_table_id=item.table_id and m.state='playing') then
      perform public.dfc_z37_trial_restore_seats(item.table_id);
      if not exists(select 1 from public.rf_domino_hands h where h.table_id=item.table_id and h.status in ('playing','shuffling')) then
        perform public.rf_domino_try_start_v189(item.table_id);
      else
        perform public.rf_domino_tick_v11(item.table_id);
      end if;
   end if;
 end loop;
end $function$
;
select cron.schedule('dfc-z37-trial-replay','1 second','select public.dfc_z37_trial_replay_cycle();');
