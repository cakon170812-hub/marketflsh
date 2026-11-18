create function public.dfc_z37_points_table_ids()
returns table(config_id uuid, table_id text, state text)
language sql stable security definer set search_path=''
as $$
  select m.config_id,m.engine_table_id::text,m.state
  from public.dfc_z37_points_matches m
  join public.dfc_z37_points_configs c on c.id=m.config_id
  where auth.uid() is not null and m.engine_table_id is not null
    and ((c.enabled and m.state in ('waiting','playing')) or public.dfc_z37_is_admin())
  order by m.created_at desc,m.id desc
$$;
revoke all on function public.dfc_z37_points_table_ids() from public,anon,authenticated,service_role;
grant execute on function public.dfc_z37_points_table_ids() to authenticated;
