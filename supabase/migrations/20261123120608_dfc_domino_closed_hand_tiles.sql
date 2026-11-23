-- Reveal the remaining tiles of a recent, settled hand in its result panel.
create function public.dfc_domino_closed_hand_tiles(p_table_id bigint, p_hand_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'user_id', hp.user_id,
      'seat_no', hp.seat_no,
      'full_name', coalesce(
        nullif(btrim(agent.display_name), ''),
        nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), ''),
        p.public_id::text,
        'Jugador'
      ),
      'avatar_url', coalesce(nullif(btrim(agent.avatar_url), ''), p.avatar_url),
      'tiles', coalesce(hp.tiles, '[]'::jsonb),
      'points', public.rf_domino_tiles_pips_v11(hp.tiles)
    ) order by hp.seat_no
  ), '[]'::jsonb)
  from public.rf_domino_hands h
  join public.rf_domino_tables t on t.id = h.table_id
  join public.rf_domino_configs c on c.id = t.config_id
  join public.rf_domino_hand_players hp on hp.hand_id = h.id
  join public.rf_profiles p on p.id = hp.user_id
  left join public.rf_domino_bot_instances_v18 instance on instance.user_id = hp.user_id
  left join public.rf_domino_bot_agents_v17 agent on agent.slot = instance.slot
  where (select auth.uid()) is not null
    and h.id = p_hand_id
    and t.id = p_table_id
    and h.status = 'settled'
    and h.settled_at between now() - interval '35 seconds' and now()
    and (
      c.active
      or exists (
        select 1 from public.rf_domino_hand_players own
        where own.hand_id = h.id and own.user_id = (select auth.uid())
      )
    );
$$;

revoke all on function public.dfc_domino_closed_hand_tiles(bigint, bigint) from public, anon;
grant execute on function public.dfc_domino_closed_hand_tiles(bigint, bigint) to authenticated;
