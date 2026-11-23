create schema dfc_table_style;
revoke all on schema dfc_table_style from public, anon, authenticated;

create domain dfc_table_style.style_key as text
  check (value ~ '^(navy-gold|moderna-[1-6]|clasica-[1-8])$');

create table dfc_table_style.table_styles (
  table_id bigint primary key references public.rf_domino_tables(id) on delete cascade,
  style_key dfc_table_style.style_key not null,
  deferred_hand_id bigint
);

create table dfc_table_style.hand_styles (
  hand_id bigint primary key references public.rf_domino_hands(id) on delete cascade,
  style_key dfc_table_style.style_key not null
);

create function dfc_table_style.snapshot_hand()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('dfc_table_style:' || new.table_id, 0)
  );

  insert into dfc_table_style.hand_styles(hand_id, style_key)
  select new.id, style_key
  from dfc_table_style.table_styles
  where table_id = new.table_id and style_key <> 'navy-gold';

  return new;
end;
$$;

create trigger dfc_snapshot_table_style
after insert on public.rf_domino_hands
for each row execute function dfc_table_style.snapshot_hand();

create function dfc_table_style.resolve(
  p_table_id bigint, p_active_hand_id bigint, p_last_hand_id bigint
)
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    case
      when p_active_hand_id is not null or s.deferred_hand_id = p_last_hand_id
        then h.style_key
      else s.style_key
    end, 'navy-gold'
  )::text
  from (values (p_table_id)) requested(id)
  left join dfc_table_style.table_styles s on s.table_id = requested.id
  left join dfc_table_style.hand_styles h on h.hand_id =
    coalesce(p_active_hand_id, s.deferred_hand_id);
$$;

create function public.dfc_domino_styled_state(p_table_id bigint, p_spectator boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  snapshot jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;

  if p_spectator then
    snapshot := public.rf_domino_012z8_spectate_state(p_table_id);
  else
    snapshot := public.rf_domino_get_state_v160(p_table_id);
  end if;

  return snapshot || jsonb_build_object('table_style', dfc_table_style.resolve(
    p_table_id, (snapshot #>> '{hand,id}')::bigint, (snapshot #>> '{last_result,id}')::bigint
  ));
end;
$$;

create function public.dfc_domino_admin_table_style(p_table_id bigint, p_style_key text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  requested_style dfc_table_style.style_key;
  table_label jsonb;
  active_hand_id bigint;
  last_hand_id bigint;
  selected_style text;
  visible_style text;
begin
  if actor is null or not coalesce(public.rf_is_leader(actor), false) then
    raise exception 'Solo el administrador puede cambiar el estilo' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'id', t.id::text, 'number', t.table_no, 'name', c.name,
    'mode', coalesce(m.game_mode, c.mode)
  ) into table_label
  from public.rf_domino_tables t
  join public.rf_domino_configs c on c.id = t.config_id
  left join public.rf_domino_012o_table_modes m on m.table_id = t.id
  where t.id = p_table_id;

  if table_label is null then
    raise exception 'Mesa no encontrada. Comprueba el ID.';
  end if;

  if p_style_key is not null then
    requested_style := p_style_key;
    perform 1 from public.rf_domino_tables where id = p_table_id for key share;
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('dfc_table_style:' || p_table_id, 0)
    );
  end if;

  select id into active_hand_id from public.rf_domino_hands
  where table_id = p_table_id and status in ('shuffling', 'playing');
  if active_hand_id is null then
    select id into last_hand_id from public.rf_domino_hands
    where table_id = p_table_id and status = 'settled'
    order by id desc limit 1;
  end if;

  if p_style_key is not null then
    insert into dfc_table_style.table_styles(table_id, style_key, deferred_hand_id)
    values (p_table_id, requested_style, active_hand_id)
    on conflict (table_id) do update
    set style_key = excluded.style_key, deferred_hand_id = excluded.deferred_hand_id
    where table_styles.style_key is distinct from excluded.style_key;
  end if;

  select style_key into selected_style from dfc_table_style.table_styles where table_id = p_table_id;
  selected_style := coalesce(selected_style, 'navy-gold');
  visible_style := dfc_table_style.resolve(p_table_id, active_hand_id, last_hand_id);

  return table_label || jsonb_build_object(
    'selected_style', selected_style, 'visible_style', visible_style,
    'pending', selected_style <> visible_style
  );
end;
$$;

revoke all on function public.dfc_domino_styled_state(bigint, boolean) from public, anon;
grant execute on function public.dfc_domino_styled_state(bigint, boolean) to authenticated;

revoke all on function public.dfc_domino_admin_table_style(bigint, text) from public, anon;
grant execute on function public.dfc_domino_admin_table_style(bigint, text) to authenticated;
