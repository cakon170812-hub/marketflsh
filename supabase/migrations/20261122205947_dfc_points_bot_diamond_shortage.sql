create or replace function public.dfc_z37_admin_points_bot_shortages()
returns table (
  table_id bigint, table_name text, diamonds_required numeric,
  diamonds_available numeric, diamonds_missing numeric
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.dfc_z37_is_admin() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;

  return query
  select g.engine_table_id, c.name, g.entry_diamonds::numeric,
         coalesce(v.balance, 0)::numeric, g.entry_diamonds - coalesce(v.balance, 0)
  from public.dfc_z37_points_matches g
  join public.dfc_z37_points_configs c on c.id = g.config_id
  join public.rf_domino_bot_fund_v17 f on f.id = 1 and f.enabled and f.balance >= g.entry_fc
  left join public.dfc_z15_admin_diamond_vault v on v.id = 1
  where g.state = 'waiting' and c.enabled and c.bots_allowed
    and g.engine_table_id is not null
    and g.entry_diamonds > coalesce(v.balance, 0)
    and (select count(*) from public.rf_domino_seats s where s.table_id = g.engine_table_id) < g.players
    and (select count(*) from public.rf_domino_seats s
         join public.rf_domino_bot_instances_v18 i on i.table_id = s.table_id and i.user_id = s.user_id
         where s.table_id = g.engine_table_id)
        < least(3, coalesce(
          (select t.target_count from public.rf_domino_bot_targets_v19 t where t.table_id = g.engine_table_id),
          (select t.target_count from public.rf_domino_bot_targets_v19 t
           join public.dfc_z37_points_matches previous on previous.engine_table_id = t.table_id
           where previous.config_id = g.config_id
           order by t.updated_at desc, t.table_id desc limit 1),
          3))
    and exists (
      select 1 from public.rf_domino_bot_instances_v18 i
      join public.rf_domino_bot_agents_v17 a on a.slot = i.slot and a.enabled
      where (
        exists (select 1 from public.dfc_z37_points_matches m
                where m.engine_table_id = i.table_id and m.config_id = g.config_id)
        or exists (select 1 from dfc_private.points_bot_catalog x
                   where x.user_id = i.user_id and x.config_id = g.config_id)
      )
      and not exists (select 1 from public.rf_domino_seats s where s.user_id = i.user_id)
      and (i.table_id = g.engine_table_id or not exists (
        select 1 from public.rf_domino_bot_instances_v18 here
        where here.table_id = g.engine_table_id and here.slot = i.slot
      ))
    )
  order by g.engine_table_id;
end;
$$;

revoke all on function public.dfc_z37_admin_points_bot_shortages() from public, anon;
grant execute on function public.dfc_z37_admin_points_bot_shortages() to authenticated;
