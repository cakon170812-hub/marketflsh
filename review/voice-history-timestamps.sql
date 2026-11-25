-- DOMINO FLASH COIN: review only. Apply before publishing the new chat client.
-- The existing 10-minute audio read window is unchanged.
BEGIN;
CREATE OR REPLACE FUNCTION public.dfc_domino_voice_history(p_table_id bigint)
RETURNS TABLE(id uuid, sender_name text, created_at timestamptz, mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT recent.id, recent.sender_name, recent.created_at, recent.mine
  FROM (
    SELECT n.id,
           coalesce(nullif(trim(concat_ws(' ',p.first_name,p.last_name)),''),'Jugador') AS sender_name,
           n.created_at, n.sender_id=auth.uid() AS mine
    FROM dfc_private.domino_voice_notes n
    JOIN public.rf_profiles p ON p.id=n.sender_id
    WHERE auth.uid() IS NOT NULL
      AND n.table_id=p_table_id
      AND n.created_at>statement_timestamp()-interval '10 minutes'
      AND EXISTS (SELECT 1 FROM public.rf_domino_seats s
                  WHERE s.table_id=n.table_id AND s.user_id=auth.uid()
                    AND s.state='active' AND s.joined_at<=n.created_at)
      AND NOT EXISTS (SELECT 1 FROM public.dfc_mod_blocked_users_v002 b
                      WHERE b.blocker_id=auth.uid() AND b.blocked_id=n.sender_id)
    ORDER BY n.created_at DESC,n.id DESC LIMIT 48
  ) recent
  ORDER BY recent.created_at,recent.id;
$function$;
REVOKE ALL ON FUNCTION public.dfc_domino_voice_history(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dfc_domino_voice_history(bigint) TO authenticated;
COMMIT;
-- Validate with seated authenticated sender/recipient, other table, blocked user,
-- reconnect, and local time zones; no timestamps supplied by the client.
