alter table public.dfc_z37_points_matches add column replay_from uuid unique references public.dfc_z37_points_matches(id),
 add column replay_v2 boolean not null default false;
create function dfc_private.enable_points_replay_on_close() returns trigger language plpgsql set search_path='' as $$
begin
 new.replay_v2:=true;
 return new;
end $$;
create trigger dfc_points_enable_replay before update of state on public.dfc_z37_points_matches for each row
when(old.state is distinct from new.state and new.state='settled') execute function dfc_private.enable_points_replay_on_close();
alter table public.dfc_z37_points_payouts add column fc_card_issued boolean not null default false;
alter table public.dfc_z31_gift_cards add column points_full_prize boolean not null default false;
create table dfc_private.points_card_wallet(user_id uuid primary key references auth.users(id), balance numeric(18,3) not null check(balance>=0));

create function public.dfc_points_card_balance() returns numeric language sql stable security definer set search_path='' as $$
 select coalesce((select balance from dfc_private.points_card_wallet where user_id=auth.uid()),0);
$$;
revoke all on function public.dfc_points_card_balance() from public,anon;
grant execute on function public.dfc_points_card_balance() to authenticated;

create function dfc_private.issue_points_fc_card() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.dfc_z31_gift_cards(points_match_id,recipient_id,amount,origin_name,origin_detail,expires_at,points_full_prize)
 select new.id,p.user_id,p.fc_principal+p.fc_profit,'Premio de mesa por puntos',c.name,
 case when e.expiry_days is not null then clock_timestamp()+make_interval(days=>e.expiry_days) end,true
 from public.dfc_z37_points_payouts p
 join public.dfc_z37_points_configs c on c.id=new.config_id
 left join dfc_private.z32_gift_expiry_config e on e.id=1
 where p.match_id=new.id and p.fc_principal+p.fc_profit>0
 and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=p.user_id)
 on conflict do nothing;
 update public.dfc_z37_points_payouts p set fc_card_issued=true where p.match_id=new.id and exists(select 1 from public.dfc_z31_gift_cards g where g.points_match_id=p.match_id and g.recipient_id=p.user_id and g.points_full_prize);
 return new;
end $$;
revoke all on function dfc_private.issue_points_fc_card() from public;
create trigger zy_dfc_points_fc_card after update of state on public.dfc_z37_points_matches for each row
when(old.state is distinct from new.state and new.state='settled') execute function dfc_private.issue_points_fc_card();

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
   if exists(select 1 from public.rf_domino_bot_instances_v18 where user_id=payout.user_id) then
    if payout.fc_principal+payout.fc_profit>0 then perform public.rf_domino_bot_book_v17(payout.fc_principal+payout.fc_profit,'DOMINO_PUNTOS_BOT',payout.user_id,old.table_id); end if;
    if payout.diamond_principal+payout.diamond_profit>0 then perform dfc_private.points_bot_diamonds(payout.diamond_principal+payout.diamond_profit,payout.user_id,'points-bot-prize:'||payout.match_id||':'||payout.user_id); end if;
    update public.dfc_z37_points_payouts set paid_at=clock_timestamp() where match_id=payout.match_id and user_id=payout.user_id;
    continue;
   end if;
   if not payout.fc_card_issued then
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
end $function$
;

