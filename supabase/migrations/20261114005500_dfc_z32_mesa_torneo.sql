begin;

lock table public.rf_domino_configs in share row exclusive mode;

do $tournament$
declare
  tournament_id constant smallint := 7;
  base_config public.rf_domino_configs%rowtype;
  tournament_table_id bigint;
begin
  if exists (
    select 1 from public.rf_domino_configs
    where id = tournament_id and (name <> 'MESA DE TORNEO' or mode <> 'normal')
  ) then
    raise exception 'El ID de configuración de torneo ya está en uso';
  end if;

  select * into strict base_config
  from public.rf_domino_configs where id = 3 and mode = 'normal';

  insert into public.rf_domino_configs (
    id, name, mode, active, min_entry, hand_stake, commission_pct,
    pass_fee, min_continue_balance, turn_seconds, shuffle_seconds
  ) values (
    tournament_id, 'MESA DE TORNEO', 'normal', false, base_config.min_entry,
    base_config.hand_stake, base_config.commission_pct, base_config.pass_fee,
    base_config.min_continue_balance, base_config.turn_seconds, base_config.shuffle_seconds
  ) on conflict (id) do nothing;

  insert into public.rf_domino_tables (config_id, table_no)
  values (tournament_id, 1)
  on conflict (config_id, table_no) do nothing;

  select id into strict tournament_table_id from public.rf_domino_tables
  where config_id = tournament_id;

  insert into public.rf_domino_012o_table_modes (table_id, game_mode, is_visible)
  values (tournament_table_id, 'normal', false)
  on conflict (table_id) do nothing;
end
$tournament$;

create unique index if not exists dfc_z32_one_tournament_table
on public.rf_domino_tables (config_id) where config_id = 7;

create or replace function public.dfc_z32_admin_tournament_table(p_open boolean default null)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $tournament$
declare
  tournament_id constant smallint := 7;
  tournament_table_id bigint;
  table_number integer;
  minimum numeric;
  is_open boolean;
  occupied integer;
  hand_in_progress boolean;
begin
  if auth.uid() is null or not public.rf_is_leader(auth.uid()) then
    raise exception 'Acceso administrativo denegado' using errcode = '42501';
  end if;

  if p_open is not null then
    perform pg_advisory_xact_lock(1242990000::bigint + tournament_id);
  end if;

  select t.id, t.table_no, c.min_entry, c.active and m.is_visible
  into strict tournament_table_id, table_number, minimum, is_open
  from public.rf_domino_tables t
  join public.rf_domino_configs c on c.id = t.config_id
  join public.rf_domino_012o_table_modes m on m.table_id = t.id
  where t.config_id = tournament_id;

  if p_open is not null then
    perform pg_advisory_xact_lock(1242900000::bigint + tournament_table_id);
  end if;

  select count(*) into occupied from public.rf_domino_seats s
  where s.table_id = tournament_table_id;
  select exists (
    select 1 from public.rf_domino_hands h
    where h.table_id = tournament_table_id and h.status in ('shuffling', 'playing')
  ) into hand_in_progress;

  if p_open is false and (occupied > 0 or hand_in_progress) then
    raise exception 'Espera a que termine la mano y se desocupen los asientos';
  end if;

  if p_open is not null then
    update public.rf_domino_configs set active = p_open, updated_at = now()
    where id = tournament_id and active is distinct from p_open;
    update public.rf_domino_012o_table_modes set is_visible = p_open, updated_at = now()
    where table_id = tournament_table_id and is_visible is distinct from p_open;
    is_open := p_open;
  end if;

  return jsonb_build_object('table_id', tournament_table_id, 'table_no', table_number,
    'is_open', is_open, 'players', occupied, 'min_entry', minimum);
end
$tournament$;

revoke all on function public.dfc_z32_admin_tournament_table(boolean) from public, anon, authenticated;
grant execute on function public.dfc_z32_admin_tournament_table(boolean) to authenticated;

commit;
