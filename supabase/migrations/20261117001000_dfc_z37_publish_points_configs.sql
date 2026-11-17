create or replace function public.dfc_z37_admin_save_points(p_input jsonb)
returns uuid language plpgsql security definer set search_path=''
as $$
declare
 v_enabled boolean;
 v_id uuid; v_name text; v_players smallint; v_target int;
 v_fc numeric; v_diamonds bigint; v_limit bigint; v_pct numeric;
begin
 if (select auth.uid()) is null or not public.dfc_z37_is_admin() then raise exception 'Acceso no autorizado'; end if;
 v_enabled=(p_input->>'enabled')::boolean;
 v_name=trim(p_input->>'name');
 v_players=(p_input->>'players')::smallint;
 v_target=(p_input->>'target_points')::int;
 v_fc=(p_input->>'entry_fc')::numeric;
 v_diamonds=(p_input->>'entry_diamonds')::bigint;
 v_limit=(p_input->>'max_negative_diamonds')::bigint;
 v_pct=(p_input->>'admin_pct')::numeric;
 if v_name is null or v_players is null or v_target is null or v_fc is null or
    v_diamonds is null or v_limit is null or v_pct is null or
    length(v_name) not between 1 and 160 or v_players not between 2 and 4 or v_target<1 or
    v_fc<0 or v_diamonds<0 or v_limit<0 or v_pct not between 0 and 50 then
    raise exception 'Configuración inválida';
 end if;
 if p_input ? 'id' and p_input->>'id' is not null then
  v_id=(p_input->>'id')::uuid;
  update public.dfc_z37_points_configs
  set name=v_name,players=v_players,target_points=v_target,entry_fc=v_fc,
      entry_diamonds=v_diamonds,max_negative_diamonds=v_limit,admin_pct=v_pct,
      enabled=coalesce(v_enabled,enabled),updated_at=now()
  where id=v_id;
  if not found then raise exception 'Mesa por puntos no encontrada'; end if;
 else
  insert into public.dfc_z37_points_configs(name,players,target_points,entry_fc,entry_diamonds,max_negative_diamonds,admin_pct,enabled)
  values(v_name,v_players,v_target,v_fc,v_diamonds,v_limit,v_pct,coalesce(v_enabled,false)) returning id into v_id;
 end if;
 return v_id;
end;
$$;
revoke all on function public.dfc_z37_admin_save_points(jsonb) from public,anon;
grant execute on function public.dfc_z37_admin_save_points(jsonb) to authenticated;

