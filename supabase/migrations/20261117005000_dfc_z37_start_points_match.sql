-- Requires the Z37 points wallet and points table migrations.
create function public.dfc_z37_points_join_engine(p_config uuid,p_request uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
 v_user uuid:=auth.uid();
 v_match public.dfc_z37_points_matches%rowtype;
 v_match_id uuid;
 v_table bigint;
 v_config smallint;
 v_members integer;
 v_start jsonb;
begin
 if v_user is null then raise exception 'Inicio de sesión requerido'; end if;
 -- Serialize entry by player and by configured room, including across modalities.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,37001));
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_config::text,37));

 -- A retry in a running match returns the same physical table.
 select m.* into v_match
 from public.dfc_z37_points_matches m
 join public.dfc_z37_points_participants p on p.match_id=m.id
 where p.user_id=v_user and m.state in ('waiting','playing','settlement_pending')
 order by p.joined_at desc limit 1;
 if found then
  if v_match.config_id<>p_config then raise exception 'Ya tienes una partida por puntos pendiente'; end if;
  if v_match.state<>'waiting' then
   return jsonb_build_object('match_id',v_match.id,'table_id',v_match.engine_table_id,'state',v_match.state);
  end if;
 end if;
 if exists(select 1 from public.rf_domino_seats where user_id=v_user) then
  raise exception 'Sal de tu mesa actual antes de entrar a Por puntos';
 end if;

 -- Prevent mixing terms from two revisions of the same room.
 perform 1 from public.dfc_z37_points_configs where id=p_config for share;
 if exists (
  select 1 from public.dfc_z37_points_matches m
  join public.dfc_z37_points_configs c on c.id=m.config_id
  where m.config_id=p_config and m.state='waiting'
  and (m.players,m.target_points,m.entry_fc,m.entry_diamonds,m.admin_pct)
      is distinct from (c.players,c.target_points,c.entry_fc,c.entry_diamonds,c.admin_pct)
 ) then raise exception 'Hay una partida en espera con las reglas anteriores'; end if;

 v_match_id:=public.dfc_z37_points_join(p_config,p_request);
 select * into strict v_match from public.dfc_z37_points_matches where id=v_match_id for update;
 if v_match.config_id<>p_config or v_match.state<>'waiting' then
  raise exception 'La solicitud pertenece a otra partida';
 end if;
 select count(*) into v_members from public.dfc_z37_points_participants where match_id=v_match_id and charged;
 if v_members<v_match.players then
  return jsonb_build_object('match_id',v_match_id,'state','waiting','seated',v_members,'capacity',v_match.players);
 end if;
 if v_members<>v_match.players then raise exception 'Cupo de la partida incorrecto'; end if;

 -- Until admission and settlement are verified, this entry point is restricted
 -- to the privileged test operator. The existing preparation routine checks auth.
 v_table:=public.dfc_z37_admin_prepare_points_table(v_match_id);
 select config_id into strict v_config from public.rf_domino_tables where id=v_table;
 update public.rf_domino_configs set active=true where id=v_config;
 insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready)
 select v_table,user_id,seat_number,0,'active',true
 from public.dfc_z37_points_participants where match_id=v_match_id and charged;

 v_start:=public.rf_domino_try_start_v189(v_table);
 if not coalesce((v_start->>'started')::boolean,false) then
  raise exception 'El motor no inició la partida: %',coalesce(v_start->>'status','desconocido');
 end if;
 update public.dfc_z37_points_matches set state='playing' where id=v_match_id;
 return jsonb_build_object('match_id',v_match_id,'table_id',v_table,'state','playing');
end;
$$;

revoke all on function public.dfc_z37_points_join_engine(uuid,uuid) from public,anon,authenticated;
