CREATE OR REPLACE FUNCTION public.dfc_z37_prepare_points_table_internal(p_match uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_match public.dfc_z37_points_matches%rowtype;
 v_name text;
 v_template public.rf_domino_configs%rowtype;
 v_config_id smallint;
 v_table_id bigint;
begin
 select * into v_match
 from public.dfc_z37_points_matches
 where id=p_match
 for update;
 if not found then
  raise exception 'Partida por puntos no encontrada';
 end if;
 if v_match.engine_table_id is not null then
  return v_match.engine_table_id;
 end if;
 if v_match.state <> 'waiting' then
  raise exception 'Solo se puede preparar una partida en espera';
 end if;

 select name into strict v_name
 from public.dfc_z37_points_configs where id=v_match.config_id;

 select * into v_template
 from public.rf_domino_configs
 where mode='normal'
 order by active desc,id
 limit 1;
 if not found then
  raise exception 'No hay una configuración de Por gane para usar como base';
 end if;

 perform pg_catalog.pg_advisory_xact_lock(1242999999::bigint);
 select candidate.id::smallint into v_config_id
 from pg_catalog.generate_series(8,32767) as candidate(id)
 where not exists (select 1 from public.rf_domino_configs c where c.id=candidate.id)
 order by candidate.id
 limit 1;
 if v_config_id is null then
  raise exception 'Se alcanzó el límite del catálogo de mesas';
 end if;

 -- The points match owns the entry and pot; the board must not collect them.
 insert into public.rf_domino_configs
  (id,name,mode,active,min_entry,hand_stake,commission_pct,pass_fee,min_continue_balance,turn_seconds,shuffle_seconds)
 values
  (v_config_id,pg_catalog.left(v_name,80),'normal',false,v_template.min_entry,0,0,0,0,v_template.turn_seconds,v_template.shuffle_seconds);

 insert into public.rf_domino_tables(config_id,table_no)
 values(v_config_id,1)
 returning id into v_table_id;

 update public.dfc_z37_points_matches
 set engine_table_id=v_table_id
 where id=p_match;

 return v_table_id;
end;
$function$;
revoke all on function public.dfc_z37_prepare_points_table_internal(uuid) from public, anon, authenticated, service_role;

create or replace function public.dfc_z37_admin_prepare_points_table(p_match uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
begin
 if auth.uid() is null or not coalesce(public.dfc_z37_is_admin(),false) then
  raise exception 'Acceso no autorizado';
 end if;
 return public.dfc_z37_prepare_points_table_internal(p_match);
end;
$function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_join_engine(p_config uuid, p_request uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

 v_table:=public.dfc_z37_prepare_points_table_internal(v_match_id);
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
$function$;
