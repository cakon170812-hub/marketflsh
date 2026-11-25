-- DOMINO FLASH COIN: review only. Do not run against production before approval.
-- Deploy this SQL before enabling five-minute notes in the client.
-- Keeps the current RPC signature, permissions, moderation, membership and MIME checks.
-- 5 MiB raw = 6,990,508 base64 characters maximum.
BEGIN;
DO $review$
DECLARE
  old_def text;
  new_def text;
  old_check text;
BEGIN
  SELECT pg_get_functiondef('public.dfc_domino_send_voice(bigint,uuid,text,text)'::regprocedure)
    INTO old_def;
  SELECT pg_get_constraintdef(oid) INTO old_check
    FROM pg_constraint
    WHERE conrelid='dfc_private.domino_voice_notes'::regclass
      AND conname='domino_voice_notes_audio_check';
  IF old_def IS NULL OR position('length(p_audio) NOT BETWEEN 1 AND 699052' IN old_def)=0
    OR position('octet_length(clip) NOT BETWEEN 1 AND 524288' IN old_def)=0
    OR old_check IS NULL OR position('524288' IN old_check)=0 THEN
    RAISE EXCEPTION 'Voice limits differ from reviewed baseline; review manually.';
  END IF;
  new_def := replace(old_def, 'length(p_audio) NOT BETWEEN 1 AND 699052',
                            'length(p_audio) NOT BETWEEN 1 AND 6990508');
  new_def := replace(new_def, 'octet_length(clip) NOT BETWEEN 1 AND 524288',
                            'octet_length(clip) NOT BETWEEN 1 AND 5242880');
  ALTER TABLE dfc_private.domino_voice_notes
    DROP CONSTRAINT domino_voice_notes_audio_check;
  ALTER TABLE dfc_private.domino_voice_notes
    ADD CONSTRAINT domino_voice_notes_audio_check
    CHECK (octet_length(audio) BETWEEN 1 AND 5242880);
  EXECUTE new_def;
  IF position('6990508' IN pg_get_functiondef('public.dfc_domino_send_voice(bigint,uuid,text,text)'::regprocedure))=0
    OR position('5242880' IN pg_get_functiondef('public.dfc_domino_send_voice(bigint,uuid,text,text)'::regprocedure))=0 THEN
    RAISE EXCEPTION 'Voice RPC limits failed verification.';
  END IF;
END
$review$;
COMMIT;
-- Required staging tests: valid short and 300-second recordings on Android/iPhone;
-- payload limits, duplicate ID, reconnect retry, authorization, blocked/banned users.
-- Byte limit is not server-side duration validation. Never trust client duration metadata.
