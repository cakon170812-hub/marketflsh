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
    if v_total+30<v_match.target_points and (
       (v_side='right' and new.open_left=(v_tile->>1)::int and new.open_left<>(v_tile->>0)::int)
       or (v_side='left' and new.open_right=(v_tile->>0)::int and new.open_right<>(v_tile->>1)::int)
    ) then v_bonus:=30; end if;
  end if;
  v_points:=v_points+v_bonus;
  if v_points<=0 then return new; end if;

  insert into public.dfc_z37_points_events
    (match_id,external_request_id,user_id,team,event_type,points,engine_hand_id)
  values(v_match.id,pg_catalog.gen_random_uuid(),new.winner_user_id,v_team,
    case when new.winner_reason='TRANQUE_MENOS_PUNTOS' then 'trancazo' when v_bonus>0 then 'capicua' else 'domino' end,
    v_points,new.id)
  on conflict (engine_hand_id) do nothing;
  if not found then return new; end if;

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

create function dfc_private.credit_points_round_pass() returns trigger
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

 update public.dfc_z37_points_participants set points_individual=points_individual+30
 where match_id=game.id and user_id=player.user_id;
 update public.dfc_z37_points_matches
 set team_a_points=team_a_points+case when player.team=1 then 30 else 0 end,
     team_b_points=team_b_points+case when player.team=2 then 30 else 0 end
 where id=game.id;
 return new;
end $round$;
revoke all on function dfc_private.credit_points_round_pass() from public,anon,authenticated;

create trigger dfc_points_round_pass
 after update of consecutive_passes on public.rf_domino_hands
 for each row when (
  new.status='playing' and new.consecutive_passes in (2,3) and
  new.consecutive_passes=old.consecutive_passes+1
 )
 execute function dfc_private.credit_points_round_pass();
