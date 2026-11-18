
create table public.dfc_z37_points_fc_reserves (
 match_id uuid not null references public.dfc_z37_points_matches(id),
 user_id uuid not null references public.rf_profiles(id),
 amount numeric not null check(amount>0),
 status text not null check(status in ('reserved','refunded','settled')),
 primary key(match_id,user_id)
);
alter table public.dfc_z37_points_fc_reserves enable row level security;
revoke all on public.dfc_z37_points_fc_reserves from public,anon,authenticated;
alter table public.dfc_z31_gift_cards alter column campaign_id drop not null,
 add column points_match_id uuid references public.dfc_z37_points_matches(id),
 add constraint dfc_gift_single_origin check ((campaign_id is null) <> (points_match_id is null)),
 add constraint dfc_gift_one_points_prize unique(points_match_id,recipient_id);

create function public.dfc_z37_points_reserve_fc()
returns trigger language plpgsql security definer set search_path='' as $$
declare game public.dfc_z37_points_matches%rowtype; new_balance numeric;
begin
 select * into strict game from public.dfc_z37_points_matches where id=new.match_id for update;
 if game.entry_fc=0 or not new.charged then return new; end if;
 if game.state<>'waiting' or game.players<>2 then raise exception 'La mesa no admite este aporte'; end if;
 insert into public.dfc_z37_points_fc_reserves(match_id,user_id,amount,status)
 values(game.id,new.user_id,game.entry_fc,'reserved')
 on conflict(match_id,user_id) do update set amount=excluded.amount,status='reserved'
 where dfc_z37_points_fc_reserves.status='refunded';
 if not found then raise exception 'El aporte de esta partida ya está registrado'; end if;
 update public.rf_profiles set balance=balance-game.entry_fc,updated_at=now()
 where id=new.user_id and balance>=game.entry_fc returning balance into new_balance;
 if not found then raise exception 'FlashCoin insuficiente para sentarse'; end if;
 insert into public.rf_wallet_ledger(user_id,delta,balance_after,movement_type,reference)
 values(new.user_id,-game.entry_fc,new_balance,'DOMINO_PUNTOS_APORTE','PUNTOS:'||game.id);
 return new;
end $$;

create function public.dfc_z37_points_release_fc(p_match_id uuid,p_user_id uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare v record; balance_after numeric;
begin
 for v in update public.dfc_z37_points_fc_reserves set status='refunded'
  where match_id=p_match_id and status='reserved' and (p_user_id is null or user_id=p_user_id)
  returning user_id,amount
 loop
  update public.rf_profiles set balance=balance+v.amount,updated_at=now()
  where id=v.user_id returning balance into strict balance_after;
  insert into public.rf_wallet_ledger(user_id,delta,balance_after,movement_type,reference)
  values(v.user_id,v.amount,balance_after,'DOMINO_PUNTOS_DEVOLUCION','PUNTOS:'||p_match_id);
 end loop;
end $$;

create function public.dfc_z37_points_release_waiting_fc()
returns trigger language plpgsql security definer set search_path='' as $$
declare game public.dfc_z37_points_matches%rowtype;
begin
 select * into strict game from public.dfc_z37_points_matches where id=old.match_id for update;
 if game.state='waiting' and game.entry_fc>0 then
  perform public.dfc_z37_points_release_fc(game.id,old.user_id);
 end if;
 return old;
end $$;

create function public.dfc_z37_points_close_fc()
returns trigger language plpgsql security definer set search_path='' as $$
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
 if principal>0 then
  update public.rf_profiles set balance=balance+principal,updated_at=now()
  where id=prize_user returning balance into strict balance_after;
  insert into public.rf_wallet_ledger(user_id,delta,balance_after,movement_type,reference)
  values(prize_user,principal,balance_after,'DOMINO_PUNTOS_RETORNO_APORTE','PUNTOS:'||new.id);
 end if;
 if commission>0 then
  perform public.rf_domino_credit_admin_v11(commission,'DOMINO_PUNTOS_COMISION','PUNTOS:'||new.id,prize_user);
 end if;
 if profit>0 then
  select name into strict room from public.dfc_z37_points_configs where id=new.config_id;
  select expiry_days into days from dfc_private.z32_gift_expiry_config where id=1;
  insert into public.dfc_z31_gift_cards(points_match_id,recipient_id,amount,origin_name,origin_detail,expires_at)
  values(new.id,prize_user,profit,'Premio de mesa por puntos',room,
   case when days is not null then now()+make_interval(days=>days) end);
 end if;
 return new;
end $$;
create trigger dfc_z37_reserve_fc after insert on public.dfc_z37_points_participants
for each row execute function public.dfc_z37_points_reserve_fc();
create trigger dfc_z37_release_waiting_fc after delete on public.dfc_z37_points_participants
for each row execute function public.dfc_z37_points_release_waiting_fc();
create trigger dfc_z37_close_fc after update of state on public.dfc_z37_points_matches
for each row execute function public.dfc_z37_points_close_fc();
revoke all on function public.dfc_z37_points_reserve_fc(),public.dfc_z37_points_release_fc(uuid,uuid),public.dfc_z37_points_release_waiting_fc(),public.dfc_z37_points_close_fc() from public,anon,authenticated,service_role;
