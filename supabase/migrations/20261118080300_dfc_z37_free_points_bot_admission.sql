create function public.dfc_z37_seat_trial_bot(p_table_id bigint)
returns integer language plpgsql security definer set search_path='' as $$
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
end $$;
revoke all on function public.dfc_z37_seat_trial_bot(bigint) from public,anon,authenticated,service_role;
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
  RETURN public.dfc_z37_seat_trial_bot(p_table_id);
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
begin
  if uid is null or p_request is null or p_config is distinct from 'b3abde40-ea42-4a52-ab24-0ce93c090200'::uuid then
    raise exception 'Inicia sesión para entrar a la mesa de prueba';
  end if;
  perform pg_advisory_xact_lock(pg_catalog.hashtextextended(p_config::text,37));
  perform 1 from public.dfc_z37_points_configs where id=p_config and enabled and players=2
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
    insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready)
    values(table_key,uid,seat_count,0,'active',true);
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
end $function$
;
