CREATE OR REPLACE FUNCTION dfc_private.start_waiting_points_match(p_config uuid, p_table bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE game public.dfc_z37_points_matches%rowtype; seated integer; result jsonb;
BEGIN
 IF NOT pg_try_advisory_xact_lock(hashtextextended(p_config::text,37)) THEN RETURN false; END IF;
 SELECT m.* INTO game FROM public.dfc_z37_points_matches m
 JOIN public.dfc_z37_points_configs c ON c.id=m.config_id AND c.enabled
 WHERE m.config_id=p_config AND m.state='waiting'
   AND m.starts_at<=clock_timestamp() AND m.engine_table_id=p_table
 ORDER BY m.created_at LIMIT 1 FOR UPDATE OF m;
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT count(*) INTO seated FROM public.dfc_z37_points_participants p
 JOIN public.rf_domino_seats s ON s.user_id=p.user_id AND s.table_id=game.engine_table_id AND s.state='active'
 WHERE p.match_id=game.id AND p.charged;
 IF seated<>game.players THEN
  UPDATE public.dfc_z37_points_matches SET starts_at=NULL WHERE id=game.id;
  RETURN false;
 END IF;
 -- Keep the confirmed seats if the previous hand is still being shown.
 BEGIN
 UPDATE public.dfc_z37_points_participants p
 SET team=CASE WHEN seated=4 THEN 1+mod(p.seat_number+1,2) ELSE ranked.position END
 FROM (
  SELECT user_id,row_number() OVER (ORDER BY seat_number) AS position
  FROM public.dfc_z37_points_participants WHERE match_id=game.id
 ) ranked WHERE p.match_id=game.id AND p.user_id=ranked.user_id;
 UPDATE public.dfc_z37_points_matches SET state='playing',players=seated,starts_at=NULL WHERE id=game.id;
 result:=public.rf_domino_try_start_v189(game.engine_table_id);
 IF result->>'status'='celebration_pending' THEN
  RAISE SQLSTATE 'DF003';
 END IF;
 IF NOT coalesce((result->>'started')::boolean,false) THEN
  RAISE EXCEPTION 'No se pudo iniciar la partida: %',result;
 END IF;
 RETURN true;
 EXCEPTION WHEN SQLSTATE 'DF003' THEN
  RETURN false;
 END;
END;
$function$;


CREATE OR REPLACE FUNCTION dfc_private.start_waiting_points_match(p_config uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
 SELECT coalesce((
   SELECT dfc_private.start_waiting_points_match(m.config_id,m.engine_table_id)
   FROM public.dfc_z37_points_matches m
   WHERE m.config_id=p_config AND m.state='waiting' AND m.starts_at<=clock_timestamp()
     AND m.engine_table_id IS NOT NULL
   ORDER BY m.starts_at,m.id LIMIT 1
 ),false);
$function$;

REVOKE EXECUTE ON FUNCTION dfc_private.start_waiting_points_match(uuid,bigint)
FROM PUBLIC, anon, authenticated;



CREATE OR REPLACE FUNCTION dfc_private.points_board_can_join(p_board public.dfc_z37_points_matches)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
 SELECT (SELECT count(*) FROM public.rf_domino_seats s WHERE s.table_id=p_board.engine_table_id)<p_board.players
 OR (p_board.players IN (3,4) AND EXISTS (
  SELECT 1 FROM public.rf_domino_seats s
  JOIN public.rf_domino_bot_instances_v18 b ON b.table_id=s.table_id AND b.user_id=s.user_id
  WHERE s.table_id=p_board.engine_table_id AND s.state='active'
 ));
$function$;

REVOKE EXECUTE ON FUNCTION dfc_private.points_board_can_join(public.dfc_z37_points_matches)
FROM PUBLIC, anon, authenticated;


CREATE OR REPLACE FUNCTION dfc_private.join_points_at_terms(p_config uuid, p_request uuid, p_terms jsonb, p_table bigint)
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
 bot_seat uuid;
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
 select m.* into game from public.dfc_z37_points_matches m
 where m.config_id=cfg.id and dfc_private.points_waiting_board_eligible(m,cfg)
   and dfc_private.points_board_can_join(m)
   and (p_table is null or m.engine_table_id=p_table)
 order by exists(select 1 from public.dfc_z37_points_participants p where p.match_id=m.id) desc,
          m.created_at,m.id
 limit 1 for update;
 if not found and p_table is not null then
   raise exception using errcode='DF002',message='Este tablero cambió o ya no admite asientos. Revisa el catálogo.';
 end if;
 if not found then
   insert into public.dfc_z37_points_matches(config_id,players,target_points,entry_fc,entry_diamonds,admin_pct,diamond_admin_pct)
   values(cfg.id,cfg.players,cfg.target_points,cfg.entry_fc,cfg.entry_diamonds,cfg.admin_pct,cfg.diamond_admin_pct)
   returning * into game;
 end if;
 if dfc_private.points_terms(coalesce(game.players,cfg.players),
   coalesce(game.target_points,cfg.target_points),coalesce(game.entry_fc,cfg.entry_fc),coalesce(game.entry_diamonds,cfg.entry_diamonds),
   coalesce(game.admin_pct,cfg.admin_pct),coalesce(game.diamond_admin_pct,cfg.diamond_admin_pct),coalesce(game.pass_fee_fc,cfg.pass_fee_fc)) is distinct from p_terms then
   raise exception using errcode='DF001',message='Cambiaron las condiciones. Revísalas y confirma de nuevo.';
 end if;
 if game.pass_fee_fc is null then
   update public.dfc_z37_points_matches set pass_fee_fc=cfg.pass_fee_fc where id=game.id;
 end if;
 table_key:=public.dfc_z37_prepare_points_table_internal(game.id);
 select n into seat_number from generate_series(1,game.players) n where not exists(
   select 1 from public.rf_domino_seats where table_id=table_key and seat_no=n
 ) order by n limit 1;
 if seat_number is null and game.players in (3,4) then
   select s.id,s.seat_no into bot_seat,seat_number
   from public.rf_domino_seats s
   join public.rf_domino_bot_instances_v18 b on b.table_id=s.table_id and b.user_id=s.user_id
   where s.table_id=table_key and s.state='active'
   order by s.seat_no desc limit 1 for update of s;
   if found then
     perform public.rf_domino_return_seat_v11(bot_seat,'Prioridad de asiento para jugador en Por puntos');
   end if;
 end if;
 if seat_number is null then raise exception 'La mesa está llena'; end if;
 insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready)
 values(table_key,uid,seat_number,0,'active',true);
 -- A confirmed user's chosen pass fund is transferred exactly once here,
 -- before the point-match participant/reservation triggers can start play.
 if coalesce((select amount from dfc_private.points_join_funds_context
              where transaction_id=txid_current() and user_id=uid),0)<cfg.min_pass_balance_fc then
   raise exception 'Debes reservar por lo menos % FC para pagar pases',cfg.min_pass_balance_fc;
 end if;
 if coalesce((select amount from dfc_private.points_join_funds_context
              where transaction_id=txid_current() and user_id=uid),0)>0 then
   update public.rf_profiles p set balance=p.balance-
      (select amount from dfc_private.points_join_funds_context where transaction_id=txid_current() and user_id=uid),
      updated_at=now()
   where p.id=uid and p.balance >=
      (select amount from dfc_private.points_join_funds_context where transaction_id=txid_current() and user_id=uid);
   if not found then raise exception 'FlashCoin insuficiente para saldo de pases'; end if;
   update public.rf_domino_seats s set table_balance=s.table_balance+
      (select amount from dfc_private.points_join_funds_context where transaction_id=txid_current() and user_id=uid)
   where s.table_id=table_key and s.user_id=uid;
   perform public.rf_add_ledger(uid,
      -(select amount from dfc_private.points_join_funds_context where transaction_id=txid_current() and user_id=uid),
      'DOMINO_PUNTOS_SALDO_PASES','Mesa por puntos '||table_key,uid);
 end if;
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged)
 values(game.id,uid,seat_number,1,true);
 insert into public.dfc_z37_paid_entry_requests values(uid,p_request,game.id);
 select count(*) into seated from public.dfc_z37_points_participants where match_id=game.id;
 if seated>=2 then
   update public.dfc_z37_points_matches
   set starts_at=dfc_private.points_start_time(table_key,game.players,seated,starts_at)
   where id=game.id;
   perform dfc_private.start_waiting_points_match(cfg.id,table_key);
   select * into strict game from public.dfc_z37_points_matches where id=game.id;
 end if;
 return jsonb_build_object('state',game.state,'table_id',table_key);
