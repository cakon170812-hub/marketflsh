create or replace function public.dfc_z15_admin_send_diamonds_v2(
  p_public_id text, p_amount numeric, p_request_id uuid
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  recipient uuid;
  recipient_public_id text := trim(p_public_id);
  event text;
  previous public.dfc_z15_admin_diamond_ledger%rowtype;
  fund_balance numeric;
  recipient_balance numeric;
  recipient_peak numeric;
begin
  if actor is null or not public.rf_is_leader(actor) then
    raise exception 'Solo Administrador Líder' using errcode = '42501';
  end if;
  if p_request_id is null or recipient_public_id is null or recipient_public_id = ''
     or p_amount is null or p_amount < 0.001 or p_amount >= 'Infinity'::numeric
     or round(p_amount, 3) <> p_amount then
    raise exception 'ID, cantidad o referencia inválidos' using errcode = '22023';
  end if;

  select p.id into recipient from public.rf_profiles p where p.public_id = recipient_public_id;
  if recipient is null then
    raise exception 'Destinatario no encontrado' using errcode = '22023';
  end if;

  event := 'z15-admin-gift:' || p_request_id::text;
  perform pg_advisory_xact_lock(hashtextextended(event, 0));
  select * into previous from public.dfc_z15_admin_diamond_ledger l where l.event_key = event;
  if found then
    if previous.actor_id is distinct from actor or previous.target_id is distinct from recipient
       or previous.delta is distinct from -p_amount or previous.movement_type <> 'ENVIO_ADMIN' then
      raise exception 'Referencia utilizada con otros datos' using errcode = '22023';
    end if;
    return jsonb_build_object('ok', true, 'reference', event, 'recipient_public_id', recipient_public_id,
      'amount', p_amount, 'balance', previous.balance_after, 'replayed', true);
  end if;

  -- Lock the recipient wallet before the shared fund, as in the other diamond transfers.
  insert into public.dfc_diamond_wallet_z9(user_id) values (recipient) on conflict do nothing;
  select w.balance, w.high_water into strict recipient_balance, recipient_peak
    from public.dfc_diamond_wallet_z9 w where w.user_id = recipient for update;
  update public.dfc_z15_admin_diamond_vault v
    set balance = v.balance - p_amount, updated_at = clock_timestamp()
    where v.id = 1 and v.balance >= p_amount returning v.balance into fund_balance;
  if not found then
    raise exception 'Saldo administrativo insuficiente' using errcode = 'P0001';
  end if;

  recipient_balance := recipient_balance + p_amount;
  insert into public.dfc_diamond_moves_z9(event_key, sender, recipient, amount, category, details)
    values (event, null, recipient, p_amount, 'ADMIN_DIAMOND_SEND',
      jsonb_build_object('administrator', actor, 'request_id', p_request_id));
  update public.dfc_diamond_wallet_z9 w
    set balance = recipient_balance, high_water = greatest(w.high_water, recipient_balance),
        updated_at = clock_timestamp()
    where w.user_id = recipient;
  if recipient_balance > recipient_peak then
    perform public.dfc_z9_level_progress(recipient, recipient_balance - recipient_peak);
  end if;

  insert into public.dfc_z15_admin_diamond_ledger
    (event_key, delta, balance_after, movement_type, actor_id, target_id)
  values (event, -p_amount, fund_balance, 'ENVIO_ADMIN', actor, recipient);

  return jsonb_build_object('ok', true, 'reference', event, 'recipient_public_id', recipient_public_id,
    'amount', p_amount, 'balance', fund_balance, 'replayed', false);
end;
$$;

revoke all on function public.dfc_z15_admin_send_diamonds_v2(text, numeric, uuid) from public, anon;
grant execute on function public.dfc_z15_admin_send_diamonds_v2(text, numeric, uuid) to authenticated;
