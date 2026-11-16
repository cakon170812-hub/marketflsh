-- Z37 fase contable: diamantes personales con origen pendiente de reconciliación.
-- NO activa mesas, NO genera diamantes ni migra saldos existentes por suposición.
-- En todo momento un débito y su crédito de bote ocurrirán en la misma transacción.
create table if not exists public.dfc_z37_diamond_wallets(
 user_id uuid primary key references auth.users(id),
 balance bigint not null default 0,
 verified_at timestamptz,
 verification_source text,
 updated_at timestamptz not null default now()
);
create table if not exists public.dfc_z37_diamond_ledger(
 id bigint generated always as identity primary key,
 user_id uuid references auth.users(id),
 event_key uuid not null unique,
 delta bigint not null,
 balance_after bigint not null,
 event_type text not null,
 match_id uuid references public.dfc_z37_points_matches(id),
 tournament_id uuid references public.dfc_z37_tournaments(id),
 created_at timestamptz not null default now()
);
create table if not exists public.dfc_z37_points_pots(
 match_id uuid primary key references public.dfc_z37_points_matches(id),
 fc_amount numeric(20,2) not null default 0 check(fc_amount>=0),
 diamond_amount bigint not null default 0 check(diamond_amount>=0),
 admin_fc numeric(20,2) not null default 0 check(admin_fc>=0),
 admin_diamonds bigint not null default 0 check(admin_diamonds>=0),
 paid_fc numeric(20,2) not null default 0 check(paid_fc>=0),
 paid_diamonds bigint not null default 0 check(paid_diamonds>=0)
);
create table if not exists public.dfc_z37_points_entry_requests(
 request_id uuid primary key,
 user_id uuid not null references auth.users(id),
 match_id uuid not null references public.dfc_z37_points_matches(id),
 created_at timestamptz not null default now(),
 unique(user_id,match_id)
);
create index if not exists dfc_z37_points_match_state_idx on public.dfc_z37_points_matches(config_id,state);
create index if not exists dfc_z37_diamond_user_idx on public.dfc_z37_diamond_ledger(user_id,created_at desc);
alter table public.dfc_z37_diamond_wallets enable row level security;
alter table public.dfc_z37_diamond_ledger enable row level security;
alter table public.dfc_z37_points_pots enable row level security;
alter table public.dfc_z37_points_entry_requests enable row level security;
revoke all on public.dfc_z37_diamond_wallets,public.dfc_z37_diamond_ledger,
 public.dfc_z37_points_pots,public.dfc_z37_points_entry_requests from anon,authenticated;

create or replace function public.dfc_z37_my_diamonds()
returns table(balance bigint, verified boolean)
language sql stable security definer set search_path=''
as $$
 select w.balance,(w.verified_at is not null) from public.dfc_z37_diamond_wallets w
 where w.user_id=(select auth.uid())
$$;
revoke all on function public.dfc_z37_my_diamonds() from public,anon;
grant execute on function public.dfc_z37_my_diamonds() to authenticated;

