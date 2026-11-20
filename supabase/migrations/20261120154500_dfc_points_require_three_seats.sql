CREATE OR REPLACE FUNCTION dfc_private.points_start_time(p_table bigint, p_capacity integer, p_seated integer, p_previous timestamp with time zone)
 RETURNS timestamp with time zone
 LANGUAGE sql
 SET search_path TO ''
AS $function$
 select case
  when p_capacity in (3,4) and p_seated<p_capacity then null
  when p_capacity in (3,4) and exists(
    select 1 from public.rf_domino_seats s
    join public.rf_domino_bot_instances_v18 b on b.table_id=s.table_id and b.user_id=s.user_id
    where s.table_id=p_table and s.state='active'
  ) then clock_timestamp()+interval '10 seconds'
  when p_seated>=p_capacity then clock_timestamp()
  when p_seated>=2 then coalesce(p_previous,clock_timestamp()+interval '10 seconds')
 end;
$function$;

CREATE OR REPLACE FUNCTION dfc_private.start_waiting_points_match(p_config uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE game public.dfc_z37_points_matches%rowtype; seated integer; result jsonb;
BEGIN
 IF NOT pg_try_advisory_xact_lock(hashtextextended(p_config::text,37)) THEN RETURN false; END IF;
 IF EXISTS (SELECT 1 FROM public.dfc_z37_points_matches
  WHERE config_id=p_config AND state IN ('playing','settlement_pending')) THEN RETURN false; END IF;
 SELECT m.* INTO game FROM public.dfc_z37_points_matches m
 JOIN public.dfc_z37_points_configs c ON c.id=m.config_id AND c.enabled
 WHERE m.config_id=p_config AND m.state='waiting'
   AND m.starts_at<=clock_timestamp() AND m.engine_table_id IS NOT NULL
 ORDER BY m.created_at LIMIT 1 FOR UPDATE OF m;
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT count(*) INTO seated FROM public.dfc_z37_points_participants p
 JOIN public.rf_domino_seats s ON s.user_id=p.user_id AND s.table_id=game.engine_table_id AND s.state='active'
 WHERE p.match_id=game.id;
 IF seated<2 OR (game.players in (3,4) AND seated<>game.players) THEN
  UPDATE public.dfc_z37_points_matches SET starts_at=NULL WHERE id=game.id;
  RETURN false;
 END IF;
 UPDATE public.dfc_z37_points_participants p
 SET team=CASE WHEN seated=4 THEN 1+mod(p.seat_number+1,2) ELSE ranked.position END
 FROM (
  SELECT user_id,row_number() OVER (ORDER BY seat_number) AS position
  FROM public.dfc_z37_points_participants WHERE match_id=game.id
 ) ranked WHERE p.match_id=game.id AND p.user_id=ranked.user_id;
 UPDATE public.dfc_z37_points_matches SET state='playing',players=seated,starts_at=NULL WHERE id=game.id;
 result:=public.rf_domino_try_start_v189(game.engine_table_id);
 IF NOT coalesce((result->>'started')::boolean,false) THEN
  RAISE EXCEPTION 'No se pudo iniciar la partida: %',result;
 END IF;
 RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION dfc_private.join_points_at_board(p_config uuid, p_request uuid, p_fc numeric, p_diamonds bigint, p_pass_fee numeric, p_table bigint)
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
 if cfg.players=2 and p_table is null then perform dfc_private.start_waiting_points_match(cfg.id); end if;
 select m.* into game from public.dfc_z37_points_matches m
 where m.config_id=cfg.id and dfc_private.points_waiting_board_eligible(m,cfg)
   and (p_table is null or m.engine_table_id=p_table)
 order by exists(select 1 from public.dfc_z37_points_participants p where p.match_id=m.id) desc,
          m.created_at,m.id
 limit 1 for update;
 if not found and p_table is not null then
   raise exception 'Este tablero ya no admite asientos';
 end if;
 if not found then
   insert into public.dfc_z37_points_matches(config_id,players,target_points,entry_fc,entry_diamonds,admin_pct,diamond_admin_pct)
   values(cfg.id,cfg.players,cfg.target_points,cfg.entry_fc,cfg.entry_diamonds,cfg.admin_pct,cfg.diamond_admin_pct)
   returning * into game;
 end if;
 if game.entry_fc is distinct from p_fc or game.entry_diamonds is distinct from p_diamonds then
   raise exception 'El aporte cambió. Vuelve a abrir Por puntos para confirmar el importe actual';
 end if;
 if coalesce(game.pass_fee_fc,cfg.pass_fee_fc) is distinct from p_pass_fee then
   raise exception using errcode='DF001',message='Cambió el precio por pase. Revisa la tarifa antes de confirmar.';
 end if;
 if game.pass_fee_fc is null then
   update public.dfc_z37_points_matches set pass_fee_fc=p_pass_fee where id=game.id;
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
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged)
 values(game.id,uid,seat_number,1,true);
 insert into public.dfc_z37_paid_entry_requests values(uid,p_request,game.id);
 select count(*) into seated from public.dfc_z37_points_participants where match_id=game.id;
 if seated>=2 then
   update public.dfc_z37_points_matches
   set starts_at=dfc_private.points_start_time(table_key,game.players,seated,starts_at)
   where id=game.id;
   perform dfc_private.start_waiting_points_match(cfg.id);
   select * into strict game from public.dfc_z37_points_matches where id=game.id;
 end if;
 return jsonb_build_object('state',game.state,'table_id',table_key);
