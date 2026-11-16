-- DOMINO FLASH COIN Z37 / FASE 1 / ESTRUCTURA AISLADA
-- Estructura para el catálogo y los borradores Z37.
-- No modifica tablas, funciones ni saldos de Z36.
begin;

create table if not exists public.dfc_z37_tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  description text not null default '',
  artwork_key text not null check (artwork_key in ('gold_blue','purple_neon','red_championship','emerald_green')),
  starts_at timestamptz not null,
  registration_closes_at timestamptz not null,
  min_players integer not null default 2 check (min_players >= 2),
  entry_fc numeric(20,2) not null default 0 check (entry_fc >= 0),
  guaranteed_fc numeric(20,2) not null default 0 check (guaranteed_fc >= 0),
  funded_fc numeric(20,2) not null default 0 check (funded_fc >= 0),
  diamond_initial bigint not null check (diamond_initial > 0),
  diamond_pass_cost bigint not null check (diamond_pass_cost > 0),
  diamond_minimum bigint not null check (diamond_minimum >= 0),
  rebuy_fc numeric(20,2) not null default 0 check (rebuy_fc >= 0),
  rebuy_diamonds bigint not null default 0 check (rebuy_diamonds >= 0),
  rebuy_max smallint not null default 2 check (rebuy_max = 2),
  paid_places smallint not null check (paid_places between 1 and 10),
  signup_admin_pct numeric(5,2) not null default 0 check (signup_admin_pct between 0 and 100),
  -- porcentajes para posiciones 1..paid_places: lista JSON validada por RPC del administrador
  prize_pct jsonb not null default '[]'::jsonb check (jsonb_typeof(prize_pct)='array'),
  card_expiry_days integer not null default 30 check (card_expiry_days > 0),
  state text not null default 'draft' check (state in ('draft','open','locked','running','settlement_pending','settled','cancelled')),
  frozen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (registration_closes_at <= starts_at),
  check (entry_fc > 0 or guaranteed_fc >= 0)
);

create table if not exists public.dfc_z37_tournament_players (
  tournament_id uuid not null references public.dfc_z37_tournaments(id),
  user_id uuid not null references auth.users(id),
  registered_at timestamptz not null default now(),
  status text not null default 'registered'
    check (status in ('registered','playing','rebuy_window','eliminated','champion')),
  seat_table_id uuid,
  diamonds_remaining bigint not null default 0 check (diamonds_remaining >= 0),
  rebuys_used smallint not null default 0 check (rebuys_used between 0 and 2),
  rebuy_deadline timestamptz,
  eliminated_at timestamptz,
  elimination_order bigint,
  final_position integer check (final_position > 0),
  primary key(tournament_id,user_id),
  unique(tournament_id,elimination_order),
  unique(tournament_id,final_position)
);

