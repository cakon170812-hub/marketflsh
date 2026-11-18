create or replace function public.dfc_z37_points_join_engine(p_config uuid, p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
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
  if seat_count<2 then
    return jsonb_build_object('state','waiting','table_id',table_key,'seated',seat_count,'capacity',2);
  end if;
  update public.dfc_z37_points_matches set state='playing' where id=game.id;
  started:=public.rf_domino_try_start_v189(table_key);
  if not coalesce((started->>'started')::boolean,false) then
    raise exception 'El motor no inició la prueba: %',started;
  end if;
  return jsonb_build_object('state','playing','table_id',table_key);
end $$;
revoke all on function public.dfc_z37_points_join_engine(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.dfc_z37_points_join_engine(uuid,uuid) to authenticated;
