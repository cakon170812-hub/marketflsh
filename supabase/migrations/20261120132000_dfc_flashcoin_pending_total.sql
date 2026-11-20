create function public.dfc_flashcoin_pending_total() returns jsonb
language sql stable security definer set search_path='' as $balance$
 select jsonb_build_object('total',coalesce(sum(c.amount),0),
   'next_expiry',min(c.expires_at),'server_time',statement_timestamp())
 from public.dfc_z31_gift_cards c
 where c.recipient_id=auth.uid()
   and c.redeemed_at is null
   and c.expired_at is null
   and c.expired_acknowledged_at is null
   and (c.expires_at is null or c.expires_at>statement_timestamp());
$balance$;
revoke all on function public.dfc_flashcoin_pending_total() from public,anon;
grant execute on function public.dfc_flashcoin_pending_total() to authenticated;
