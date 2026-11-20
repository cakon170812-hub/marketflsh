CREATE OR REPLACE FUNCTION public.dfc_z37_admin_save_points(p_input jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_enabled boolean;
 v_pass_fee numeric:=(p_input->>'pass_fee_fc')::numeric;
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
    (v_pass_fee is not null and (v_pass_fee<0 or v_pass_fee>999999 or round(v_pass_fee,3)<>v_pass_fee)) or
    v_fc<0 or v_diamonds<0 or v_limit<0 or v_pct not between 0 and 50 then
    raise exception 'Configuración inválida';
 end if;
 if p_input ? 'id' and p_input->>'id' is not null then
  v_id=(p_input->>'id')::uuid;
  -- Serialize visibility changes with seating, bot admission and rematch rotation.
  IF v_enabled IS FALSE THEN
   perform pg_advisory_xact_lock(hashtextextended(v_id::text,37));
   if exists(
     select 1 from public.dfc_z37_points_matches m
     join public.dfc_z37_points_participants p on p.match_id=m.id
     join public.dfc_z37_points_configs c on c.id=m.config_id and c.enabled
     where m.config_id=v_id and m.state='waiting' and m.replay_from is null
   ) then
     raise exception 'Hay jugadores esperando. La mesa seguirá visible hasta que comience la partida o se desocupe.';
   end if;
  END IF;
  update public.dfc_z37_points_configs
  set pass_fee_fc=coalesce(v_pass_fee,pass_fee_fc),bots_allowed=coalesce((p_input->>'bots_allowed')::boolean,bots_allowed),name=v_name,players=v_players,target_points=v_target,entry_fc=v_fc,
      entry_diamonds=v_diamonds,max_negative_diamonds=v_limit,admin_pct=v_pct,diamond_admin_pct=coalesce((p_input->>'diamond_admin_pct')::numeric,diamond_admin_pct),
      enabled=coalesce(v_enabled,enabled),updated_at=now()
  where id=v_id and archived_at is null;
  if not found then raise exception 'Mesa por puntos no encontrada'; end if;
 else
  insert into public.dfc_z37_points_configs(pass_fee_fc,bots_allowed,name,players,target_points,entry_fc,entry_diamonds,max_negative_diamonds,admin_pct,diamond_admin_pct,enabled)
  values(coalesce(v_pass_fee,0),coalesce((p_input->>'bots_allowed')::boolean,false),v_name,v_players,v_target,v_fc,v_diamonds,v_limit,v_pct,coalesce((p_input->>'diamond_admin_pct')::numeric,v_pct),coalesce(v_enabled,false)) returning id into v_id;
 end if;
 return v_id;
end;
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
  'can_join',m.state='waiting' and c.enabled and m.replay_from is null and
    ((select count(*) from public.rf_domino_seats s where s.table_id=m.engine_table_id)<m.players
    or (m.players=4 and exists(
      select 1 from public.rf_domino_seats s
      join public.rf_domino_bot_instances_v18 b on b.table_id=s.table_id and b.user_id=s.user_id
      where s.table_id=m.engine_table_id and s.state='active'
    ))),
  'my_prize',(select jsonb_build_object('id',g.id,'amount',g.amount,'redeemed',g.redeemed_at is not null) from public.dfc_z31_gift_cards g where g.points_match_id=m.id and g.recipient_id=auth.uid() and g.points_full_prize),
  'entry_fc',m.entry_fc,'entry_diamonds',m.entry_diamonds,'starts_at',m.starts_at,'match_id',m.id,'target',m.target_points,'state',m.state,'winner_team',m.winner_team,
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

CREATE OR REPLACE FUNCTION public.dfc_z37_trial_replay_confirm(p_match_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare game public.dfc_z37_points_matches%rowtype;
begin
 if auth.uid() is null then raise exception 'Inicia sesión para continuar'; end if;
 perform pg_advisory_xact_lock(hashtextextended('b3abde40-ea42-4a52-ab24-0ce93c090200',37));
 if not exists(select 1 from public.dfc_z37_points_configs where id='b3abde40-ea42-4a52-ab24-0ce93c090200' and enabled) then
  raise exception 'La confirmación no está disponible';
 end if;
 select * into game from public.dfc_z37_points_matches where id=p_match_id and config_id='b3abde40-ea42-4a52-ab24-0ce93c090200'
   and state='settled' and engine_table_id is not null and entry_fc=0 and entry_diamonds=0 for update;
 if not found or game.settled_at is null or clock_timestamp()<game.settled_at+interval '3 seconds'
   or clock_timestamp()>=game.settled_at+interval '13 seconds' then raise exception 'La confirmación no está disponible'; end if;
 update public.dfc_z37_points_participants p set replay_confirmed_at=coalesce(p.replay_confirmed_at,clock_timestamp())
 where p.match_id=game.id and p.user_id=auth.uid()
   and exists(select 1 from public.rf_domino_seats s where s.table_id=game.engine_table_id and s.user_id=p.user_id and s.state='active');
 if not found then raise exception 'Ya no tienes asiento en esta partida'; end if;
 return true;
end $function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_trial_replay_rotate(p_table_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare game public.dfc_z37_points_matches%rowtype; next_game uuid; occupant record; kept integer; enabled boolean;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('b3abde40-ea42-4a52-ab24-0ce93c090200',37)) then return; end if;
 select * into game from public.dfc_z37_points_matches where engine_table_id=p_table_id
   and config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' and state='settled' and entry_fc=0 and entry_diamonds=0
   and settled_at+interval '13 seconds'<=clock_timestamp() for update;
 if not found then return; end if;
 select c.enabled into enabled from public.dfc_z37_points_configs c where c.id=game.config_id;

 for occupant in
   select s.id,s.state,p.replay_confirmed_at,
     exists(select 1 from public.rf_domino_bot_instances_v18 b
       join public.rf_domino_bot_agents_v17 a on a.slot=b.slot and a.enabled
       join public.rf_domino_bot_tables_v18 bt on bt.table_id=b.table_id and bt.enabled
       join public.rf_domino_bot_targets_v19 t on t.table_id=b.table_id and t.target_count>0
       where b.table_id=s.table_id and b.user_id=s.user_id)
     and exists(select 1 from public.dfc_z37_points_participants confirmed
       join public.rf_domino_seats hs on hs.table_id=s.table_id and hs.user_id=confirmed.user_id and hs.state='active'
       where confirmed.match_id=game.id and confirmed.replay_confirmed_at is not null and confirmed.user_id<>s.user_id) as retain_bot
   from public.rf_domino_seats s
   left join public.dfc_z37_points_participants p on p.match_id=game.id and p.user_id=s.user_id
   where s.table_id=p_table_id order by s.seat_no for update of s
 loop
   if not enabled or occupant.state<>'active' or (occupant.replay_confirmed_at is null and not occupant.retain_bot) then
     perform public.rf_domino_return_seat_v11(occupant.id,'Salida al terminar la partida de prueba por puntos');
   end if;
 end loop;
 select count(*) into kept from public.rf_domino_seats where table_id=p_table_id and state='active';
 update public.dfc_z37_points_matches set engine_table_id=null where id=game.id;
 insert into public.dfc_z37_points_matches(config_id,players,target_points,entry_fc,entry_diamonds,admin_pct,engine_table_id,state)
 values(game.config_id,2,game.target_points,0,0,0,p_table_id,case when kept=2 then 'playing' else 'waiting' end)
 returning id into next_game;
 update public.rf_domino_seats set is_ready=true,last_seen_at=clock_timestamp() where table_id=p_table_id and state='active';
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged)
 select next_game,user_id,seat_no,seat_no,true from public.rf_domino_seats where table_id=p_table_id and state='active';
end $function$;
