-- Correction 08: STAGING/REVIEW ONLY. Do not apply to live games.
-- Entry FC and diamond reserves are handled by existing participant triggers.
-- Fund the separate FC pass wallet from the bot fund in the same transaction.
-- No change to currently seated bots or game rules.
BEGIN;
DO $guard$
BEGIN
  IF md5(pg_get_functiondef('public.dfc_z37_seat_trial_bot(bigint)'::regprocedure)) IS DISTINCT FROM '2ee2957e36c92e1102d8215d0d6656dd' THEN
    RAISE EXCEPTION 'Baseline changed: dfc_z37_seat_trial_bot; review manually';
  END IF;
  IF md5(pg_get_functiondef('dfc_private.seat_points_bot(bigint)'::regprocedure)) IS DISTINCT FROM 'd7c075aa264094edd3462426d38e4bc8' THEN
    RAISE EXCEPTION 'Baseline changed: seat_points_bot; review manually';
  END IF;
END
$guard$;
CREATE OR REPLACE FUNCTION public.dfc_z37_seat_trial_bot(p_table_id bigint)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  game public.dfc_z37_points_matches%rowtype;
  human_seat integer;
  bot_seat integer;
  bot_user uuid;
  started jsonb;
  pass_reserve numeric;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('b3abde40-ea42-4a52-ab24-0ce93c090200',37)) then return 0; end if;
  select * into game from public.dfc_z37_points_matches
  where engine_table_id=p_table_id and config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' and players=2
    and entry_fc=0 and entry_diamonds=0 and admin_pct=0 and state='waiting' for update;
  if not found then return 0; end if;
  if not exists (select 1 from public.dfc_z37_points_configs c where c.id=game.config_id and c.enabled
    and c.players=2 and c.entry_fc=0 and c.entry_diamonds=0 and c.admin_pct=0) then return 0; end if;
  if not exists (
    select 1 from public.rf_domino_bot_tables_v18 t
    join public.rf_domino_bot_targets_v19 g using(table_id)
    where t.table_id=p_table_id and t.enabled and g.target_count>0
  ) or not exists (select 1 from public.rf_domino_bot_fund_v17 where id=1 and enabled) then return 0; end if;
  if (select count(*) from public.rf_domino_seats where table_id=p_table_id)<>1 then return 0; end if;
  select s.seat_no into human_seat from public.rf_domino_seats s
  join public.dfc_z37_points_participants p on p.match_id=game.id and p.user_id=s.user_id
  where s.table_id=p_table_id and s.state='active' and s.is_ready and s.seat_no in (1,2)
    and not exists (select 1 from public.rf_domino_bot_instances_v18 i where i.user_id=s.user_id);
  if human_seat is null then return 0; end if;
  select i.user_id into bot_user from public.rf_domino_bot_instances_v18 i
  join public.rf_domino_bot_agents_v17 a on a.slot=i.slot and a.enabled
  where i.table_id=p_table_id and not exists (select 1 from public.rf_domino_seats s where s.user_id=i.user_id)
  order by i.slot limit 1;
  if bot_user is null then return 0; end if;
  select greatest(coalesce(c.min_pass_balance_fc,0),0) into strict pass_reserve
  from public.dfc_z37_points_configs c where c.id=game.config_id;
  if not exists(select 1 from public.rf_domino_bot_fund_v17 where id=1 and enabled and balance>=pass_reserve)
    then return 0; end if;
  bot_seat:=3-human_seat;
  insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready)
  values(p_table_id,bot_user,bot_seat,pass_reserve,'active',true)
  on conflict do nothing;
  if not found then return 0; end if;
  if pass_reserve>0 then
    perform public.rf_domino_bot_book_v17(-pass_reserve,'DOMINO_PUNTOS_BOT_SALDO_PASES',bot_user,p_table_id);
  end if;
  insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged)
  values(game.id,bot_user,bot_seat,bot_seat,true);
  update public.dfc_z37_points_matches set state='playing' where id=game.id;
  started:=public.rf_domino_try_start_v189(p_table_id);
  if not coalesce((started->>'started')::boolean,false) then
    raise exception 'El motor no inició la prueba con bot: %',started;
  end if;
  return 1;
end $function$;