CREATE OR REPLACE FUNCTION public.dfc_lab_gift_redeem_v008(p_gift_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_user uuid:=auth.uid(); v_card public.dfc_z31_gift_cards%rowtype;
 v_balance numeric; v_ref text;
begin
 if v_user is null then raise exception 'Debes iniciar sesión'; end if;
 select * into v_card from public.dfc_z31_gift_cards
 where id=p_gift_id and recipient_id=v_user for update;
 if not found then raise exception 'Tarjeta no encontrada'; end if;
 if v_card.redeemed_at is not null then
  return jsonb_build_object('ok',false,'gift_id',v_card.id,'already_redeemed',true);
 end if;
 if v_card.expires_at is not null and v_card.expires_at <= clock_timestamp() then
   update public.dfc_z31_gift_cards
   set expired_at=coalesce(expired_at,clock_timestamp()),
       expired_acknowledged_at=coalesce(expired_acknowledged_at,clock_timestamp())
   where id=v_card.id;
   return jsonb_build_object('ok',false,'gift_id',v_card.id,
    'expired',true,'message','Esta tarjeta FlashCoin ha vencido por caducidad.');
 end if;
 if v_card.points_full_prize then
  insert into dfc_private.points_card_wallet(user_id,balance) values(v_user,v_card.amount)
  on conflict(user_id) do update set balance=points_card_wallet.balance+excluded.balance returning balance into v_balance;
  update public.dfc_z31_gift_cards set redeemed_at=now() where id=v_card.id;
  return jsonb_build_object('ok',true,'gift_id',v_card.id,'amount',v_card.amount,'card_balance',v_balance,'message','Acreditada al saldo de tarjetas FlashCoin');
 end if;
 update public.rf_profiles set balance=balance+v_card.amount,updated_at=now()
 where id=v_user returning balance into v_balance;
 if not found then raise exception 'Perfil inexistente'; end if;
 update public.dfc_z31_gift_cards set redeemed_at=now() where id=v_card.id;
 v_ref:='DFC-Z31-CARD:'||v_card.id::text;
 insert into public.rf_wallet_ledger(user_id,delta,balance_after,movement_type,reference,created_by)
 values(v_user,v_card.amount,v_balance,'REGALO_TARJETA_FLASHCOIN',v_ref,
 (select administrator_id from public.dfc_z31_gift_campaigns where id=v_card.campaign_id));
 return jsonb_build_object('ok',true,'gift_id',v_card.id,'amount',v_card.amount,
 'balance_after',v_balance,'message','Tarjeta FlashCoin acreditada');
end $function$
;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_scoreboard(p_table_id bigint)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select jsonb_build_object(
  'my_prize',(select jsonb_build_object('id',g.id,'amount',g.amount,'redeemed',g.redeemed_at is not null) from public.dfc_z31_gift_cards g where g.points_match_id=m.id and g.recipient_id=auth.uid() and g.points_full_prize),
  'entry_fc',m.entry_fc,'entry_diamonds',m.entry_diamonds,'starts_at',m.starts_at,'match_id',m.id,'target',m.target_points,'state',m.state,'winner_team',m.winner_team,
  'pot_fc',coalesce((select sum(p.fc_principal+p.fc_profit) from public.dfc_z37_points_payouts p where p.match_id=m.id),0),
  'pot_diamonds',coalesce((select sum(p.diamond_principal+p.diamond_profit) from public.dfc_z37_points_payouts p where p.match_id=m.id),0),
  'replay_opens',case when m.state='settled' and (m.replay_v2 or m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') then m.settled_at+interval '3 seconds' end,
  'replay_deadline',case when m.state='settled' and (m.replay_v2 or m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') then m.settled_at+interval '13 seconds' end,
  'server_time',statement_timestamp(),
  'replay_confirmed',exists(select 1 from public.dfc_z37_points_participants p where p.match_id=m.id and p.user_id=auth.uid() and p.replay_confirmed_at is not null),
  'players',coalesce((
    select jsonb_agg(jsonb_build_object('seat',p.seat_number,'team',p.team,
      'points',case when m.players=4 then case p.team when 1 then m.team_a_points else m.team_b_points end else p.points_individual end,'mine',p.user_id=auth.uid(),
      'name',coalesce(nullif(trim(concat_ws(' ',u.first_name,u.last_name)),''),'Jugador '||p.seat_number))
      order by p.seat_number)
    from public.dfc_z37_points_participants p left join public.rf_profiles u on u.id=p.user_id
    where p.match_id=m.id
  ),'[]'::jsonb),
  'last_hand',(
    select jsonb_build_object('id',h.id::text,'points',e.points,'kind',e.event_type,
      'seat',winner.seat_number,'deciding_tile',(
         select mv.tile from public.rf_domino_moves mv where mv.hand_id=h.id and mv.action in ('PLAY','AUTO_PLAY')
         order by mv.id desc limit 1
      ),'remaining',coalesce((
         select jsonb_agg(jsonb_build_object('seat',p.seat_number,'tiles',hp.tiles,
            'points',public.rf_domino_tiles_pips_v11(hp.tiles)) order by p.seat_number)
         from public.rf_domino_hand_players hp
         join public.dfc_z37_points_participants p on p.match_id=m.id and p.user_id=hp.user_id
         where hp.hand_id=h.id
      ),'[]'::jsonb))
    from public.dfc_z37_points_events e join public.rf_domino_hands h on h.id=e.engine_hand_id and h.status='settled'
    join public.dfc_z37_points_participants winner on winner.match_id=m.id and winner.user_id=e.user_id
    where e.match_id=m.id order by h.id desc limit 1
  ))
 from public.dfc_z37_points_matches m
 where m.engine_table_id=p_table_id and m.state in ('waiting','playing','settled')
 and auth.uid() is not null and exists (
   select 1 from public.dfc_z37_points_participants p where p.match_id=m.id and p.user_id=auth.uid()
 );
$function$
;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_join_paid(p_config uuid, p_request uuid, p_fc numeric, p_diamonds bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 uid uuid:=auth.uid();
 cfg public.dfc_z37_points_configs%rowtype;
 game public.dfc_z37_points_matches%rowtype;
 previous_match uuid;
 table_key bigint;
 seat_number smallint;
 seated integer;
begin
 if uid is null or p_request is null then raise exception 'Inicia sesión para sentarte'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,38));
 perform pg_advisory_xact_lock(hashtextextended(p_config::text,37));
 select match_id into previous_match from public.dfc_z37_paid_entry_requests
 where user_id=uid and request_id=p_request;
 select m.* into game from public.dfc_z37_points_matches m
 join public.dfc_z37_points_participants p on p.match_id=m.id and p.user_id=uid
 join public.rf_domino_seats s on s.table_id=m.engine_table_id and s.user_id=uid and s.state='active'
 where m.config_id=p_config and m.state in ('waiting','playing','settled')
 and (previous_match is null or m.id=previous_match)
 order by m.created_at desc limit 1 for update of m;
 if found then
   insert into public.dfc_z37_paid_entry_requests values(uid,p_request,game.id) on conflict do nothing;
   return jsonb_build_object('state',game.state,'table_id',game.engine_table_id);
 end if;
 if previous_match is not null then raise exception 'Esta confirmación ya fue usada. Vuelve a seleccionar la mesa'; end if;
 if exists(select 1 from public.rf_domino_seats where user_id=uid) then
   raise exception 'Sal de tu mesa actual antes de sentarte';
 end if;
 select * into cfg from public.dfc_z37_points_configs where id=p_config and enabled and players between 2 and 4
 and id<>'b3abde40-ea42-4a52-ab24-0ce93c090200' for share;
 if not found then raise exception 'Mesa por puntos no disponible'; end if;
 if cfg.entry_fc is distinct from p_fc or cfg.entry_diamonds is distinct from p_diamonds then
   raise exception 'El aporte cambió. Vuelve a abrir Por puntos para confirmar el importe actual';
 end if;
 PERFORM dfc_private.start_waiting_points_match(cfg.id);
 select * into game from public.dfc_z37_points_matches m where m.config_id=cfg.id and m.state='waiting' and m.replay_from is null
 and m.players=cfg.players and m.target_points=cfg.target_points and m.entry_fc=cfg.entry_fc
 and m.entry_diamonds=cfg.entry_diamonds and m.admin_pct=cfg.admin_pct and m.diamond_admin_pct=cfg.diamond_admin_pct
 order by created_at limit 1 for update;
 if not found then
   insert into public.dfc_z37_points_matches(config_id,players,target_points,entry_fc,entry_diamonds,admin_pct,diamond_admin_pct)
   values(cfg.id,cfg.players,cfg.target_points,cfg.entry_fc,cfg.entry_diamonds,cfg.admin_pct,cfg.diamond_admin_pct)
   returning * into game;
 end if;
 table_key:=public.dfc_z37_prepare_points_table_internal(game.id);
 select n into seat_number from generate_series(1,cfg.players) n where not exists(
   select 1 from public.rf_domino_seats where table_id=table_key and seat_no=n
 ) order by n limit 1;
 if seat_number is null then raise exception 'La mesa está llena'; end if;
 insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready)
 values(table_key,uid,seat_number,0,'active',true);
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged)
 values(game.id,uid,seat_number,1,true);
 insert into public.dfc_z37_paid_entry_requests values(uid,p_request,game.id);
 select count(*) into seated from public.dfc_z37_points_participants where match_id=game.id;
 if seated>=2 then
   update public.dfc_z37_points_matches
   set starts_at=case when seated=cfg.players then clock_timestamp() else coalesce(starts_at,clock_timestamp()+interval '10 seconds') end
   where id=game.id;
   perform dfc_private.start_waiting_points_match(cfg.id);
   select * into strict game from public.dfc_z37_points_matches where id=game.id;
 end if;
 return jsonb_build_object('state',game.state,'table_id',table_key);
