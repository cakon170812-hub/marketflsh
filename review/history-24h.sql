-- Review only: apply in a test project before production.
-- Authoritative 24-hour personal history. Never returns unrevealed hands or tiles.
BEGIN;
CREATE OR REPLACE FUNCTION public.dfc_domino_history_24h(p_before_hand bigint DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  WITH allowed AS (
    SELECT h.id,h.table_id,h.created_at,h.settled_at,h.winner_user_id,h.winner_reason,h.status
    FROM public.rf_domino_hands h
    WHERE auth.uid() IS NOT NULL
      AND (p_before_hand IS NULL OR h.id<p_before_hand)
      AND EXISTS (SELECT 1 FROM public.rf_domino_hand_players hp
                  WHERE hp.hand_id=h.id AND hp.user_id=auth.uid())
      AND (h.created_at>statement_timestamp()-interval '24 hours'
           OR h.settled_at>statement_timestamp()-interval '24 hours'
           OR EXISTS (SELECT 1 FROM public.rf_domino_moves mv WHERE mv.hand_id=h.id
                      AND mv.created_at>statement_timestamp()-interval '24 hours'))
    ORDER BY h.id DESC LIMIT 50
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id',h.id,'table_id',h.table_id,'created_at',h.created_at,
    'settled_at',h.settled_at,'status',h.status,
    'winner',CASE WHEN h.winner_user_id IS NOT NULL THEN
      coalesce(nullif(trim(concat_ws(' ',w.first_name,w.last_name)),''),'Jugador') END,
    'reason',h.winner_reason,
    'moves',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id',m.id,'action',m.action,'tile',CASE WHEN m.action IN ('PLAY','AUTO_PLAY') THEN m.tile END,
      'amount',m.amount,'created_at',m.created_at,
      'name',coalesce(nullif(trim(concat_ws(' ',p.first_name,p.last_name)),''),'Jugador')
    ) ORDER BY m.id)
    FROM public.rf_domino_moves m LEFT JOIN public.rf_profiles p ON p.id=m.user_id
    WHERE m.hand_id=h.id AND m.created_at>statement_timestamp()-interval '24 hours'
      AND m.action IN ('PLAY','AUTO_PLAY','PASS','AUTO_PASS','WIN')),'[]'::jsonb)
  ) ORDER BY h.id DESC),'[]'::jsonb)
  FROM allowed h LEFT JOIN public.rf_profiles w ON w.id=h.winner_user_id;
$function$;
REVOKE ALL ON FUNCTION public.dfc_domino_history_24h(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dfc_domino_history_24h(bigint) TO authenticated;
COMMIT;
-- Staging checks: anonymous denial, isolation between unrelated users,
-- pagination across >50 hands, reconnect, 24h boundary, active and settled hands.
