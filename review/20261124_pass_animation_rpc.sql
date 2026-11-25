-- REVIEW ONLY: not applied to production and not an executable migration in the deployment pipeline.
-- Adds metadata from the confirmed move; no balance or transfer changes.
-- Preserve existing privileges and function signature. Review, test and package as a migration before rollout.
CREATE OR REPLACE FUNCTION public.dfc_z163_table_diamond_sync()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH wallet AS MATERIALIZED (
    SELECT public.dfc_z16_table_diamond_status() AS payload
  )
  SELECT wallet.payload || jsonb_build_object(
    'server_time',statement_timestamp(),'passes',coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'key',t.event_key,'sender',t.user_id,'recipient',r.user_id,
        'amount',r.delta,'created_at',t.created_at,
        'flashcoin_amount',coalesce(m.amount,0)
      ) ORDER BY t.created_at,t.event_key)
      FROM public.dfc_z16_table_diamond_ledger t
      JOIN public.dfc_z16_table_diamond_ledger r
        ON r.event_key=left(t.event_key,-6)||'recipient'
        AND r.table_id=t.table_id AND r.category='PASS_TRANSFER' AND r.delta>0
      LEFT JOIN public.rf_domino_moves m
        ON m.id=CASE WHEN t.event_key ~ '^z15-pass:[0-9]+:table:sender$'
          THEN split_part(t.event_key,':',2)::bigint END
        AND m.user_id=t.user_id
        AND m.action IN ('PASS','AUTO_PASS','BOT_PASS')
      WHERE t.table_id=(wallet.payload->>'table_id')::bigint
        AND t.category='PASS_TRANSFER' AND t.delta<0 AND right(t.event_key,7)=':sender'
        AND t.created_at>statement_timestamp()-interval '25 seconds'
    ),'[]'::jsonb))
  FROM wallet;
$function$;
