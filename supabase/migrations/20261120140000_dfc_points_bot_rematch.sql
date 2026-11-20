
create table dfc_private.points_bot_catalog (
 user_id uuid primary key references auth.users(id) on delete cascade,
 config_id uuid not null references public.dfc_z37_points_configs(id)
);
revoke all on table dfc_private.points_bot_catalog from public,anon,authenticated;
CREATE OR REPLACE FUNCTION dfc_private.rotate_paid_points(p_table bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare g public.dfc_z37_points_matches%rowtype; n uuid; s record; kept int; enabled boolean; bot record; next_game public.dfc_z37_points_matches%rowtype;
begin
 select * into g from public.dfc_z37_points_matches where engine_table_id=p_table and state='settled';
 if not found or not pg_try_advisory_xact_lock(hashtextextended(g.config_id::text,37)) then return; end if;
 select * into strict g from public.dfc_z37_points_matches where id=g.id for update;
 if g.engine_table_id is distinct from p_table or g.settled_at+interval '13 seconds'>clock_timestamp() then return; end if;
 select c.enabled into enabled from public.dfc_z37_points_configs c where c.id=g.config_id;
 select id into n from public.dfc_z37_points_matches where replay_from=g.id;

 -- Preserve the configuration when the settled match loses its board.
 insert into dfc_private.points_bot_catalog(user_id,config_id)
 select b.user_id,g.config_id from public.rf_domino_bot_instances_v18 b
 where b.table_id=p_table and b.user_id is not null
 on conflict(user_id) do update set config_id=excluded.config_id;

 if enabled and n is not null
 and exists(select 1 from public.dfc_z37_points_configs where id=g.config_id and bots_allowed)
 and exists(
  select 1 from public.dfc_z37_points_participants p
  join public.rf_domino_seats h on h.table_id=p_table and h.user_id=p.user_id and h.state='active'
  where p.match_id=n and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=p.user_id)
 ) then
  select * into strict next_game from public.dfc_z37_points_matches where id=n;
  select bs.user_id,bs.seat_no into bot
  from public.rf_domino_seats bs
  join public.rf_domino_bot_instances_v18 b on b.user_id=bs.user_id and b.table_id=bs.table_id
  join public.rf_domino_bot_agents_v17 a on a.slot=b.slot and a.enabled
  where bs.table_id=p_table and bs.state='active' and bs.seat_no<=next_game.players
  order by bs.seat_no limit 1;
  if found
   and exists(select 1 from public.rf_domino_bot_fund_v17 f where f.id=1 and f.enabled and f.balance>=next_game.entry_fc)
   and (next_game.entry_diamonds=0 or exists(select 1 from public.dfc_z15_admin_diamond_vault where id=1 and balance>=next_game.entry_diamonds))
  then
   begin
    insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged)
    values(n,bot.user_id,bot.seat_no,1,true)
    on conflict(match_id,user_id) do nothing;
   exception when raise_exception or check_violation then
    raise warning 'El bot no pudo reservar la revancha Por puntos de %: %',p_table,SQLERRM;
   end;
  end if;
 end if;

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
end $function$;
CREATE OR REPLACE FUNCTION dfc_private.seat_points_bot(t bigint)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare g public.dfc_z37_points_matches%rowtype; bot record; seat smallint; seated int;
begin
 select * into g from public.dfc_z37_points_matches where engine_table_id=t;
 if not found or g.state<>'waiting' or not pg_try_advisory_xact_lock(hashtextextended(g.config_id::text,37)) then return 0; end if;
 select * into strict g from public.dfc_z37_points_matches where id=g.id for update;
 if g.state<>'waiting' or not exists(select 1 from public.dfc_z37_points_configs where id=g.config_id and enabled and bots_allowed)
 or not exists(select 1 from public.rf_domino_bot_fund_v17 where id=1 and enabled and balance>=g.entry_fc)
 or (g.entry_diamonds>0 and not exists(select 1 from public.dfc_z15_admin_diamond_vault where id=1 and balance>=g.entry_diamonds))
 or not exists(select 1 from public.rf_domino_seats s where s.table_id=t and s.state='active' and not exists(select 1 from public.rf_domino_bot_instances_v18 where user_id=s.user_id))
 or exists(select 1 from public.rf_domino_seats s where s.table_id=t and exists(select 1 from public.rf_domino_bot_instances_v18 where user_id=s.user_id)) then return 0; end if;
 select i.table_id,i.slot,i.user_id into bot from public.rf_domino_bot_instances_v18 i
 join public.rf_domino_bot_agents_v17 a on a.slot=i.slot and a.enabled

 where i.user_id is not null and (
   exists(select 1 from public.dfc_z37_points_matches m where m.engine_table_id=i.table_id and m.config_id=g.config_id)
   or exists(select 1 from dfc_private.points_bot_catalog x where x.user_id=i.user_id and x.config_id=g.config_id)
 ) and not exists(select 1 from public.rf_domino_seats s where s.user_id=i.user_id)
 and (i.table_id=t or not exists(select 1 from public.rf_domino_bot_instances_v18 x where x.table_id=t and x.slot=i.slot))
 order by (i.table_id=t) desc,i.slot limit 1 for update of i skip locked;
 if not found then return 0; end if;
 select n into seat from generate_series(1,g.players) n where not exists(select 1 from public.rf_domino_seats s where s.table_id=t and s.seat_no=n) order by n limit 1;
 if seat is null then return 0; end if;
 if bot.table_id<>t then update public.rf_domino_bot_instances_v18 set table_id=t where table_id=bot.table_id and slot=bot.slot; end if;
 insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready,last_seen_at) values(t,bot.user_id,seat,0,'active',true,now());
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged) values(g.id,bot.user_id,seat,1,true);
 select count(*) into seated from public.dfc_z37_points_participants where match_id=g.id;
 update public.dfc_z37_points_matches set starts_at=case when seated=g.players then clock_timestamp() else coalesce(starts_at,clock_timestamp()+interval '10 seconds') end where id=g.id;
 perform dfc_private.start_waiting_points_match(g.config_id);
 return 1;
end $function$;
