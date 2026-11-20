create or replace function public.dfc_z37_points_blocked_winner(p_hand_id bigint)
returns uuid
language sql stable
set search_path=''
as $winner$
 with players as (
   select hp.user_id,hp.seat_no,
     public.rf_domino_tiles_pips_v11(hp.tiles) as pips,
     case when m.players=4 then p.team end as team
   from public.rf_domino_hand_players hp
   join public.rf_domino_hands h on h.id=hp.hand_id
   left join public.dfc_z37_points_matches m on m.engine_table_id=h.table_id and m.state='playing'
   left join public.dfc_z37_points_participants p on p.match_id=m.id and p.user_id=hp.user_id
   where hp.hand_id=p_hand_id
 ), last_play as (
   select move.user_id from public.rf_domino_moves move
   where move.hand_id=p_hand_id and move.action in ('PLAY','AUTO_PLAY')
   order by move.id desc limit 1
 )
 select player.user_id
 from players player
 order by case when player.team is not null then sum(player.pips) over (partition by player.team)
               else player.pips end,
          case when player.user_id=(select user_id from last_play) then 0 else 1 end,
          player.pips,
          player.seat_no
 limit 1;
$winner$;