CREATE OR REPLACE FUNCTION dfc_private.seat_points_bot(t bigint)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare g public.dfc_z37_points_matches%rowtype; bot record; seat smallint; seated int; target int; inserted int:=0; bots int; humans int; pass_reserve numeric;
begin
 select * into g from public.dfc_z37_points_matches where engine_table_id=t;
 if not found or g.state<>'waiting' or not pg_try_advisory_xact_lock(hashtextextended(g.config_id::text,37)) then return 0; end if;
 select * into strict g from public.dfc_z37_points_matches where id=g.id for update;
 if g.state<>'waiting' or not exists(select 1 from public.dfc_z37_points_configs where id=g.config_id and enabled and bots_allowed)
 then return 0; end if;
 select greatest(coalesce(c.min_pass_balance_fc,0),0) into strict pass_reserve
 from public.dfc_z37_points_configs c where c.id=g.config_id;
 select count(*) into humans from public.rf_domino_seats s
 where s.table_id=t and s.state='active'
 and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=s.user_id);
 if humans=0 then return 0; end if;
 -- A board-specific setting wins. Reuse the last explicit setting when the
 -- lobby replaces its board, with the same cap used by the shared engine.
 select coalesce(
   (select target_count from public.rf_domino_bot_targets_v19 where table_id=t),
   (select tg.target_count from public.rf_domino_bot_targets_v19 tg
    join public.dfc_z37_points_matches m on m.engine_table_id=tg.table_id
    where m.config_id=g.config_id order by tg.updated_at desc,tg.table_id desc limit 1),
   3) into target;
 select count(*) into bots from public.rf_domino_seats s
 join public.rf_domino_bot_instances_v18 i on i.table_id=s.table_id and i.user_id=s.user_id
 where s.table_id=t;
 while bots<least(greatest(target,0),3,greatest(g.players-humans,0)) loop
 exit when not exists(select 1 from public.rf_domino_bot_fund_v17 where id=1 and enabled and balance>=g.entry_fc+pass_reserve)
 or (g.entry_diamonds>0 and not exists(select 1 from public.dfc_z15_admin_diamond_vault where id=1 and balance>=g.entry_diamonds));
 select i.table_id,i.slot,i.user_id into bot from public.rf_domino_bot_instances_v18 i
 join public.rf_domino_bot_agents_v17 a on a.slot=i.slot and a.enabled

 where i.user_id is not null and (
   exists(select 1 from public.dfc_z37_points_matches m where m.engine_table_id=i.table_id and m.config_id=g.config_id)
   or exists(select 1 from dfc_private.points_bot_catalog x where x.user_id=i.user_id and x.config_id=g.config_id)
 ) and not exists(select 1 from public.rf_domino_seats s where s.user_id=i.user_id)
 and (i.table_id=t or not exists(select 1 from public.rf_domino_bot_instances_v18 x where x.table_id=t and x.slot=i.slot))
 order by (i.table_id=t) desc,i.slot limit 1 for update of i skip locked;
 exit when not found;
 select n into seat from generate_series(1,g.players) n where not exists(select 1 from public.rf_domino_seats s where s.table_id=t and s.seat_no=n) order by n limit 1;
 exit when seat is null;
 if bot.table_id<>t then update public.rf_domino_bot_instances_v18 set table_id=t where table_id=bot.table_id and slot=bot.slot; end if;
 -- The existing participant triggers reserve the prize contribution separately.
 if pass_reserve>0 then
   perform public.rf_domino_bot_book_v17(-pass_reserve,'DOMINO_PUNTOS_BOT_SALDO_PASES',bot.user_id,t);
 end if;
 insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready,last_seen_at)
 values(t,bot.user_id,seat,pass_reserve,'active',true,now());
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged) values(g.id,bot.user_id,seat,1,true);
 bots:=bots+1;
 inserted:=inserted+1;
 end loop;
 if inserted>0 then
   select count(*) into seated from public.dfc_z37_points_participants p
   join public.rf_domino_seats s on s.table_id=t and s.user_id=p.user_id and s.state='active'
   where p.match_id=g.id and p.charged;
   update public.dfc_z37_points_matches
   set starts_at=dfc_private.points_start_time(t,g.players,seated,starts_at)
   where id=g.id;
 end if;
 perform dfc_private.start_waiting_points_match(g.config_id,t);
 return inserted;
end $function$;
COMMIT;
-- Before deployment: test funded/underfunded bots, both modalities,
-- human replacing waiting bot, rollback on participant reserve failure,
-- returning residual FC including negative balances, simultaneous join,
-- no bots-only new points game, and cron/lock order in isolated staging.
-- Existing playing bots must finish normally; do not top up mid-game.