end;
$function$;

create function public.dfc_points_replay_confirm(p_match_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare g public.dfc_z37_points_matches%rowtype; n uuid; s public.rf_domino_seats%rowtype; uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Inicia sesión para continuar'; end if;
 select * into g from public.dfc_z37_points_matches where id=p_match_id;
 if not found then raise exception 'Partida no disponible'; end if;
 if g.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' then return public.dfc_z37_trial_replay_confirm(p_match_id); end if;
 perform pg_advisory_xact_lock(hashtextextended(g.config_id::text,37));
 select * into strict g from public.dfc_z37_points_matches where id=p_match_id for update;
 if exists(select 1 from public.dfc_z37_points_participants where match_id=g.id and user_id=uid and replay_confirmed_at is not null) then return true; end if;
 if g.state<>'settled' or not g.replay_v2 or g.engine_table_id is null or g.settled_at is null or clock_timestamp()<g.settled_at+interval '3 seconds'
 or clock_timestamp()>=g.settled_at+interval '13 seconds' or not exists(select 1 from public.dfc_z37_points_configs where id=g.config_id and enabled)
 then raise exception 'La confirmación no está disponible'; end if;
 select * into s from public.rf_domino_seats where table_id=g.engine_table_id and user_id=uid and state='active' for update;
 if not found then raise exception 'Ya no tienes asiento en esta partida'; end if;
 select id into n from public.dfc_z37_points_matches where replay_from=g.id;
 if not found then
  insert into public.dfc_z37_points_matches(config_id,players,target_points,entry_fc,entry_diamonds,admin_pct,diamond_admin_pct,replay_from)
  values(g.config_id,(select players from public.dfc_z37_points_configs where id=g.config_id),g.target_points,g.entry_fc,g.entry_diamonds,g.admin_pct,g.diamond_admin_pct,g.id) returning id into n;
 end if;
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged) values(n,uid,s.seat_no,1,true);
 update public.dfc_z37_points_participants set replay_confirmed_at=clock_timestamp() where match_id=g.id and user_id=uid;
 return true;
