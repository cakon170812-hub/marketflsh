-- The points end-of-match sequence is 10 s for the last hand, 10 s for
-- the victory screen, and 10 s to decide whether to play again.
-- Update the current definitions so unrelated admission and payout rules are retained.
do $migration$
declare
  routine record;
  definition text;
  revised text;
  old_open constant text := $sql$interval '3 seconds'$sql$;
  new_open constant text := $sql$interval '20 seconds'$sql$;
  old_deadline constant text := $sql$interval '13 seconds'$sql$;
  new_deadline constant text := $sql$interval '30 seconds'$sql$;
begin
  for routine in select * from (values
    ('public.dfc_z37_points_scoreboard(bigint)', true),
    ('dfc_private.confirm_points_replay_at_terms(uuid,jsonb)', true),
    ('public.dfc_z37_trial_replay_confirm(uuid)', true),
    ('public.dfc_points_replay_choice_with_balance(uuid,text,jsonb,numeric)', false),
    ('dfc_private.rotate_paid_points(bigint)', false),
    ('public.dfc_z37_trial_replay_rotate(bigint)', false),
    ('public.dfc_z37_trial_replay_cycle()', false)
  ) as routines(signature, has_open)
  loop
    definition := pg_get_functiondef(routine.signature::regprocedure);
    if (length(definition)-length(replace(definition,old_deadline,'')))<>length(old_deadline)
       or (routine.has_open and
           (length(definition)-length(replace(definition,old_open,'')))<>length(old_open)) then
      raise exception 'Unexpected points replay timing in %', routine.signature;
    end if;

    revised := replace(definition,old_deadline,new_deadline);
    if routine.has_open then
      revised := replace(revised,old_open,new_open);
    end if;

    if routine.signature='public.dfc_z37_points_scoreboard(bigint)' then
      if position($sql$'server_time',statement_timestamp(),$sql$ in revised)=0 then
        raise exception 'Missing server timestamp in %', routine.signature;
      end if;
      revised := replace(revised,
        $sql$'server_time',statement_timestamp(),$sql$,
        $sql$'match_settled_at',case when viewer.is_participant and m.state='settled' then m.settled_at end,
  'server_time',statement_timestamp(),$sql$);
    end if;

    execute revised;
  end loop;
end
$migration$;
