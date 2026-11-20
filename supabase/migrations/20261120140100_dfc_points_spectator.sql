CREATE OR REPLACE FUNCTION public.dfc_z37_points_scoreboard(p_table_id bigint)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select jsonb_build_object(
  'config_id',m.config_id,'table_name',c.name,'pass_fee_fc',c.pass_fee_fc,
  'can_join',m.state='waiting' and c.enabled and m.replay_from is null and
    (select count(*) from public.rf_domino_seats s where s.table_id=m.engine_table_id)<m.players,
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

create function public.dfc_z37_points_join_viewed(p_table bigint,p_request uuid,p_fc numeric,p_diamonds bigint,p_pass_fee numeric)
 returns jsonb language plpgsql security definer set search_path='' as $viewed$
declare config uuid; result jsonb;
begin
 if auth.uid() is null then raise exception 'Inicia sesión para sentarte'; end if;
 select m.config_id into config from public.dfc_z37_points_matches m
 join public.dfc_z37_points_configs c on c.id=m.config_id
 where m.engine_table_id=p_table and m.state='waiting' and c.enabled and c.pass_fee_fc=p_pass_fee;
 if not found then raise exception 'La mesa ya comenzó o cambió la tarifa. Revisa la disponibilidad.'; end if;
 if config='b3abde40-ea42-4a52-ab24-0ce93c090200' then
   result:=public.dfc_z37_points_join_engine(config,p_request);
 else
   result:=public.dfc_z37_points_join_paid(config,p_request,p_fc,p_diamonds);
 end if;
 if (result->>'table_id')::bigint is distinct from p_table then
   raise exception 'Este tablero ya no admite asientos';
 end if;
 return result;
end $viewed$;
revoke all on function public.dfc_z37_points_join_viewed(bigint,uuid,numeric,bigint,numeric) from public,anon;
grant execute on function public.dfc_z37_points_join_viewed(bigint,uuid,numeric,bigint,numeric) to authenticated;

create function public.dfc_z37_points_live_boards()
 returns table(config_id uuid,table_id text,state text,can_join boolean)
 language sql stable security definer set search_path='' as $boards$
 select m.config_id,m.engine_table_id::text,m.state,
   m.state='waiting' and m.replay_from is null and
   (select count(*) from public.rf_domino_seats s where s.table_id=m.engine_table_id)<m.players
 from public.dfc_z37_points_matches m
 join public.dfc_z37_points_configs c on c.id=m.config_id and c.enabled
 where auth.uid() is not null and m.engine_table_id is not null and m.state in ('waiting','playing')
 order by m.created_at desc,m.id desc;
$boards$;
revoke all on function public.dfc_z37_points_live_boards() from public,anon;
grant execute on function public.dfc_z37_points_live_boards() to authenticated;
