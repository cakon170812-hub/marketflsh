-- Correction 07: reviewed definition of the RPC already present in production on 2026-11-25.
-- Reference only: no schema change or reinstallation needed for this definition.
-- Adds metadata from the confirmed move; no balance or transfer changes.
-- Both financial transfers remain in the same transaction; the 2500 ms delay is visual only.
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

-- Repeatable read-only reconciliation; does not reveal player identifiers.
-- Expected: total=distinct_events; all error counts=0.
-- Historical snapshot 2026-11-25: 20228 distinct events, 14520 with FC,
-- zero missing moves, wrong recipients, mismatched amounts or commission entries.
WITH checked AS (
 SELECT t.event_key,t.user_id AS payer,t.delta,r.user_id AS receiver,r.delta AS received,
 m.id AS move_id,m.amount AS fc_amount,
 (SELECT p.user_id FROM public.rf_domino_moves p WHERE p.hand_id=m.hand_id AND p.id<m.id
   AND p.action IN ('PLAY','AUTO_PLAY','BOT_PLAY') AND p.user_id<>m.user_id
   ORDER BY p.id DESC LIMIT 1) AS expected_receiver,
 a.delta AS admin_delta
 FROM public.dfc_z16_table_diamond_ledger t
 LEFT JOIN public.dfc_z16_table_diamond_ledger r
   ON r.event_key=left(t.event_key,-6)||'recipient' AND r.table_id=t.table_id AND r.category='PASS_TRANSFER' AND r.delta>0
 LEFT JOIN public.rf_domino_moves m
   ON m.id=CASE WHEN t.event_key ~ '^z15-pass:[0-9]+:table:sender$' THEN split_part(t.event_key,':',2)::bigint END
   AND m.user_id=t.user_id AND m.action IN ('PASS','AUTO_PASS','BOT_PASS')
 LEFT JOIN public.dfc_z16_table_diamond_ledger a
   ON a.event_key=left(t.event_key,-6)||'admin' AND a.table_id=t.table_id AND a.category='PASS_ADMIN_FEE'
 WHERE t.category='PASS_TRANSFER' AND t.delta<0 AND right(t.event_key,7)=':sender'
)
SELECT count(*) AS total,count(DISTINCT event_key) AS distinct_events,
 count(*) FILTER (WHERE receiver IS NULL OR receiver IS DISTINCT FROM expected_receiver OR receiver=payer) AS recipient_errors,
 count(*) FILTER (WHERE move_id IS NULL) AS missing_move,
 count(*) FILTER (WHERE received IS DISTINCT FROM -delta) AS amount_errors,
 count(*) FILTER (WHERE admin_delta IS DISTINCT FROM -0.010::numeric) AS commission_errors,
 count(*) FILTER (WHERE fc_amount>0) AS with_fc
FROM checked;
-- UI validation still required: FC then 2.5 seconds then direct diamonds, no pot route;
-- diamonds-only pass, FC-only pass, close/rejoin, two fast consecutive passes, bots.
