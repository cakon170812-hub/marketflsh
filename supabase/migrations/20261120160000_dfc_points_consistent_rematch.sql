
create function dfc_private.points_terms(p_players int,p_target int,p_fc numeric,p_diamonds bigint,p_admin numeric,p_diamond_admin numeric,p_pass numeric)
returns jsonb language sql immutable set search_path='' as $terms$
 select jsonb_build_object('players',p_players,'target_points',p_target,'entry_fc',p_fc,'entry_diamonds',p_diamonds,
   'admin_pct',p_admin,'diamond_admin_pct',p_diamond_admin,'pass_fee_fc',p_pass);
$terms$;
create function dfc_private.points_replay_terms(game public.dfc_z37_points_matches,cfg public.dfc_z37_points_configs)
returns jsonb language sql stable set search_path='' as $terms$
 select case when game.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200'
   then dfc_private.points_terms(game.players,game.target_points,game.entry_fc,game.entry_diamonds,game.admin_pct,game.diamond_admin_pct,0)
   else coalesce((
     select dfc_private.points_terms(n.players,n.target_points,n.entry_fc,n.entry_diamonds,n.admin_pct,n.diamond_admin_pct,n.pass_fee_fc)
     from public.dfc_z37_points_matches n where n.replay_from=game.id
   ),dfc_private.points_terms(cfg.players,cfg.target_points,cfg.entry_fc,cfg.entry_diamonds,cfg.admin_pct,cfg.diamond_admin_pct,cfg.pass_fee_fc))
 end;
$terms$;
create function dfc_private.points_legacy_replay_terms(p_match uuid,p_pass numeric)
returns jsonb language sql stable set search_path='' as $terms$
 select dfc_private.points_terms(g.players,g.target_points,g.entry_fc,g.entry_diamonds,g.admin_pct,g.diamond_admin_pct,p_pass)
 from public.dfc_z37_points_matches g where g.id=p_match;
$terms$;
revoke all on function dfc_private.points_terms(int,int,numeric,bigint,numeric,numeric,numeric),
 dfc_private.points_replay_terms(public.dfc_z37_points_matches,public.dfc_z37_points_configs),
 dfc_private.points_legacy_replay_terms(uuid,numeric) from public,anon,authenticated;
CREATE OR REPLACE FUNCTION dfc_private.confirm_points_replay_at_terms(p_match_id uuid,p_terms jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare g public.dfc_z37_points_matches%rowtype; n uuid; quoted_terms jsonb; cfg public.dfc_z37_points_configs%rowtype; s public.rf_domino_seats%rowtype; uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Inicia sesión para continuar'; end if;
 select * into g from public.dfc_z37_points_matches where id=p_match_id;
 if not found then raise exception 'Partida no disponible'; end if;
 perform pg_advisory_xact_lock(hashtextextended(g.config_id::text,37));
 select * into strict g from public.dfc_z37_points_matches where id=p_match_id for update;
 if exists(select 1 from public.dfc_z37_points_participants where match_id=g.id and user_id=uid and replay_confirmed_at is not null) then return true; end if;
 if g.state<>'settled' or (not g.replay_v2 and g.config_id<>'b3abde40-ea42-4a52-ab24-0ce93c090200') or g.engine_table_id is null or g.settled_at is null or clock_timestamp()<g.settled_at+interval '3 seconds'
 or clock_timestamp()>=g.settled_at+interval '13 seconds' or not exists(select 1 from public.dfc_z37_points_configs where id=g.config_id and enabled)
 then raise exception 'La confirmación no está disponible'; end if;
 select * into s from public.rf_domino_seats where table_id=g.engine_table_id and user_id=uid and state='active' for update;
 if not found then raise exception 'Ya no tienes asiento en esta partida'; end if;
 select * into strict cfg from public.dfc_z37_points_configs where id=g.config_id and enabled for share;
 quoted_terms:=dfc_private.points_replay_terms(g,cfg);
 if (quoted_terms->>'players')::int<>g.players then
  raise exception 'Cambió el cupo de la mesa. Elige la nueva modalidad en Mesas por puntos.';
 end if;
 if quoted_terms is distinct from p_terms then
  raise exception using errcode='DF001',message='Cambiaron las condiciones. Revísalas y confirma de nuevo.';
 end if;
 if g.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' then
  return public.dfc_z37_trial_replay_confirm(p_match_id);
 end if;
 select id into n from public.dfc_z37_points_matches where replay_from=g.id;
 if n is null then
  insert into public.dfc_z37_points_matches(config_id,players,target_points,entry_fc,entry_diamonds,admin_pct,diamond_admin_pct,replay_from,pass_fee_fc)
  values(g.config_id,cfg.players,cfg.target_points,cfg.entry_fc,cfg.entry_diamonds,cfg.admin_pct,cfg.diamond_admin_pct,g.id,cfg.pass_fee_fc) returning id into n;
 end if;
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged) values(n,uid,s.seat_no,1,true);
 update public.dfc_z37_points_participants set replay_confirmed_at=clock_timestamp() where match_id=g.id and user_id=uid;
 return true;
