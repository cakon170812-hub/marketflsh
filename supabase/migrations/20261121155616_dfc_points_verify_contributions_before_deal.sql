
CREATE OR REPLACE FUNCTION dfc_private.points_contributions_ready(p_game public.dfc_z37_points_matches)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
 WITH confirmed AS (
  SELECT p.user_id
  FROM public.dfc_z37_points_participants p
  JOIN public.rf_domino_seats s
    ON s.table_id=p_game.engine_table_id AND s.user_id=p.user_id AND s.state='active'
  WHERE p.match_id=p_game.id AND p.charged
 )
 SELECT (SELECT count(*) FROM confirmed)=p_game.players
 AND NOT EXISTS (
  SELECT 1 FROM confirmed p
  LEFT JOIN public.dfc_z37_points_fc_reserves f
    ON f.match_id=p_game.id AND f.user_id=p.user_id AND f.status='reserved'
  LEFT JOIN public.dfc_z37_points_diamond_reserves d
    ON d.match_id=p_game.id AND d.user_id=p.user_id AND d.state='reserved'
  WHERE coalesce(f.amount,0) IS DISTINCT FROM p_game.entry_fc
     OR coalesce(d.amount,0) IS DISTINCT FROM p_game.entry_diamonds
 )
 AND (SELECT count(*) FROM public.dfc_z37_points_fc_reserves f
      WHERE f.match_id=p_game.id AND f.status='reserved')
     =CASE WHEN p_game.entry_fc>0 THEN p_game.players ELSE 0 END
 AND (SELECT count(*) FROM public.dfc_z37_points_diamond_reserves d
      WHERE d.match_id=p_game.id AND d.state='reserved')
     =CASE WHEN p_game.entry_diamonds>0 THEN p_game.players ELSE 0 END;
$function$;

REVOKE EXECUTE ON FUNCTION dfc_private.points_contributions_ready(public.dfc_z37_points_matches)
FROM PUBLIC, anon, authenticated;

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
 -- Keep the table waiting and eligible for the next server cycle.
 IF NOT dfc_private.points_contributions_ready(game) THEN
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
  'verifying_contributions',CASE WHEN m.state='waiting' AND (
    SELECT count(*) FROM public.dfc_z37_points_participants p
    JOIN public.rf_domino_seats s
      ON s.table_id=m.engine_table_id AND s.user_id=p.user_id AND s.state='active'
    WHERE p.match_id=m.id AND p.charged
  )=m.players THEN NOT dfc_private.points_contributions_ready(m) ELSE false END,
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
