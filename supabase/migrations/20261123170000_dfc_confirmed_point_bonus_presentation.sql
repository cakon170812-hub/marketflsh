alter table public.dfc_z37_points_events
  add column bonus_points integer,
  add column bonus_reason text;

create table dfc_private.points_round_pass_awards (
  match_id uuid not null references public.dfc_z37_points_matches(id) on delete cascade,
  hand_id bigint not null references public.rf_domino_hands(id) on delete cascade,
  board_length integer not null,
  seat integer not null,
  points integer not null,
  awarded_at timestamptz not null default statement_timestamp(),
  primary key (match_id, hand_id, board_length)
);

revoke all on dfc_private.points_round_pass_awards from public, anon, authenticated;
alter table dfc_private.points_round_pass_awards enable row level security;

CREATE OR REPLACE FUNCTION public.dfc_z37_record_points_hand()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_match public.dfc_z37_points_matches%rowtype;
  v_team smallint;
  v_points integer;
  v_total integer;
  v_bonus integer:=0;
  v_bonus_reason text;
  v_side text;
  v_tile jsonb;
begin
  if new.status <> 'settled' or old.status is not distinct from new.status
     or new.winner_user_id is null
     or coalesce(new.winner_reason,'') not in ('ULTIMA_FICHA','CAPICUA','TRANQUE_MENOS_PUNTOS') then
    return new;
  end if;

  select m.* into v_match
  from public.dfc_z37_points_matches m
  where m.engine_table_id=new.table_id and m.state='playing'
  for update;
  if not found then return new; end if;

  select p.team into v_team
  from public.dfc_z37_points_participants p
  where p.match_id=v_match.id and p.user_id=new.winner_user_id and p.charged;
  if not found then return new; end if;

  select coalesce(sum(public.rf_domino_tiles_pips_v11(hp.tiles)),0)
  into v_points
  from public.rf_domino_hand_players hp
  join public.dfc_z37_points_participants p
    on p.match_id=v_match.id and p.user_id=hp.user_id and p.charged
  where hp.hand_id=new.id
    and (new.winner_reason='TRANQUE_MENOS_PUNTOS' or p.team<>v_team);

  if new.winner_reason='TRANQUE_MENOS_PUNTOS' then
    v_bonus_reason:='blocked_hand';
  elsif new.winner_reason='CAPICUA' then
    v_bonus_reason:='different_ends_required';
  end if;

  if new.winner_reason in ('ULTIMA_FICHA','CAPICUA') and jsonb_array_length(new.board)>1 then
    select p.points_individual into v_total from public.dfc_z37_points_participants p
    where p.match_id=v_match.id and p.user_id=new.winner_user_id;
    if v_match.players<>3 then
      v_total:=case v_team when 1 then v_match.team_a_points else v_match.team_b_points end;
    end if;
    select m.side,m.tile into v_side,v_tile from public.rf_domino_moves m
    where m.hand_id=new.id and m.user_id=new.winner_user_id and m.action in ('PLAY','AUTO_PLAY')
    order by m.id desc limit 1;
    -- The last move stores the tile in board order. The other end did not change.
    if (
       (v_side='right' and new.open_left=(v_tile->>1)::int and new.open_left<>(v_tile->>0)::int)
       or (v_side='left' and new.open_right=(v_tile->>0)::int and new.open_right<>(v_tile->>1)::int)
    ) then
      if v_total+30<v_match.target_points then
        v_bonus:=30;
      else
        v_bonus_reason:='target_reached';
      end if;
    end if;
  end if;
  v_points:=v_points+v_bonus;
  if v_points<=0 and v_bonus_reason is null then return new; end if;

  insert into public.dfc_z37_points_events
    (match_id,external_request_id,user_id,team,event_type,points,engine_hand_id,bonus_points,bonus_reason)
  values(v_match.id,pg_catalog.gen_random_uuid(),new.winner_user_id,v_team,
    case when new.winner_reason='TRANQUE_MENOS_PUNTOS' then 'trancazo' when v_bonus>0 then 'capicua' else 'domino' end,
    v_points,new.id,case when v_bonus>0 or v_bonus_reason is not null then v_bonus end,
    case when v_bonus=0 then v_bonus_reason end)
  on conflict (engine_hand_id) do nothing;
  if not found or v_points<=0 then return new; end if;

  update public.dfc_z37_points_participants
  set points_individual=points_individual+v_points
  where match_id=v_match.id and user_id=new.winner_user_id;

  if v_match.players=3 then
    select p.points_individual into strict v_total
    from public.dfc_z37_points_participants p
    where p.match_id=v_match.id and p.user_id=new.winner_user_id;
  else
    v_total:=(case v_team when 1 then v_match.team_a_points else v_match.team_b_points end)+v_points;
  end if;

  update public.dfc_z37_points_matches
  set team_a_points=team_a_points+case when v_team=1 then v_points else 0 end,
      team_b_points=team_b_points+case when v_team=2 then v_points else 0 end,
      winner_team=case when v_total>=target_points then v_team else winner_team end,
      state=case when v_total>=target_points then 'settled' else state end,
      settled_at=case when v_total>=target_points then now() else settled_at end
  where id=v_match.id;
  return new;
