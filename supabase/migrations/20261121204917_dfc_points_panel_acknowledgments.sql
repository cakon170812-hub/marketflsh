create table dfc_private.points_panel_closures (
  match_id uuid not null references public.dfc_z37_points_matches(id) on delete cascade,
  hand_id bigint not null,
  phase text not null check (phase in ('hand','victory')),
  closed_by uuid[] not null default '{}',
  completed_at timestamptz,
  is_final boolean not null,
  primary key (match_id, hand_id, phase)
);
revoke all on dfc_private.points_panel_closures from public, anon, authenticated;

create function dfc_private.points_victory_opens(m public.dfc_z37_points_matches)
returns timestamptz language sql stable set search_path='' as $$
  select least(m.settled_at+interval '10 seconds', (
    select min(c.completed_at) from dfc_private.points_panel_closures c
    where c.match_id=m.id and c.phase='hand' and c.is_final))
$$;

create function dfc_private.points_replay_opens(m public.dfc_z37_points_matches)
returns timestamptz language sql stable set search_path='' as $$
  select least(dfc_private.points_victory_opens(m)+interval '10 seconds', (
    select c.completed_at from dfc_private.points_panel_closures c
    where c.match_id=m.id and c.hand_id=0 and c.phase='victory'))
$$;

create function dfc_private.points_replay_ready(m public.dfc_z37_points_matches)
returns boolean language sql stable set search_path='' as $$
  select count(*)=m.players
  from public.dfc_z37_points_participants p
  where p.match_id=m.id and p.replay_confirmed_at is not null
    and exists(select 1 from public.rf_domino_seats s
      where s.table_id=m.engine_table_id and s.user_id=p.user_id and s.state='active')
$$;

create function dfc_private.start_confirmed_points_replay(p_match uuid)
returns void language plpgsql set search_path='' as $$
declare
  g public.dfc_z37_points_matches%rowtype;
begin
  select * into g from public.dfc_z37_points_matches where id=p_match and state='settled';
  if not found or g.engine_table_id is null or not dfc_private.points_replay_ready(g) then return; end if;
  if g.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' then
    perform public.dfc_z37_trial_replay_rotate(g.engine_table_id);
    perform public.rf_domino_try_start_v189(g.engine_table_id);
  else
    perform dfc_private.rotate_paid_points(g.engine_table_id);
    perform dfc_private.start_waiting_points_match(g.config_id,g.engine_table_id);
  end if;
exception when others then
  -- Keep a confirmed contribution if the immediate start fails. The regular cycle retries.
  raise warning 'Reintento de revancha Por puntos %: %', p_match, SQLSTATE;
end;
$$;

revoke all on function dfc_private.points_victory_opens(public.dfc_z37_points_matches) from public, anon, authenticated;
revoke all on function dfc_private.points_replay_opens(public.dfc_z37_points_matches) from public, anon, authenticated;
revoke all on function dfc_private.points_replay_ready(public.dfc_z37_points_matches) from public, anon, authenticated;
revoke all on function dfc_private.start_confirmed_points_replay(uuid) from public, anon, authenticated;

create function public.dfc_points_close_panel(p_match_id uuid, p_hand_id bigint, p_phase text)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  uid uuid:=auth.uid();
  g public.dfc_z37_points_matches%rowtype;
  latest_hand bigint;
  hand_settled timestamptz;
  begins_at timestamptz;
  ends_at timestamptz;
  closed uuid[];
  finished timestamptz;