end;
$function$;

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
 or not exists(
   select 1 from public.rf_domino_seats s
   join public.dfc_z37_points_participants p on p.match_id=g.id and p.user_id=s.user_id and p.charged
   where s.table_id=t and s.state='active'
     and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=s.user_id)
 )
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
 update public.dfc_z37_points_matches set starts_at=dfc_private.points_start_time(t,g.players,seated,starts_at) where id=g.id;
 perform dfc_private.start_waiting_points_match(g.config_id,t);
 return 1;
end $function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_trial_replay_cycle()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare item record;
begin
 for item in select m.config_id,m.engine_table_id from public.dfc_z37_points_matches m
  join public.dfc_z37_points_configs c on c.id=m.config_id and c.enabled
  where m.state='waiting' and m.starts_at<=clock_timestamp() and m.engine_table_id is not null
  order by m.starts_at,m.id
 loop
  begin
   perform dfc_private.start_waiting_points_match(item.config_id,item.engine_table_id);
  exception when others then
   raise warning 'Inicio Por puntos mesa %: %',item.engine_table_id,SQLERRM;
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
end $function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_catalog_terms()
 RETURNS TABLE(id uuid, name text, terms jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select c.id,c.name,dfc_private.points_terms(coalesce(waiting.players,c.players),
   coalesce(waiting.target_points,c.target_points),coalesce(waiting.entry_fc,c.entry_fc),coalesce(waiting.entry_diamonds,c.entry_diamonds),
   coalesce(waiting.admin_pct,c.admin_pct),coalesce(waiting.diamond_admin_pct,c.diamond_admin_pct),coalesce(waiting.pass_fee_fc,c.pass_fee_fc))
 from public.dfc_z37_points_configs c
 left join lateral (
   select m.* from public.dfc_z37_points_matches m
   where m.config_id=c.id and dfc_private.points_waiting_board_eligible(m,c)
     and dfc_private.points_board_can_join(m)
   order by exists(select 1 from public.dfc_z37_points_participants p where p.match_id=m.id) desc,
            m.created_at,m.id limit 1
 ) waiting on true
 where c.enabled=true order by c.created_at desc limit 100
$function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_live_boards()
 RETURNS TABLE(config_id uuid, table_id text, state text, can_join boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select m.config_id,m.engine_table_id::text,m.state,
   dfc_private.points_waiting_board_eligible(m,c) and
   dfc_private.points_board_can_join(m)
 from public.dfc_z37_points_matches m
 join public.dfc_z37_points_configs c on c.id=m.config_id and c.enabled
 where auth.uid() is not null and m.engine_table_id is not null and (m.state='playing' or dfc_private.points_waiting_board_eligible(m,c))
 order by m.created_at desc,m.id desc;
$function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_scoreboard(p_table_id bigint)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select jsonb_build_object(
  'entry_terms',dfc_private.points_terms(coalesce(m.players,c.players),
   coalesce(m.target_points,c.target_points),coalesce(m.entry_fc,c.entry_fc),coalesce(m.entry_diamonds,c.entry_diamonds),
   coalesce(m.admin_pct,c.admin_pct),coalesce(m.diamond_admin_pct,c.diamond_admin_pct),coalesce(m.pass_fee_fc,c.pass_fee_fc)),
  'config_id',m.config_id,'table_name',c.name,'pass_fee_fc',coalesce(m.pass_fee_fc,c.pass_fee_fc),
  'replay_can_confirm',c.enabled and (replay.terms->>'players')::int=m.players,
  'replay_closed_reason',case when not c.enabled then 'disabled' when (replay.terms->>'players')::int<>m.players then 'capacity' end,
  'replay_terms',case when m.state='settled' and viewer.is_participant then replay.terms end,
  'replay_pass_fee_fc',(replay.terms->>'pass_fee_fc')::numeric,
  'can_join',c.enabled and dfc_private.points_waiting_board_eligible(m,c) and
    dfc_private.points_board_can_join(m),
  'my_prize',(select jsonb_build_object('id',g.id,'amount',g.amount,'redeemed',g.redeemed_at is not null) from public.dfc_z31_gift_cards g where g.points_match_id=m.id and g.recipient_id=auth.uid() and g.points_full_prize),
  'capacity',m.players,'entry_fc',m.entry_fc,'entry_diamonds',m.entry_diamonds,'starts_at',m.starts_at,'match_id',m.id,'target',m.target_points,'state',m.state,'winner_team',m.winner_team,
  'replay_seat_released',m.state='settled' and not exists(
     select 1 from public.rf_domino_seats s where s.table_id=m.engine_table_id and s.user_id=auth.uid() and s.state='active'
  ),
  'replay_fc_missing',case when m.state='settled' and (replay.terms->>'entry_fc')::numeric>0
    then greatest(0,(replay.terms->>'entry_fc')::numeric-coalesce((select u.balance from public.rf_profiles u where u.id=auth.uid()),0)) else 0 end,
  'live_pot_fc',coalesce((select sum(r.amount) from public.dfc_z37_points_fc_reserves r where r.match_id=m.id and r.status='reserved'),0),
  'live_pot_diamonds',coalesce((select sum(r.amount) from public.dfc_z37_points_diamond_reserves r where r.match_id=m.id and r.state='reserved'),0),
  'pot_fc',coalesce((select sum(p.fc_principal+p.fc_profit) from public.dfc_z37_points_payouts p where p.match_id=m.id),0),
  'pot_diamonds',coalesce((select sum(p.diamond_principal+p.diamond_profit) from public.dfc_z37_points_payouts p where p.match_id=m.id),0),
  'replay_opens',case when viewer.is_participant and m.state='settled' and (m.replay_v2 or m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') then m.settled_at+interval '3 seconds' end,
  'replay_deadline',case when viewer.is_participant and m.state='settled' and (m.replay_v2 or m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') then m.settled_at+interval '13 seconds' end,
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
  'last_hand',case when viewer.is_participant then (
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
  ) end)
 from public.dfc_z37_points_matches m
 join public.dfc_z37_points_configs c on c.id=m.config_id
 cross join lateral (select exists(select 1 from public.dfc_z37_points_participants p where p.match_id=m.id and p.user_id=auth.uid()) as is_participant) viewer
 cross join lateral (select dfc_private.points_replay_terms(m,c) as terms) replay
 where m.engine_table_id=p_table_id and m.state in ('waiting','playing','settled')
 and auth.uid() is not null and (viewer.is_participant or (c.enabled and m.state in ('waiting','playing','settled')));
$function$;
