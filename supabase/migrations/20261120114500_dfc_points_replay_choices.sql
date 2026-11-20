CREATE OR REPLACE FUNCTION public.dfc_z37_points_scoreboard(p_table_id bigint)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select jsonb_build_object(
  'my_prize',(select jsonb_build_object('id',g.id,'amount',g.amount,'redeemed',g.redeemed_at is not null) from public.dfc_z31_gift_cards g where g.points_match_id=m.id and g.recipient_id=auth.uid() and g.points_full_prize),
  'entry_fc',m.entry_fc,'entry_diamonds',m.entry_diamonds,'starts_at',m.starts_at,'match_id',m.id,'target',m.target_points,'state',m.state,'winner_team',m.winner_team,
  'replay_fc_missing',case when m.state='settled' and m.entry_fc>0
    then greatest(0,m.entry_fc-coalesce((select u.balance from public.rf_profiles u where u.id=auth.uid()),0)) else 0 end,
  'live_pot_fc',coalesce((select sum(r.amount) from public.dfc_z37_points_fc_reserves r where r.match_id=m.id and r.status='reserved'),0),
  'live_pot_diamonds',coalesce((select sum(r.amount) from public.dfc_z37_points_diamond_reserves r where r.match_id=m.id and r.state='reserved'),0),
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
$function$;

create function public.dfc_points_replay_choice(p_match_id uuid, p_choice text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid();
 game public.dfc_z37_points_matches%rowtype;
 seat_id uuid;
 missing numeric:=0;
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

 if p_choice in ('confirm','check') and game.entry_fc>0 then
  select greatest(0,game.entry_fc-coalesce(balance,0)) into strict missing
  from public.rf_profiles where id=uid for update;
 end if;
 if missing>0 or p_choice='exit' or (p_choice='timeout' and clock_timestamp()>=game.settled_at+interval '13 seconds') then
  perform public.rf_domino_return_seat_v11(seat_id,'Salida de la revancha Por puntos');
  return jsonb_build_object('state','left','missing_fc',missing);
 end if;
 if p_choice='confirm' then
  perform public.dfc_points_replay_confirm(game.id);
  return jsonb_build_object('state','confirmed');
 end if;
 return jsonb_build_object('state','pending');
end $$;
revoke all on function public.dfc_points_replay_choice(uuid,text) from public,anon;
grant execute on function public.dfc_points_replay_choice(uuid,text) to authenticated;
