-- Deploy alongside multiplayer admission and settlement.
BEGIN;
ALTER TABLE public.dfc_z37_points_matches DROP CONSTRAINT dfc_z37_points_matches_winner_team_check,
  ADD CONSTRAINT dfc_z37_points_matches_winner_team_check CHECK (winner_team IN (1,2,3));
ALTER TABLE public.dfc_z37_points_participants DROP CONSTRAINT dfc_z37_points_participants_team_check,
  ADD CONSTRAINT dfc_z37_points_participants_team_check CHECK (team IN (1,2,3));
ALTER TABLE public.dfc_z37_points_events DROP CONSTRAINT dfc_z37_points_events_team_check,
  ADD CONSTRAINT dfc_z37_points_events_team_check CHECK (team IN (1,2,3));

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
begin
  if new.status <> 'settled' or old.status is not distinct from new.status
     or new.winner_user_id is null
     or coalesce(new.winner_reason,'') not in ('ULTIMA_FICHA','TRANQUE_MENOS_PUNTOS') then
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
  if v_points<=0 then return new; end if;

  insert into public.dfc_z37_points_events
    (match_id,external_request_id,user_id,team,event_type,points,engine_hand_id)
  values(v_match.id,pg_catalog.gen_random_uuid(),new.winner_user_id,v_team,
    case new.winner_reason when 'ULTIMA_FICHA' then 'domino' else 'trancazo' end,
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

COMMIT;