end;
$function$;

create or replace function dfc_private.credit_points_round_pass() returns trigger
language plpgsql security definer set search_path='' as $round$
declare
 game public.dfc_z37_points_matches%rowtype;
 player public.dfc_z37_points_participants%rowtype;
 score integer;
begin
 if new.last_play_user_id is null then return new; end if;
 select * into game from public.dfc_z37_points_matches
 where engine_table_id=new.table_id and state='playing' and players in (3,4) for update;
 if not found or new.consecutive_passes<>game.players-1 then return new; end if;
 select * into player from public.dfc_z37_points_participants
 where match_id=game.id and user_id=new.last_play_user_id and charged;
 if not found then return new; end if;
 score:=case when game.players=3 then player.points_individual
     when player.team=1 then game.team_a_points else game.team_b_points end;
 if score+30>=game.target_points then return new; end if;

 insert into dfc_private.points_round_pass_awards(match_id,hand_id,board_length,seat,points)
 values (game.id,new.id,jsonb_array_length(new.board),player.seat_number,30)
 on conflict do nothing;
 if not found then return new; end if;

 update public.dfc_z37_points_participants set points_individual=points_individual+30
 where match_id=game.id and user_id=player.user_id;
 update public.dfc_z37_points_matches
 set team_a_points=team_a_points+case when player.team=1 then 30 else 0 end,
     team_b_points=team_b_points+case when player.team=2 then 30 else 0 end
 where id=game.id;
 return new;
end $round$;

create or replace function public.dfc_points_scoreboard_victory(p_table_id bigint)
returns jsonb language plpgsql security definer set search_path='' as $function$
declare
  scoreboard jsonb;
  bonus jsonb;
  passes jsonb;
begin
  perform dfc_private.points_register_victory_client(p_table_id,true);
  scoreboard:=dfc_private.points_scoreboard_with_final(p_table_id);
  if scoreboard is null or auth.uid() is null or not exists (
    select 1 from jsonb_array_elements(scoreboard->'players') player
    where player->'mine'='true'::jsonb
  ) then return scoreboard; end if;

  select jsonb_build_object('bonus_points', coalesce(e.bonus_points,
      case e.event_type when 'capicua' then 30 when 'trancazo' then 0 end),
    'bonus_reason', coalesce(e.bonus_reason,
      case when e.event_type='trancazo' then 'blocked_hand' end))
  into bonus
  from public.dfc_z37_points_events e
  where e.match_id=(scoreboard->>'match_id')::uuid
    and e.engine_hand_id=(scoreboard#>>'{last_hand,id}')::bigint;
  if bonus is not null then
    scoreboard:=jsonb_set(scoreboard,'{last_hand}',scoreboard->'last_hand'||bonus);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id',a.hand_id::text||':'||a.board_length, 'seat',a.seat,'points',a.points)
      order by a.hand_id,a.board_length),'[]'::jsonb)
  into passes
  from dfc_private.points_round_pass_awards a
  where a.match_id=(scoreboard->>'match_id')::uuid
    and a.awarded_at>statement_timestamp()-interval '8 seconds';
  return scoreboard||jsonb_build_object('round_pass_awards',passes);
end;
$function$;
