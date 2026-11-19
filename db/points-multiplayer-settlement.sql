-- Staged payout changes. Deploy together with multiplayer admission and scoring.
BEGIN;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_close_fc()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 prize_user uuid; entries integer; gross numeric; commission numeric; principal numeric;
winners integer; winner record; net numeric; share numeric; payment numeric;
begin
 if new.state=old.state or new.entry_fc=0 then return new; end if;
 if new.state='cancelled' then
  perform public.dfc_z37_points_release_fc(new.id);
  return new;
 end if;
 if new.state<>'settled' then return new; end if;
 select count(*),sum(r.amount) into entries,gross from public.dfc_z37_points_fc_reserves r
 where r.match_id=new.id and r.status='reserved';
 if entries<>new.players or gross<>new.entry_fc*new.players then
  raise exception 'Aportes de FlashCoin de la partida incompletos';
 end if;
 select count(*) into winners
 from public.dfc_z37_points_participants p
 join public.dfc_z37_points_fc_reserves r using(match_id,user_id)
 where p.match_id=new.id and p.team=new.winner_team and r.status='reserved';
 if winners<>(case when new.players=4 then 2 else 1 end) then
  raise exception 'La cantidad de ganadores no coincide con los puestos de la partida';
 end if;
 commission:=round(gross*new.admin_pct/100,3);
 net:=gross-commission;
 share:=trunc(net/winners,3);
 for winner in
  select p.user_id,r.amount
  from public.dfc_z37_points_participants p
  join public.dfc_z37_points_fc_reserves r using(match_id,user_id)
  where p.match_id=new.id and p.team=new.winner_team and r.status='reserved'
  order by p.seat_number
 loop
  prize_user:=coalesce(prize_user,winner.user_id);
  payment:=share;
  if winner.user_id=prize_user then payment:=payment+net-share*winners; end if;
  principal:=least(winner.amount,payment);
  insert into public.dfc_z37_points_payouts(match_id,user_id,fc_principal,fc_profit)
  values(new.id,winner.user_id,principal,payment-principal)
  on conflict(match_id,user_id) do update
   set fc_principal=excluded.fc_principal,fc_profit=excluded.fc_profit;
 end loop;
 update public.dfc_z37_points_fc_reserves set status='settled' where match_id=new.id and status='reserved';
 if commission>0 then
   perform public.rf_domino_credit_admin_v11(commission,'DOMINO_PUNTOS_COMISION','PUNTOS:'||new.id,prize_user);
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_process_diamonds()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare prize_user uuid; gross numeric; entries int; commission numeric; principal numeric; admin_balance numeric;
winners integer; winner record; net numeric; share numeric; payment numeric;
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
 if entries<>new.players or gross<>new.entry_diamonds*new.players then
  raise exception 'Aportes de diamantes de la partida incompletos';
 end if;
 select count(*) into winners
 from public.dfc_z37_points_participants p
 join public.dfc_z37_points_diamond_reserves r using(match_id,user_id)
 where p.match_id=new.id and p.team=new.winner_team and r.state='reserved';
 if winners<>(case when new.players=4 then 2 else 1 end) then
  raise exception 'La cantidad de ganadores no coincide con los puestos de la partida';
 end if;
 commission:=round(gross*new.diamond_admin_pct/100,3);
 net:=gross-commission;
 share:=trunc(net/winners,3);
 for winner in
  select p.user_id,r.amount
  from public.dfc_z37_points_participants p
  join public.dfc_z37_points_diamond_reserves r using(match_id,user_id)
  where p.match_id=new.id and p.team=new.winner_team and r.state='reserved'
  order by p.seat_number
 loop
  prize_user:=coalesce(prize_user,winner.user_id);
  payment:=share;
  if winner.user_id=prize_user then payment:=payment+net-share*winners; end if;
  principal:=least(winner.amount,payment);
  insert into public.dfc_z37_points_payouts(match_id,user_id,diamond_principal,diamond_profit)
  values(new.id,winner.user_id,principal,payment-principal)
  on conflict(match_id,user_id) do update
   set diamond_principal=excluded.diamond_principal,diamond_profit=excluded.diamond_profit;
 end loop;
 update public.dfc_z37_points_diamond_reserves set state='settled' where match_id=new.id and state='reserved';
 if commission>0 then
  update public.dfc_z15_admin_diamond_vault set balance=balance+commission,updated_at=clock_timestamp()
  where id=1 returning balance into strict admin_balance;
  insert into public.dfc_z15_admin_diamond_ledger(event_key,delta,balance_after,movement_type,target_id)
  values('points-diamond-admin:'||new.id,commission,admin_balance,'DOMINO_PUNTOS_COMISION',prize_user);
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_pay_on_exit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      'points-diamond-principal:'||payout.match_id||':'||payout.user_id,'DOMINO_PUNTOS_RETORNO_APORTE',false,'{}') then
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
end $function$;

COMMIT;