-- Preparación de asiento: transacción atómica, balance negativo controlado,
-- idempotencia y ledger de ambas monedas. La mesa debe estar habilitada y
-- el saldo de diamantes verificado. Ninguna está habilitada aún.
create or replace function public.dfc_z37_points_join(p_config uuid,p_request uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare
 uid uuid := auth.uid();
 cfg public.dfc_z37_points_configs;
 matchrow public.dfc_z37_points_matches;
 v_match_id uuid;
 v_existing uuid;
 v_fc_after numeric;
 v_d_after bigint;
 v_seat integer;
 v_team smallint;
 v_total int;
begin
 if uid is null or p_request is null then raise exception 'Inicio de sesión y referencia requeridos'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_config::text,37));
 select * into cfg from public.dfc_z37_points_configs where id=p_config and enabled=true;
 if not found then raise exception 'Mesa por puntos no disponible';end if;
 select r.match_id into v_existing
 from public.dfc_z37_points_entry_requests r where r.request_id=p_request and r.user_id=uid;
 if found then return v_existing;end if;
 if exists(select 1 from public.dfc_z37_points_entry_requests r where r.request_id=p_request and r.user_id<>uid) then
  raise exception 'Referencia de solicitud inválida';
 end if;
 -- Nunca cobrar dos veces si ya está en una partida no liquidada.
 select pp.match_id into v_existing
 from public.dfc_z37_points_participants pp join public.dfc_z37_points_matches pm on pm.id=pp.match_id
 where pp.user_id=uid and pm.state in ('waiting','playing','settlement_pending')
 order by pp.joined_at desc limit 1;
 if found then return v_existing;end if;
 select pm.* into matchrow from public.dfc_z37_points_matches pm
 where pm.config_id=cfg.id and pm.state='waiting'
 and (select count(*) from public.dfc_z37_points_participants pp where pp.match_id=pm.id)<cfg.players
 order by pm.created_at for update skip locked limit 1;
 if not found then
  insert into public.dfc_z37_points_matches(config_id,players,target_points,entry_fc,entry_diamonds,admin_pct)
  values(cfg.id,cfg.players,cfg.target_points,cfg.entry_fc,cfg.entry_diamonds,cfg.admin_pct)
  returning * into matchrow;
  insert into public.dfc_z37_points_pots(match_id) values(matchrow.id);
 end if;
 v_match_id=matchrow.id;
 select gs.n into v_seat from generate_series(1,cfg.players) as gs(n)
 where not exists(select 1 from public.dfc_z37_points_participants pp where pp.match_id=v_match_id and pp.seat_number=gs.n)
 order by gs.n limit 1;
 if v_seat is null then raise exception 'Sin asientos disponibles';end if;
 v_team=case when cfg.players=4 then (case when v_seat in (1,3) then 1 else 2 end)
 else (case when v_seat=1 then 1 else 2 end) end;
 -- Bloqueo permanente por registro autorizado. La verificación es obligatoria.
 update public.dfc_z37_diamond_wallets w set
 balance=w.balance-cfg.entry_diamonds,updated_at=now()
 where w.user_id=uid and w.verified_at is not null
 and w.balance-cfg.entry_diamonds>=-cfg.max_negative_diamonds
 returning w.balance into v_d_after;
 if not found then raise exception 'Saldo de diamantes no verificado o límite negativo excedido';end if;
 update public.rf_profiles p set balance=p.balance-cfg.entry_fc,updated_at=now()
 where p.id=uid and p.balance>=cfg.entry_fc
 returning p.balance into v_fc_after;
 if not found then raise exception 'FlashCoin insuficiente';end if;
 insert into public.dfc_z37_diamond_ledger(user_id,event_key,delta,balance_after,event_type,match_id)
 values(uid,p_request,-cfg.entry_diamonds,v_d_after,'Z37_POINTS_ENTRY',v_match_id);
 perform public.rf_add_ledger(uid,-cfg.entry_fc,'Z37_POINTS_ENTRY','Ingreso mesa puntos '||v_match_id,uid);
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged)
 values(v_match_id,uid,v_seat,v_team,true);
 insert into public.dfc_z37_points_entry_requests(request_id,user_id,match_id)
 values(p_request,uid,v_match_id);
 update public.dfc_z37_points_pots set fc_amount=fc_amount+cfg.entry_fc,
 diamond_amount=diamond_amount+cfg.entry_diamonds where dfc_z37_points_pots.match_id=v_match_id;
 select count(*) into v_total from public.dfc_z37_points_participants where match_id=v_match_id;
 -- No iniciar partida hasta que exista motor de mano + RPC protegido.
 -- El estado waiting sigue siendo verdadero incluso al llenar la mesa.
 return v_match_id;
end $$;
revoke all on function public.dfc_z37_points_join(uuid,uuid) from public,anon;
-- Se deja SIN permiso de ejecución para authenticated hasta cerrar el motor.
