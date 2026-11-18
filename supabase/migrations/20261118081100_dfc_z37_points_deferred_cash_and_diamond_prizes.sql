
create table public.dfc_z37_points_payouts(
 match_id uuid not null references public.dfc_z37_points_matches(id),
 user_id uuid not null references public.rf_profiles(id),
 fc_principal numeric not null default 0 check(fc_principal>=0),
 fc_profit numeric not null default 0 check(fc_profit>=0),
 paid_at timestamptz,
 primary key(match_id,user_id)
);
alter table public.dfc_z37_points_payouts enable row level security;
revoke all on public.dfc_z37_points_payouts from public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.dfc_z37_points_close_fc()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 prize_user uuid; entries integer; gross numeric; commission numeric; principal numeric;
 profit numeric; balance_after numeric; days integer; room text;
begin
 if new.state=old.state or new.entry_fc=0 then return new; end if;
 if new.state='cancelled' then
  perform public.dfc_z37_points_release_fc(new.id);
  return new;
 end if;
 if new.state<>'settled' then return new; end if;
 select count(*),sum(r.amount) into entries,gross from public.dfc_z37_points_fc_reserves r
 where r.match_id=new.id and r.status='reserved';
 if entries<>new.players or gross<>new.entry_fc*new.players or new.players<>2 then
  raise exception 'Aportes FlashCoin de la partida incompletos';
 end if;
 select p.user_id,r.amount into strict prize_user,principal
 from public.dfc_z37_points_participants p join public.dfc_z37_points_fc_reserves r using(match_id,user_id)
 where p.match_id=new.id and p.team=new.winner_team and r.status='reserved';
 commission:=round(gross*new.admin_pct/100,3);
 principal:=least(principal,gross-commission);
 profit:=gross-commission-principal;
 update public.dfc_z37_points_fc_reserves set status='settled' where match_id=new.id and status='reserved';
 insert into public.dfc_z37_points_payouts(match_id,user_id,fc_principal,fc_profit)
 values(new.id,prize_user,principal,profit)
 on conflict(match_id,user_id) do update set fc_principal=excluded.fc_principal,fc_profit=excluded.fc_profit;
 if commission>0 then
   perform public.rf_domino_credit_admin_v11(commission,'DOMINO_PUNTOS_COMISION','PUNTOS:'||new.id,prize_user);
 end if;
 return new;
end $function$;

create function public.dfc_z37_points_pay_on_exit()
returns trigger language plpgsql security definer set search_path='' as $$
declare payout record; wallet numeric; days integer;
begin
 if tg_op='UPDATE' and (new.state='active' or new.state=old.state) then return new; end if;
 for payout in
   select p.*,c.name room from public.dfc_z37_points_payouts p
   join public.dfc_z37_points_matches m on m.id=p.match_id and m.engine_table_id=old.table_id and m.state='settled'
   join public.dfc_z37_points_configs c on c.id=m.config_id
   where p.user_id=old.user_id and p.paid_at is null
   for update of p
 loop
   if payout.fc_principal>0 then
    update public.rf_profiles set balance=balance+payout.fc_principal,updated_at=now()
     where id=payout.user_id returning balance into strict wallet;
    insert into public.rf_wallet_ledger(user_id,delta,balance_after,movement_type,reference)
     values(payout.user_id,payout.fc_principal,wallet,'DOMINO_PUNTOS_RETORNO_APORTE','PUNTOS:'||payout.match_id);
   end if;
   if payout.fc_profit>0 then
    select expiry_days into days from dfc_private.z32_gift_expiry_config where id=1;
    insert into public.dfc_z31_gift_cards(points_match_id,recipient_id,amount,origin_name,origin_detail,expires_at)
    values(payout.match_id,payout.user_id,payout.fc_profit,'Premio de mesa por puntos',payout.room,
     case when days is not null then now()+make_interval(days=>days) end);
   end if;
   if payout.diamond_principal>0 and not public.dfc_z9_diamond_transfer(null,payout.user_id,payout.diamond_principal,
      'points-diamond-principal:'||payout.match_id,'DOMINO_PUNTOS_RETORNO_APORTE',false,'{}') then
    raise exception 'Aporte de diamantes ya devuelto';
   end if;
   if payout.diamond_profit>0 then
    insert into public.dfc_z37_points_diamond_cards(match_id,user_id,amount,origin)
    values(payout.match_id,payout.user_id,payout.diamond_profit,'Premio · '||payout.room);
   end if;
   update public.dfc_z37_points_payouts set paid_at=clock_timestamp() where match_id=payout.match_id and user_id=payout.user_id;
 end loop;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