end $$;
revoke all on function public.dfc_points_replay_confirm(uuid) from public,anon;
grant execute on function public.dfc_points_replay_confirm(uuid) to authenticated;

create function dfc_private.rotate_paid_points(p_table bigint) returns void language plpgsql security definer set search_path='' as $$
declare g public.dfc_z37_points_matches%rowtype; n uuid; s record; kept int; enabled boolean;
begin
 select * into g from public.dfc_z37_points_matches where engine_table_id=p_table and state='settled';
 if not found or not pg_try_advisory_xact_lock(hashtextextended(g.config_id::text,37)) then return; end if;
 select * into strict g from public.dfc_z37_points_matches where id=g.id for update;
 if g.engine_table_id is distinct from p_table or g.settled_at+interval '13 seconds'>clock_timestamp() then return; end if;
 select c.enabled into enabled from public.dfc_z37_points_configs c where c.id=g.config_id;
 select id into n from public.dfc_z37_points_matches where replay_from=g.id;
 for s in select id,user_id,state,seat_no from public.rf_domino_seats where table_id=p_table order by seat_no for update loop
  if not enabled or s.state<>'active' or not exists(select 1 from public.dfc_z37_points_participants where match_id=n and user_id=s.user_id) then
   perform public.rf_domino_return_seat_v11(s.id,'Salida al terminar Por puntos');
  else
   -- Settle the previous reward before transferring the seat to the next match.
   perform public.rf_domino_return_seat_v11(s.id,'Cierre de partida Por puntos');
   insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready,last_seen_at)
   values(p_table,s.user_id,s.seat_no,0,'active',true,clock_timestamp());
  end if;
 end loop;
 if n is not null then
  delete from public.dfc_z37_points_participants p where p.match_id=n and (not enabled or not exists(
    select 1 from public.rf_domino_seats a where a.table_id=p_table and a.user_id=p.user_id and a.state='active'));
  select count(*) into kept from public.dfc_z37_points_participants where match_id=n;
  if kept=0 then update public.dfc_z37_points_matches set state='cancelled' where id=n;
  else
   update public.dfc_z37_points_matches set engine_table_id=null where id=g.id;
   update public.dfc_z37_points_matches set engine_table_id=p_table,replay_from=null,
    starts_at=case when kept>=2 then clock_timestamp() end where id=n;
   return;
  end if;
 end if;
 update public.dfc_z37_points_matches set engine_table_id=null where id=g.id;
