SET LOCAL lock_timeout = '5s';
LOCK TABLE public.dfc_z31_gift_cards IN SHARE ROW EXCLUSIVE MODE;
CREATE OR REPLACE FUNCTION public.dfc_lab_gift_redeem_v008(p_gift_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_user uuid:=auth.uid(); v_card public.dfc_z31_gift_cards%rowtype;
 v_balance numeric; v_ref text;
begin
 if v_user is null then raise exception 'Debes iniciar sesión'; end if;
 select * into v_card from public.dfc_z31_gift_cards
 where id=p_gift_id and recipient_id=v_user for update;
 if not found then raise exception 'Tarjeta no encontrada'; end if;
 if v_card.redeemed_at is not null then
  return jsonb_build_object('ok',false,'gift_id',v_card.id,'already_redeemed',true);
 end if;
 if v_card.expires_at is not null and v_card.expires_at <= clock_timestamp() then
   update public.dfc_z31_gift_cards
   set expired_at=coalesce(expired_at,clock_timestamp()),
       expired_acknowledged_at=coalesce(expired_acknowledged_at,clock_timestamp())
   where id=v_card.id;
   return jsonb_build_object('ok',false,'gift_id',v_card.id,
    'expired',true,'message','Esta tarjeta FlashCoin ha vencido por caducidad.');
 end if;
 update public.rf_profiles set balance=balance+v_card.amount,updated_at=now()
 where id=v_user returning balance into v_balance;
 if not found then raise exception 'Perfil inexistente'; end if;
 update public.dfc_z31_gift_cards set redeemed_at=now() where id=v_card.id;
 v_ref:='DFC-Z31-CARD:'||v_card.id::text;
 insert into public.rf_wallet_ledger(user_id,delta,balance_after,movement_type,reference,created_by)
 values(v_user,v_card.amount,v_balance,'REGALO_TARJETA_FLASHCOIN',v_ref,
 (select administrator_id from public.dfc_z31_gift_campaigns where id=v_card.campaign_id));
 return jsonb_build_object('ok',true,'gift_id',v_card.id,'amount',v_card.amount,
 'balance_after',v_balance,'message','Tarjeta FlashCoin acreditada');
end $function$;
DO $migration$
DECLARE
  account record;
  card record;
  expected numeric;
  new_balance numeric;
BEGIN
  FOR account IN
    SELECT user_id, balance
    FROM dfc_private.points_card_wallet
    WHERE balance > 0
    ORDER BY user_id
    FOR UPDATE
  LOOP
    SELECT coalesce(sum(c.amount), 0) INTO expected
    FROM public.dfc_z31_gift_cards c
    WHERE c.recipient_id = account.user_id
      AND c.points_full_prize AND c.redeemed_at IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.rf_wallet_ledger l
        WHERE l.user_id = c.recipient_id AND l.reference = 'DFC-Z31-CARD:' || c.id
      );

    IF expected <> account.balance THEN
      RAISE EXCEPTION 'El saldo de tarjetas no coincide con los premios pendientes de conciliar';
    END IF;

    FOR card IN
      SELECT c.id, c.amount
      FROM public.dfc_z31_gift_cards c
      WHERE c.recipient_id = account.user_id
        AND c.points_full_prize AND c.redeemed_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.rf_wallet_ledger l
          WHERE l.user_id = c.recipient_id AND l.reference = 'DFC-Z31-CARD:' || c.id
        )
      ORDER BY c.redeemed_at, c.id
    LOOP
      UPDATE public.rf_profiles
      SET balance = balance + card.amount, updated_at = now()
      WHERE id = account.user_id
      RETURNING balance INTO STRICT new_balance;

      INSERT INTO public.rf_wallet_ledger(user_id, delta, balance_after, movement_type, reference)
      VALUES (account.user_id, card.amount, new_balance, 'REGALO_TARJETA_FLASHCOIN', 'DFC-Z31-CARD:' || card.id);
    END LOOP;

    UPDATE dfc_private.points_card_wallet SET balance = balance - expected
    WHERE user_id = account.user_id;
  END LOOP;
  IF EXISTS (
    SELECT 1 FROM public.dfc_z31_gift_cards c
    WHERE c.points_full_prize AND c.redeemed_at IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.rf_wallet_ledger l
        WHERE l.user_id = c.recipient_id AND l.reference = 'DFC-Z31-CARD:' || c.id
      )
  ) THEN
    RAISE EXCEPTION 'Hay premios reclamados pendientes de conciliar';
  END IF;
END $migration$;