create table if not exists public.dfc_z37_tournament_funds (
  tournament_id uuid primary key references public.dfc_z37_tournaments(id),
  fc_signup_gross numeric(20,2) not null default 0 check (fc_signup_gross >= 0),
  fc_rebuy_gross numeric(20,2) not null default 0 check (fc_rebuy_gross >= 0),
  fc_admin_share numeric(20,2) not null default 0 check (fc_admin_share >= 0),
  fc_prize_share numeric(20,2) not null default 0 check (fc_prize_share >= 0),
  -- saldo de diamantes retirados a jugadores eliminados, no incluye fichas
  -- ya transferidas a otros jugadores
  diamond_elimination_reserve bigint not null default 0 check (diamond_elimination_reserve >= 0),
  diamond_issued_total bigint not null default 0 check (diamond_issued_total >= 0),
  diamond_transferred_personal bigint not null default 0 check (diamond_transferred_personal >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.dfc_z37_financial_events (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.dfc_z37_tournaments(id),
  user_id uuid references auth.users(id),
  external_request_id uuid not null unique,
  event_type text not null check (event_type in (
    'signup','rebuy','admin_fund','admin_share','prize_card','diamond_transfer',
    'diamond_pass','diamond_elimination','refund','reconciliation'
  )),
  fc_delta numeric(20,2) not null default 0,
  diamond_delta bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.dfc_z37_tournament_prizes (
  tournament_id uuid not null references public.dfc_z37_tournaments(id),
  position integer not null check (position between 1 and 10),
  user_id uuid not null references auth.users(id),
  fc_amount numeric(20,2) not null check (fc_amount >= 0),
  diamond_amount bigint not null default 0 check (diamond_amount >= 0),
  card_reference text unique,
  settlement_status text not null default 'pending' check (settlement_status in ('pending','processing','settled','failed')),
  issued_at timestamptz,
  primary key(tournament_id,position),
  unique(tournament_id,user_id)
);

create table if not exists public.dfc_z37_points_configs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  players smallint not null check (players between 2 and 4),
  target_points integer not null check (target_points > 0),
  entry_fc numeric(20,2) not null check (entry_fc >= 0),
  entry_diamonds bigint not null check (entry_diamonds >= 0),
  max_negative_diamonds bigint not null default 0 check (max_negative_diamonds >= 0),
  admin_pct numeric(5,2) not null check (admin_pct between 0 and 50),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dfc_z37_points_matches (
  id uuid primary key default gen_random_uuid(),
  config_id uuid not null references public.dfc_z37_points_configs(id),
  -- copia economica inmutable cuando se inicia una partida
  players smallint not null check (players between 2 and 4),
  target_points integer not null check (target_points > 0),
  entry_fc numeric(20,2) not null check (entry_fc >= 0),
  entry_diamonds bigint not null check (entry_diamonds >= 0),
  admin_pct numeric(5,2) not null check (admin_pct between 0 and 50),
  state text not null default 'waiting' check (state in ('waiting','playing','settlement_pending','settled','cancelled')),
  team_a_points integer not null default 0 check (team_a_points >= 0),
  team_b_points integer not null default 0 check (team_b_points >= 0),
  winner_team smallint check (winner_team in (1,2)),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create table if not exists public.dfc_z37_points_participants (
  match_id uuid not null references public.dfc_z37_points_matches(id),
  user_id uuid not null references auth.users(id),
  seat_number smallint not null check (seat_number between 1 and 4),
  team smallint not null check (team in (1,2)),
  points_individual integer not null default 0 check (points_individual >= 0),
  charged boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key(match_id,user_id),
  unique(match_id,seat_number)
);

create table if not exists public.dfc_z37_points_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.dfc_z37_points_matches(id),
  external_request_id uuid not null unique,
  user_id uuid not null references auth.users(id),
  team smallint not null check (team in (1,2)),
  event_type text not null check (event_type in ('domino','trancazo','capicua','round_pass','tiebreak')),
  points integer not null check (points >= 0),
  created_at timestamptz not null default now()
);

-- Defense in depth: ninguna tabla nueva es directamente editable por clientes.
-- Los RPCs autentificados con controles de propiedad y privilegios se diseñan
-- separadamente; no se habilita INSERT/UPDATE/DELETE a authenticated/anon.
alter table public.dfc_z37_tournaments enable row level security;
alter table public.dfc_z37_tournament_players enable row level security;
alter table public.dfc_z37_tournament_funds enable row level security;
alter table public.dfc_z37_financial_events enable row level security;
alter table public.dfc_z37_tournament_prizes enable row level security;
alter table public.dfc_z37_points_configs enable row level security;
alter table public.dfc_z37_points_matches enable row level security;
alter table public.dfc_z37_points_participants enable row level security;
alter table public.dfc_z37_points_events enable row level security;

revoke all on public.dfc_z37_tournaments from anon,authenticated;
revoke all on public.dfc_z37_tournament_players from anon,authenticated;
revoke all on public.dfc_z37_tournament_funds from anon,authenticated;
revoke all on public.dfc_z37_financial_events from anon,authenticated;
revoke all on public.dfc_z37_tournament_prizes from anon,authenticated;
revoke all on public.dfc_z37_points_configs from anon,authenticated;
revoke all on public.dfc_z37_points_matches from anon,authenticated;
revoke all on public.dfc_z37_points_participants from anon,authenticated;
revoke all on public.dfc_z37_points_events from anon,authenticated;

commit;
