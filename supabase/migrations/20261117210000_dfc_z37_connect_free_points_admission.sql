alter function public.dfc_z37_points_join_engine(uuid,uuid) rename to dfc_z37_points_join_engine_internal;
revoke all on function public.dfc_z37_points_join_engine_internal(uuid,uuid) from public, anon, authenticated, service_role;

create function public.dfc_z37_points_join_engine(p_config uuid, p_request uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_config public.dfc_z37_points_configs%rowtype;
begin
  if auth.uid() is null or p_request is null then
    raise exception 'Inicio de sesión y referencia requeridos';
  end if;

  -- Use the same lock order as the engine before inspecting the entry terms.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,37001));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_config::text,37));

  select c.* into v_config
  from public.dfc_z37_points_configs c
  where c.id=p_config and c.enabled
  for share;
  if not found or v_config.entry_fc<>0 or v_config.entry_diamonds<>0 then
    raise exception 'La entrada por puntos solo está habilitada para mesas sin aporte';
  end if;

  return public.dfc_z37_points_join_engine_internal(p_config,p_request);
end;
$function$;

revoke all on function public.dfc_z37_points_join_engine(uuid,uuid) from public, anon, authenticated, service_role;
grant execute on function public.dfc_z37_points_join_engine(uuid,uuid) to authenticated;

create function public.dfc_z37_points_lobby()
returns table(id uuid,name text,players smallint,target_points integer,entry_fc numeric,entry_diamonds bigint,admin_pct numeric,can_join boolean)
language sql
stable
security invoker
set search_path = ''
as $function$
  select c.*, c.entry_fc=0 and c.entry_diamonds=0
  from public.dfc_z37_public_points() c
$function$;

revoke all on function public.dfc_z37_points_lobby() from public, anon, authenticated, service_role;
grant execute on function public.dfc_z37_points_lobby() to authenticated;