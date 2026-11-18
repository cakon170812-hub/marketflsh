create function public.dfc_z37_points_scoreboard(p_table_id bigint)
returns jsonb language sql stable security definer set search_path=''
as $$
 select jsonb_build_object(
  'match_id',m.id,'target',m.target_points,'state',m.state,'winner_team',m.winner_team,
  'pot_fc',0,'pot_diamonds',0,
  'players',coalesce((
    select jsonb_agg(jsonb_build_object('seat',p.seat_number,'team',p.team,
      'points',p.points_individual,'mine',p.user_id=auth.uid(),
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
 where m.engine_table_id=p_table_id and m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200'
 and auth.uid() is not null and exists (
   select 1 from public.dfc_z37_points_participants p where p.match_id=m.id and p.user_id=auth.uid()
 );
$$;
revoke all on function public.dfc_z37_points_scoreboard(bigint) from public,anon,authenticated,service_role;
grant execute on function public.dfc_z37_points_scoreboard(bigint) to authenticated;