begin
  if uid is null or p_phase is null or p_phase not in ('hand','victory') then return false; end if;
  select * into g from public.dfc_z37_points_matches where id=p_match_id;
  if not found then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(g.config_id::text,37));
  select * into g from public.dfc_z37_points_matches where id=p_match_id for update;
  if not found or g.engine_table_id is null or g.state not in ('playing','settled') or not exists (
    select 1 from public.dfc_z37_points_participants p
    join public.rf_domino_seats s on s.table_id=g.engine_table_id and s.user_id=p.user_id and s.state='active'
    where p.match_id=g.id and p.user_id=uid
      and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=uid)
  ) then return false; end if;

  if p_phase='hand' then
    select h.id,h.settled_at into latest_hand,hand_settled
    from public.dfc_z37_points_events e
    join public.rf_domino_hands h on h.id=e.engine_hand_id and h.status='settled'
    where e.match_id=g.id order by h.id desc limit 1;
    if latest_hand is null or p_hand_id is distinct from latest_hand then return false; end if;
    if exists(select 1 from public.rf_domino_hands h where h.table_id=g.engine_table_id
        and h.id>latest_hand and h.status in ('playing','shuffling')) then return false; end if;
    ends_at:=coalesce(g.settled_at,hand_settled)+interval '10 seconds';
  else
    if g.state<>'settled' or p_hand_id is distinct from 0 then return false; end if;
    begins_at:=dfc_private.points_victory_opens(g);
    ends_at:=begins_at+interval '10 seconds';
  end if;
  if ends_at is null or clock_timestamp()>=ends_at or clock_timestamp()<begins_at then return false; end if;

  insert into dfc_private.points_panel_closures as c(match_id,hand_id,phase,closed_by,is_final)
  values(g.id,p_hand_id,p_phase,array[uid],g.state='settled')
  on conflict (match_id,hand_id,phase) do update
  set closed_by=case when uid=any(c.closed_by) then c.closed_by else array_append(c.closed_by,uid) end,
      is_final=c.is_final or excluded.is_final
  returning c.closed_by,c.completed_at into closed,finished;
  if finished is not null then return true; end if;

  if not exists(
    select 1 from public.dfc_z37_points_participants p
    join public.rf_domino_seats s on s.table_id=g.engine_table_id and s.user_id=p.user_id and s.state='active'
    where p.match_id=g.id and not (p.user_id=any(closed))
      and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=p.user_id)
  ) then
    update dfc_private.points_panel_closures set completed_at=clock_timestamp()
    where match_id=g.id and hand_id=p_hand_id and phase=p_phase;
    if p_phase='hand' and g.state='playing' then
      begin
        perform public.rf_domino_try_start_v189(g.engine_table_id);
      exception when others then
        raise warning 'Reintento de barajeo Por puntos %: %', g.engine_table_id, SQLSTATE;
      end;
    end if;
  end if;
  return true;
end;
$$;
revoke all on function public.dfc_points_close_panel(uuid,bigint,text) from public, anon;
grant execute on function public.dfc_points_close_panel(uuid,bigint,text) to authenticated;

-- Preserve the current admission, settlement and wallet logic. Abort if a timing
-- anchor has drifted instead of silently installing an incomplete sequence.
do $migration$
declare
  patch record;
  definition text;
