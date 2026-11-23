create function public.dfc_domino_admin_table_styles(p_style_key text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  checked_style dfc_table_style.style_key;
  board_id bigint;
  saved jsonb;
  applied_count integer := 0;
  pending_count integer := 0;
  catalog jsonb;
begin
  if actor is null or not coalesce(public.rf_is_leader(actor), false) then
    raise exception 'Solo el administrador puede cambiar el estilo' using errcode = '42501';
  end if;

  if p_style_key is not null then
    checked_style := p_style_key;
    -- Use the individual save in a single transaction so every table retains
    -- the style of its current hand and concurrent bulk saves use the same order.
    for board_id in
      select t.id
      from public.rf_domino_tables t
      join public.rf_domino_configs c on c.id = t.config_id
      order by t.id
      for key share of t
    loop
      saved := public.dfc_domino_admin_table_style(board_id, checked_style::text);
      applied_count := applied_count + 1;
      if (saved ->> 'pending')::boolean then
        pending_count := pending_count + 1;
      end if;
    end loop;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id::text,
    'number', t.table_no,
    'name', coalesce(pc.name, c.name),
    'mode', case
      when m.engine_table_id is not null or tm.game_mode = 'points' then 'points'
      when c.id = 7 or tm.game_mode = 'tournament' then 'tournament'
      when c.mode = 'paid_pass' or tm.game_mode in ('paid_pass', 'pintintin') then 'paid_pass'
      else 'normal'
    end,
    'selected_style', coalesce(s.style_key::text, 'navy-gold')
  ) order by coalesce(pc.name, c.name), t.table_no, t.id), '[]'::jsonb)
  into catalog
  from public.rf_domino_tables t
  join public.rf_domino_configs c on c.id = t.config_id
  left join public.rf_domino_012o_table_modes tm on tm.table_id = t.id
  left join public.dfc_z37_points_matches m on m.engine_table_id = t.id
  left join public.dfc_z37_points_configs pc on pc.id = m.config_id
  left join dfc_table_style.table_styles s on s.table_id = t.id;

  return jsonb_build_object('tables', catalog, 'applied', applied_count, 'pending', pending_count);
end;
$$;

revoke all on function public.dfc_domino_admin_table_styles(text) from public, anon;
grant execute on function public.dfc_domino_admin_table_styles(text) to authenticated;
