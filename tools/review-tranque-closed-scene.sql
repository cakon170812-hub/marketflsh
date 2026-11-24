-- Review only: publish this migration only after browser verification.
-- Read-only scene for a settled blocked hand. No financial writes.
create or replace function public.dfc_domino_closed_blocked_scene(p_table_id bigint,p_hand_id bigint)
returns jsonb
language sql stable security definer
set search_path to ''
as $function$
  select jsonb_build_object(
    'hand_id',h.id::text,
    'board',h.board,
    'winner_user_id',h.winner_user_id,
    'next_turn_seat',next_player.seat_no,
    'rows',public.dfc_domino_closed_hand_tiles(p_table_id,p_hand_id)
  )
  from public.rf_domino_hands h
  join lateral (
    select hp.seat_no
    from public.rf_domino_moves m
    join public.rf_domino_hand_players hp on hp.hand_id=m.hand_id and hp.user_id=m.user_id
    where m.hand_id=h.id and m.action in ('PASS','AUTO_PASS')
    order by m.id desc limit 1
  ) last_pass on true
  join lateral (
    select hp.seat_no
    from public.rf_domino_hand_players hp
    where hp.hand_id=h.id
    order by case when hp.seat_no>last_pass.seat_no then 0 else 1 end,hp.seat_no
    limit 1
  ) next_player on true
  where auth.uid() is not null
    and h.id=p_hand_id and h.table_id=p_table_id
    and h.status='settled' and h.winner_reason ilike '%TRANQUE%'
    and h.settled_at between now()-interval '35 seconds' and now()
    and exists(select 1 from public.rf_domino_hand_players own
      where own.hand_id=h.id and own.user_id=auth.uid());
$function$;
revoke all on function public.dfc_domino_closed_blocked_scene(bigint,bigint) from public,anon;
grant execute on function public.dfc_domino_closed_blocked_scene(bigint,bigint) to authenticated;
