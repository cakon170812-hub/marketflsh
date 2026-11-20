CREATE OR REPLACE FUNCTION public.dfc_z37_points_catalog_terms()
 RETURNS TABLE(id uuid,name text,terms jsonb)
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
   order by exists(select 1 from public.dfc_z37_points_participants p where p.match_id=m.id) desc,
            m.created_at,m.id limit 1
 ) waiting on true
 where c.enabled=true order by c.created_at desc limit 100
$function$;

revoke all on function public.dfc_z37_points_catalog_terms() from public;
grant execute on function public.dfc_z37_points_catalog_terms() to anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.dfc_z37_public_points()
 RETURNS TABLE(id uuid, name text, players smallint, target_points integer, entry_fc numeric, entry_diamonds bigint, admin_pct numeric, pass_fee_fc numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$

 select q.id,q.name,(q.terms->>'players')::smallint,(q.terms->>'target_points')::int,
   (q.terms->>'entry_fc')::numeric,(q.terms->>'entry_diamonds')::bigint,
   (q.terms->>'admin_pct')::numeric,(q.terms->>'pass_fee_fc')::numeric
 from public.dfc_z37_points_catalog_terms() q;
$function$;
CREATE OR REPLACE FUNCTION dfc_private.join_points_at_terms(p_config uuid,p_request uuid,p_terms jsonb,p_table bigint)
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

revoke all on function dfc_private.join_points_at_terms(uuid,uuid,jsonb,bigint) from public,anon,authenticated;

create or replace function dfc_private.join_points_at_board(p_config uuid,p_request uuid,p_fc numeric,p_diamonds bigint,p_pass_fee numeric,p_table bigint)
returns jsonb language sql security definer set search_path='' as $legacy$
 select dfc_private.join_points_at_terms(p_config,p_request,null,p_table);
$legacy$;

create function public.dfc_z37_points_join_terms(p_config uuid,p_request uuid,p_terms jsonb,p_table bigint)
 returns jsonb language plpgsql security definer set search_path='' as $join$
declare cfg public.dfc_z37_points_configs%rowtype; current_terms jsonb; result jsonb;
begin
 if auth.uid() is null then raise exception 'Inicia sesión para sentarte'; end if;
 if p_config='b3abde40-ea42-4a52-ab24-0ce93c090200' then
   perform pg_advisory_xact_lock(hashtextextended(p_config::text,37));
   select * into cfg from public.dfc_z37_points_configs c where c.id=p_config and c.enabled for share;
   if not found then raise exception 'Mesa de prueba fuera de servicio'; end if;
   if p_table is null then
     select q.terms into current_terms from public.dfc_z37_points_catalog_terms() q where q.id=p_config;
   else
     select dfc_private.points_terms(coalesce(m.players,cfg.players),
   coalesce(m.target_points,cfg.target_points),coalesce(m.entry_fc,cfg.entry_fc),coalesce(m.entry_diamonds,cfg.entry_diamonds),
   coalesce(m.admin_pct,cfg.admin_pct),coalesce(m.diamond_admin_pct,cfg.diamond_admin_pct),coalesce(m.pass_fee_fc,cfg.pass_fee_fc)) into current_terms
     from public.dfc_z37_points_matches m where m.config_id=p_config and m.engine_table_id=p_table and m.state='waiting';
   end if;
   if current_terms is null or current_terms is distinct from p_terms then
     raise exception using errcode='DF001',message='Cambiaron las condiciones. Revísalas y confirma de nuevo.';
   end if;
   result:=public.dfc_z37_points_join_engine(p_config,p_request);
 else
   result:=dfc_private.join_points_at_terms(p_config,p_request,p_terms,p_table);
 end if;
 if p_table is not null and (result->>'table_id')::bigint is distinct from p_table then
   raise exception 'Este tablero ya no admite asientos';
 end if;
 return result;
end $join$;
revoke all on function public.dfc_z37_points_join_terms(uuid,uuid,jsonb,bigint) from public,anon;
grant execute on function public.dfc_z37_points_join_terms(uuid,uuid,jsonb,bigint) to authenticated;
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