end $function$;

revoke all on function dfc_private.confirm_points_replay_at_terms(uuid,jsonb) from public,anon,authenticated;
create or replace function dfc_private.confirm_points_replay_at_price(p_match_id uuid,p_pass_fee numeric)
returns boolean language sql security definer set search_path='' as $legacy$
 select dfc_private.confirm_points_replay_at_terms(p_match_id,dfc_private.points_legacy_replay_terms(p_match_id,p_pass_fee));
$legacy$;
CREATE OR REPLACE FUNCTION public.dfc_points_replay_choice_terms(p_match_id uuid,p_choice text,p_terms jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 uid uuid:=auth.uid();
 game public.dfc_z37_points_matches%rowtype;
 seat_id uuid;
 missing numeric:=0;
 current_terms jsonb;
 cfg public.dfc_z37_points_configs%rowtype;
begin
 if uid is null or p_choice is null or p_choice not in ('confirm','exit','check','timeout') then
  raise exception 'Selección de revancha inválida';
 end if;
 select * into game from public.dfc_z37_points_matches where id=p_match_id;
 if not found then raise exception 'Partida no disponible'; end if;
 perform pg_advisory_xact_lock(hashtextextended(game.config_id::text,37));
 select * into strict game from public.dfc_z37_points_matches where id=p_match_id for update;
 if game.state<>'settled' or not exists(
   select 1 from public.dfc_z37_points_participants where match_id=game.id and user_id=uid
 ) then raise exception 'La revancha no está disponible'; end if;

 if exists(select 1 from public.dfc_z37_points_participants where match_id=game.id and user_id=uid and replay_confirmed_at is not null) then
  return jsonb_build_object('state','confirmed');
 end if;
 select id into seat_id from public.rf_domino_seats
 where table_id=game.engine_table_id and user_id=uid and state='active' for update;
 if not found then return jsonb_build_object('state','left'); end if;

 if p_choice in ('confirm','check') then
  select * into strict cfg from public.dfc_z37_points_configs where id=game.config_id for share;
  current_terms:=dfc_private.points_replay_terms(game,cfg);
  if not cfg.enabled or (current_terms->>'players')::int<>game.players then
   if p_choice='confirm' then raise exception 'La revancha está cerrada. Regresa a Mesas por puntos.'; end if;
   return jsonb_build_object('state','pending');
  end if;
  if current_terms is distinct from p_terms then
   if p_choice='confirm' then
    raise exception using errcode='DF001',message='Cambiaron las condiciones. Revísalas y confirma de nuevo.';
   end if;
   return jsonb_build_object('state','pending');
  end if;
  if (current_terms->>'entry_fc')::numeric>0 then
   select greatest(0,(current_terms->>'entry_fc')::numeric-coalesce(balance,0)) into strict missing
   from public.rf_profiles where id=uid for update;
  end if;
 end if;
 if missing>0 or p_choice='exit' or (p_choice='timeout' and clock_timestamp()>=game.settled_at+interval '13 seconds') then
  perform public.rf_domino_return_seat_v11(seat_id,'Salida de la revancha Por puntos');
  return jsonb_build_object('state','left','missing_fc',missing);
 end if;
 if p_choice='confirm' then
  perform dfc_private.confirm_points_replay_at_terms(game.id,p_terms);
  return jsonb_build_object('state','confirmed');
 end if;
 return jsonb_build_object('state','pending');
end $function$;

revoke all on function public.dfc_points_replay_choice_terms(uuid,text,jsonb) from public,anon;
grant execute on function public.dfc_points_replay_choice_terms(uuid,text,jsonb) to authenticated;
create or replace function public.dfc_points_replay_choice_priced(p_match_id uuid,p_choice text,p_pass_fee numeric)
returns jsonb language sql security definer set search_path='' as $legacy$
 select public.dfc_points_replay_choice_terms(p_match_id,p_choice,dfc_private.points_legacy_replay_terms(p_match_id,p_pass_fee));
$legacy$;
CREATE OR REPLACE FUNCTION public.dfc_z37_points_scoreboard(p_table_id bigint)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select jsonb_build_object(
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