begin
  for patch in select * from (values
    ('public.dfc_z37_points_scoreboard(bigint)', $p$m.settled_at+interval '20 seconds'$p$, $p$dfc_private.points_replay_opens(m)$p$),
    ('public.dfc_z37_points_scoreboard(bigint)', $p$m.settled_at+interval '30 seconds'$p$, $p$dfc_private.points_replay_opens(m)+interval '10 seconds'$p$),
    ('public.dfc_z37_points_scoreboard(bigint)', $p$'server_time',statement_timestamp(),$p$, $p$'victory_opens',case when viewer.is_participant and m.state='settled' then dfc_private.points_victory_opens(m) end,
  'victory_closed',viewer.is_participant and exists(
    select 1 from dfc_private.points_panel_closures c where c.match_id=m.id and c.hand_id=0
      and c.phase='victory' and auth.uid()=any(c.closed_by)),
  'server_time',statement_timestamp(),$p$),
    ('public.dfc_z37_points_scoreboard(bigint)', $p$'id',h.id::text,'points',e.points$p$, $p$'id',h.id::text,'settled_at',h.settled_at,'closed',exists(
        select 1 from dfc_private.points_panel_closures c where c.match_id=m.id and c.hand_id=h.id
          and c.phase='hand' and auth.uid()=any(c.closed_by)), 'points',e.points$p$),
    ('dfc_private.confirm_points_replay_at_terms(uuid,jsonb)', $p$g.settled_at+interval '20 seconds'$p$, $p$dfc_private.points_replay_opens(g)$p$),
    ('dfc_private.confirm_points_replay_at_terms(uuid,jsonb)', $p$g.settled_at+interval '30 seconds'$p$, $p$(dfc_private.points_replay_opens(g)+interval '10 seconds')$p$),
    ('public.dfc_z37_trial_replay_confirm(uuid)', $p$game.settled_at+interval '20 seconds'$p$, $p$dfc_private.points_replay_opens(game)$p$),
    ('public.dfc_z37_trial_replay_confirm(uuid)', $p$game.settled_at+interval '30 seconds'$p$, $p$(dfc_private.points_replay_opens(game)+interval '10 seconds')$p$),
    ('public.dfc_points_replay_choice_with_balance(uuid,text,jsonb,numeric)', $p$game.settled_at+interval '30 seconds'$p$, $p$(dfc_private.points_replay_opens(game)+interval '10 seconds')$p$),
    ('public.dfc_points_replay_choice_with_balance(uuid,text,jsonb,numeric)', $p$ PERFORM dfc_private.confirm_points_replay_at_terms(game.id,p_terms);$p$, $p$ PERFORM dfc_private.confirm_points_replay_at_terms(game.id,p_terms);
 PERFORM dfc_private.start_confirmed_points_replay(game.id);$p$),
    ('dfc_private.rotate_paid_points(bigint)', $p$or g.settled_at+interval '30 seconds'>clock_timestamp()$p$, $p$or ((dfc_private.points_replay_opens(g)+interval '10 seconds')>clock_timestamp() and not dfc_private.points_replay_ready(g))$p$),
    ('public.dfc_z37_trial_replay_rotate(bigint)', $p$select * into game from public.dfc_z37_points_matches where$p$, $p$select m.* into game from public.dfc_z37_points_matches m where$p$),
    ('public.dfc_z37_trial_replay_rotate(bigint)', $p$settled_at+interval '30 seconds'<=clock_timestamp()$p$, $p$(dfc_private.points_replay_opens(m)+interval '10 seconds'<=clock_timestamp() or dfc_private.points_replay_ready(m))$p$),
    ('public.dfc_z37_trial_replay_cycle()', $p$m.settled_at+interval '30 seconds'<=clock_timestamp()$p$, $p$(dfc_private.points_replay_opens(m)+interval '10 seconds'<=clock_timestamp() or dfc_private.points_replay_ready(m))$p$),
    ('public.rf_domino_try_start_v189(bigint)', $p$and last_hand.settled_at > clock_timestamp() - (CASE WHEN coalesce(last_hand.winner_reason,'') ILIKE '%TRANQUE%' THEN interval '21 seconds' ELSE interval '13 seconds' END)$p$, $p$and (
        (not exists(select 1 from public.dfc_z37_points_matches m where m.engine_table_id=p_table_id and m.state='playing')
         and last_hand.settled_at > clock_timestamp() - (CASE WHEN coalesce(last_hand.winner_reason,'') ILIKE '%TRANQUE%' THEN interval '21 seconds' ELSE interval '13 seconds' END))
        or (last_hand.settled_at > clock_timestamp()-interval '10 seconds' and exists(
          select 1 from public.dfc_z37_points_matches m
          join public.dfc_z37_points_events e on e.match_id=m.id and e.engine_hand_id=last_hand.id
          where m.engine_table_id=p_table_id and m.state='playing' and not exists(
            select 1 from dfc_private.points_panel_closures c where c.match_id=m.id
              and c.hand_id=last_hand.id and c.phase='hand' and c.completed_at is not null)))
      )$p$)
  ) as patches(signature, before_text, after_text)
  loop
    definition:=pg_get_functiondef(patch.signature::regprocedure);
    if (length(definition)-length(replace(definition,patch.before_text,'')))<>length(patch.before_text) then
      raise exception 'Unexpected points panel definition in %',patch.signature;
    end if;
    execute replace(definition,patch.before_text,patch.after_text);
  end loop;
end;
$migration$;
