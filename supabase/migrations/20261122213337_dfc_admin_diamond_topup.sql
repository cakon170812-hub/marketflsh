create or replace function public.dfc_z15_admin_diamonds_status()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  fund_balance numeric;
  personal_balance numeric;
begin
  if actor is null or not public.rf_is_leader(actor) then
    raise exception 'Solo Administrador Líder' using errcode = '42501';
  end if;

  select v.balance, coalesce(w.balance, 0)
  into strict fund_balance, personal_balance
  from public.dfc_z15_admin_diamond_vault v
  left join public.dfc_diamond_wallet_z9 w on w.user_id = actor
  where v.id = 1;

  return jsonb_build_object(
    'ok', true, 'balance', fund_balance, 'personal_balance', personal_balance,
    'history', coalesce((
      select jsonb_agg(to_jsonb(m) order by m.id desc)
      from (
        select l.id, l.event_key, l.delta, l.balance_after, l.movement_type, l.created_at
        from public.dfc_z15_admin_diamond_ledger l
        order by l.id desc limit 30
      ) m
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.dfc_z15_admin_recharge_diamonds(
  p_amount numeric, p_request_id uuid
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  event text;
  previous public.dfc_z15_admin_diamond_ledger%rowtype;
  personal_balance numeric;
  fund_balance numeric;
begin
  if actor is null or not public.rf_is_leader(actor) then
    raise exception 'Solo Administrador Líder' using errcode = '42501';
  end if;
  if p_request_id is null or p_amount is null or p_amount < 0.001
     or p_amount > 1000000 or round(p_amount, 3) <> p_amount then
    raise exception 'Cantidad o referencia inválida para la recarga' using errcode = '22023';
  end if;

  event := 'z15-admin-recharge:' || p_request_id::text;
  perform pg_advisory_xact_lock(hashtextextended(event, 0));
  select * into previous from public.dfc_z15_admin_diamond_ledger l where l.event_key = event;
  if found then
    if previous.actor_id is distinct from actor or previous.delta is distinct from p_amount
       or previous.movement_type <> 'RECARGA_ADMIN' then
      raise exception 'Referencia utilizada con otros datos' using errcode = '22023';
    end if;
    return jsonb_build_object('ok', true, 'reference', event, 'replayed', true);
  end if;

  -- Lock the personal wallet before the shared fund, as in administrative sends.
  select w.balance into personal_balance
  from public.dfc_diamond_wallet_z9 w where w.user_id = actor for update;
  if coalesce(personal_balance, 0) < p_amount then
    raise exception 'Diamantes personales insuficientes' using errcode = 'P0001';
  end if;
  if not public.dfc_z9_diamond_transfer(
    actor, null, p_amount, event, 'RECARGA_ADMIN', true,
    jsonb_build_object('request_id', p_request_id)
  ) then
    raise exception 'No se pudo registrar el débito de la recarga';
  end if;

  update public.dfc_z15_admin_diamond_vault v
  set balance = v.balance + p_amount, updated_at = clock_timestamp()
  where v.id = 1 returning v.balance into strict fund_balance;

  insert into public.dfc_z15_admin_diamond_ledger
    (event_key, delta, balance_after, movement_type, actor_id)
  values (event, p_amount, fund_balance, 'RECARGA_ADMIN', actor);

  return jsonb_build_object('ok', true, 'reference', event, 'replayed', false);
end;
$$;

revoke all on function public.dfc_z15_admin_diamonds_status() from public, anon;
grant execute on function public.dfc_z15_admin_diamonds_status() to authenticated;
revoke all on function public.dfc_z15_admin_recharge_diamonds(numeric, uuid) from public, anon;
grant execute on function public.dfc_z15_admin_recharge_diamonds(numeric, uuid) to authenticated;