create trigger dfc_z37_points_pay_on_exit after delete or update of state on public.rf_domino_seats
for each row execute function public.dfc_z37_points_pay_on_exit();
revoke all on function public.dfc_z37_points_pay_on_exit() from public,anon,authenticated,service_role;

alter table public.dfc_z37_points_configs add column diamond_admin_pct numeric not null default 10 check(diamond_admin_pct between 0 and 50);
update public.dfc_z37_points_configs set diamond_admin_pct=admin_pct;
alter table public.dfc_z37_points_matches add column diamond_admin_pct numeric not null default 10 check(diamond_admin_pct between 0 and 50);
alter table public.dfc_z37_points_payouts add column diamond_principal numeric not null default 0, add column diamond_profit numeric not null default 0;
create table public.dfc_z37_points_diamond_reserves (
 match_id uuid not null references public.dfc_z37_points_matches(id),
 user_id uuid not null references public.rf_profiles(id),
 amount bigint not null check(amount>0),
 debit_key text not null unique,
 state text not null check(state in ('reserved','refunded','settled')),
 primary key(match_id,user_id)
);
create table public.dfc_z37_points_diamond_cards (
 id uuid primary key default gen_random_uuid(),
 match_id uuid not null references public.dfc_z37_points_matches(id),
 user_id uuid not null references public.rf_profiles(id),
 amount numeric not null check(amount>0),
 origin text not null, created_at timestamptz not null default now(), claimed_at timestamptz,
 unique(match_id,user_id)
);
alter table public.dfc_z37_points_diamond_reserves enable row level security;
alter table public.dfc_z37_points_diamond_cards enable row level security;
revoke all on public.dfc_z37_points_diamond_reserves,public.dfc_z37_points_diamond_cards from public,anon,authenticated;

create function public.dfc_z37_points_reserve_diamonds()
returns trigger language plpgsql security definer set search_path='' as $$
declare game public.dfc_z37_points_matches%rowtype; ref text:='points-diamond:'||gen_random_uuid();
begin
 select * into strict game from public.dfc_z37_points_matches where id=new.match_id for update;
 if game.entry_diamonds=0 or not new.charged then return new; end if;
 if game.state<>'waiting' or game.players<>2 then raise exception 'Mesa de diamantes no disponible'; end if;
 insert into public.dfc_z37_points_diamond_reserves values(game.id,new.user_id,game.entry_diamonds,ref,'reserved')
 on conflict(match_id,user_id) do update set amount=excluded.amount,debit_key=excluded.debit_key,state='reserved'
 where dfc_z37_points_diamond_reserves.state='refunded';
 if not found then raise exception 'El aporte de diamantes ya está registrado'; end if;
 if not public.dfc_z9_diamond_transfer(new.user_id,null,game.entry_diamonds,ref,'DOMINO_PUNTOS_APORTE',false,jsonb_build_object('match_id',game.id)) then
  raise exception 'Aporte de diamantes duplicado';
 end if;
 return new;
end $$;

create function public.dfc_z37_points_refund_diamonds(p_match uuid,p_user uuid)
returns void language plpgsql security definer set search_path='' as $$
declare r record;
begin
 for r in update public.dfc_z37_points_diamond_reserves set state='refunded'
  where match_id=p_match and state='reserved' and (p_user is null or user_id=p_user)
  returning user_id,amount,debit_key
 loop
  if not public.dfc_z9_diamond_transfer(null,r.user_id,r.amount,r.debit_key||':refund','DOMINO_PUNTOS_DEVOLUCION',false,'{}') then
    raise exception 'Devolución de diamantes duplicada';
  end if;
 end loop;
end $$;