end;
$function$;

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
    starts_at=case when next_game.players in (3,4) then dfc_private.points_start_time(p_table,next_game.players,kept,null)
                   when kept>=2 then clock_timestamp() end where id=n;
   return;
  end if;
 end if;
 update public.dfc_z37_points_matches set engine_table_id=null where id=g.id;
end $function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_live_boards()
 RETURNS TABLE(config_id uuid, table_id text, state text, can_join boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select m.config_id,m.engine_table_id::text,m.state,
   dfc_private.points_waiting_board_eligible(m,c) and
   ((select count(*) from public.rf_domino_seats s where s.table_id=m.engine_table_id)<m.players
    or (m.players in (3,4) and exists(
      select 1 from public.rf_domino_seats s
      join public.rf_domino_bot_instances_v18 b on b.table_id=s.table_id and b.user_id=s.user_id
      where s.table_id=m.engine_table_id and s.state='active'
    )))
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
  'config_id',m.config_id,'table_name',c.name,'pass_fee_fc',coalesce(m.pass_fee_fc,c.pass_fee_fc),
  'replay_can_confirm',c.enabled,
  'replay_pass_fee_fc',coalesce((select next_game.pass_fee_fc from public.dfc_z37_points_matches next_game where next_game.replay_from=m.id),c.pass_fee_fc),
  'can_join',c.enabled and dfc_private.points_waiting_board_eligible(m,c) and
    ((select count(*) from public.rf_domino_seats s where s.table_id=m.engine_table_id)<m.players
    or (m.players in (3,4) and exists(
      select 1 from public.rf_domino_seats s
      join public.rf_domino_bot_instances_v18 b on b.table_id=s.table_id and b.user_id=s.user_id
      where s.table_id=m.engine_table_id and s.state='active'
    ))),
  'my_prize',(select jsonb_build_object('id',g.id,'amount',g.amount,'redeemed',g.redeemed_at is not null) from public.dfc_z31_gift_cards g where g.points_match_id=m.id and g.recipient_id=auth.uid() and g.points_full_prize),
  'capacity',m.players,'entry_fc',m.entry_fc,'entry_diamonds',m.entry_diamonds,'starts_at',m.starts_at,'match_id',m.id,'target',m.target_points,'state',m.state,'winner_team',m.winner_team,
  'replay_seat_released',m.state='settled' and not exists(
     select 1 from public.rf_domino_seats s where s.table_id=m.engine_table_id and s.user_id=auth.uid() and s.state='active'
  ),
  'replay_fc_missing',case when m.state='settled' and m.entry_fc>0
    then greatest(0,m.entry_fc-coalesce((select u.balance from public.rf_profiles u where u.id=auth.uid()),0)) else 0 end,
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
 where m.engine_table_id=p_table_id and m.state in ('waiting','playing','settled')
 and auth.uid() is not null and (viewer.is_participant or (c.enabled and m.state in ('waiting','playing','settled')));
$function$;