end $$;
revoke all on function dfc_private.rotate_paid_points(bigint) from public;
CREATE OR REPLACE FUNCTION public.dfc_z37_trial_replay_cycle()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare item record;
begin
 for item in select distinct config_id from public.dfc_z37_points_matches
  where state='waiting' and starts_at<=clock_timestamp()
 loop
  begin
   perform dfc_private.start_waiting_points_match(item.config_id);
  exception when others then
   raise warning 'Inicio Por puntos %: %',item.config_id,SQLERRM;
  end;
 end loop;
 for item in select m.engine_table_id as table_id,m.config_id,m.state from public.dfc_z37_points_matches m
  where m.engine_table_id is not null
    and ((m.state='settled' and (m.replay_v2 or m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') and m.settled_at+interval '13 seconds'<=clock_timestamp())
         or m.state='playing')
 loop
   if item.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' then
    perform public.dfc_z37_trial_replay_rotate(item.table_id);
   elsif item.state='settled' then
    begin
     perform dfc_private.rotate_paid_points(item.table_id);
    exception when others then
     raise warning 'Reinicio Por puntos %: %',item.table_id,SQLERRM;
    end;
   end if;
   if exists(select 1 from public.dfc_z37_points_matches m where m.engine_table_id=item.table_id and m.state='playing') then
      perform public.dfc_z37_trial_restore_seats(item.table_id);
      if not exists(select 1 from public.rf_domino_hands h where h.table_id=item.table_id and h.status in ('playing','shuffling')) then
        perform public.rf_domino_try_start_v189(item.table_id);
      else
        perform public.rf_domino_tick_v11(item.table_id);
      end if;
   end if;
 end loop;
end $function$
;