create function public.dfc_z37_points_process_diamonds()
returns trigger language plpgsql security definer set search_path='' as $$
declare prize_user uuid; contribution numeric; gross numeric; entries int; commission numeric; principal numeric; admin_balance numeric;
begin
 if tg_op='DELETE' then
  if exists(select 1 from public.dfc_z37_points_matches where id=old.match_id and state='waiting' and entry_diamonds>0) then
   perform public.dfc_z37_points_refund_diamonds(old.match_id,old.user_id);
  end if;
  return old;
 end if;
 if new.state=old.state or new.entry_diamonds=0 then return new; end if;
 if new.state='cancelled' then perform public.dfc_z37_points_refund_diamonds(new.id,null); return new; end if;
 if new.state<>'settled' then return new; end if;
 select count(*),sum(amount) into entries,gross from public.dfc_z37_points_diamond_reserves where match_id=new.id and state='reserved';
 if entries<>2 or new.players<>2 or gross<>new.entry_diamonds*new.players then raise exception 'Aportes de diamantes incompletos'; end if;
 select p.user_id,r.amount into strict prize_user,contribution
 from public.dfc_z37_points_participants p join public.dfc_z37_points_diamond_reserves r using(match_id,user_id)
 where p.match_id=new.id and p.team=new.winner_team and r.state='reserved';
 commission:=round(gross*new.diamond_admin_pct/100,3);
 principal:=least(contribution,gross-commission);
 update public.dfc_z37_points_diamond_reserves set state='settled' where match_id=new.id and state='reserved';
 insert into public.dfc_z37_points_payouts(match_id,user_id,diamond_principal,diamond_profit)
 values(new.id,prize_user,principal,gross-commission-principal)
 on conflict(match_id,user_id) do update set diamond_principal=excluded.diamond_principal,diamond_profit=excluded.diamond_profit;
 if commission>0 then
  update public.dfc_z15_admin_diamond_vault set balance=balance+commission,updated_at=clock_timestamp()
  where id=1 returning balance into strict admin_balance;
  insert into public.dfc_z15_admin_diamond_ledger(event_key,delta,balance_after,movement_type,target_id)
  values('points-diamond-admin:'||new.id,commission,admin_balance,'DOMINO_PUNTOS_COMISION',prize_user);
 end if;
 return new;
end $$;
create trigger dfc_z37_reserve_diamonds after insert on public.dfc_z37_points_participants for each row execute function public.dfc_z37_points_reserve_diamonds();
create trigger dfc_z37_refund_diamonds after delete on public.dfc_z37_points_participants for each row execute function public.dfc_z37_points_process_diamonds();
create trigger dfc_z37_close_diamonds after update of state on public.dfc_z37_points_matches for each row execute function public.dfc_z37_points_process_diamonds();
revoke all on function public.dfc_z37_points_reserve_diamonds(),public.dfc_z37_points_refund_diamonds(uuid,uuid),public.dfc_z37_points_process_diamonds() from public,anon,authenticated,service_role;

create function public.dfc_z37_diamond_prizes_pending()
returns table(prize_id uuid,created_on date,amount numeric,origin text)
language sql stable security definer set search_path='' as $$
 select id,(created_at at time zone 'America/Santo_Domingo')::date,amount,origin
 from public.dfc_z37_points_diamond_cards where user_id=auth.uid() and claimed_at is null order by created_at,id;
$$;
create function public.dfc_z37_diamond_prize_redeem(p_prize_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare card public.dfc_z37_points_diamond_cards%rowtype;
begin
 update public.dfc_z37_points_diamond_cards set claimed_at=now()
 where id=p_prize_id and user_id=auth.uid() and claimed_at is null returning * into card;
 if not found then return jsonb_build_object('redeemed',false); end if;
 if not public.dfc_z9_diamond_transfer(null,card.user_id,card.amount,'points-card:'||card.id,'DOMINO_PUNTOS_TARJETA',false,jsonb_build_object('match_id',card.match_id)) then
  raise exception 'Ya se acreditó este premio';
 end if;
 return jsonb_build_object('redeemed',true,'amount',card.amount);
end $$;
revoke all on function public.dfc_z37_diamond_prizes_pending(),public.dfc_z37_diamond_prize_redeem(uuid) from public,anon,authenticated,service_role;
grant execute on function public.dfc_z37_diamond_prizes_pending(),public.dfc_z37_diamond_prize_redeem(uuid) to authenticated;
CREATE OR REPLACE FUNCTION public.dfc_z37_admin_save_points(p_input jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 v_limit=0;
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
      entry_diamonds=v_diamonds,max_negative_diamonds=v_limit,admin_pct=v_pct,diamond_admin_pct=coalesce((p_input->>'diamond_admin_pct')::numeric,diamond_admin_pct),
      enabled=coalesce(v_enabled,enabled),updated_at=now()
  where id=v_id;
  if not found then raise exception 'Mesa por puntos no encontrada'; end if;
 else
  insert into public.dfc_z37_points_configs(name,players,target_points,entry_fc,entry_diamonds,max_negative_diamonds,admin_pct,diamond_admin_pct,enabled)
  values(v_name,v_players,v_target,v_fc,v_diamonds,v_limit,v_pct,coalesce((p_input->>'diamond_admin_pct')::numeric,v_pct),coalesce(v_enabled,false)) returning id into v_id;
 end if;
 return v_id;
end;
$function$
;
