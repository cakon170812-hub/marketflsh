create table dfc_private.points_table_topups (
  user_id uuid not null,
  request_id uuid not null,
  match_id uuid not null,
  amount_fc numeric(18,3) not null,
  receipt jsonb not null,
  primary key (user_id, request_id)
);
revoke all on dfc_private.points_table_topups from public, anon, authenticated;

create function public.dfc_points_add_table_balance(p_match_id uuid, p_request_id uuid, p_amount_fc numeric)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid:=auth.uid();
  game public.dfc_z37_points_matches%rowtype;
  prior dfc_private.points_table_topups%rowtype;
  active_seat uuid;
  personal_balance numeric;
  table_balance numeric;
  receipt jsonb;
begin
  if uid is null or p_match_id is null or p_request_id is null then
    raise exception 'Inicia sesión y selecciona tu mesa';
  end if;
  if p_amount_fc is null or p_amount_fc<=0 or p_amount_fc>10000
     or p_amount_fc<>round(p_amount_fc,3) then
    raise exception 'Introduce un importe válido en FlashCoin';
  end if;

  select * into game from public.dfc_z37_points_matches where id=p_match_id;
  if not found then raise exception 'Partida no disponible'; end if;
  perform pg_advisory_xact_lock(hashtextextended(game.config_id::text,37));
  select * into strict game from public.dfc_z37_points_matches where id=p_match_id for update;
  -- Serialize concurrent wallet operations before checking the request receipt.
  perform 1 from public.rf_profiles where id=uid for update;
  if not found then raise exception 'Tu saldo personal no está disponible'; end if;
  select * into prior from dfc_private.points_table_topups
  where user_id=uid and request_id=p_request_id;
  if found then
    if prior.match_id<>p_match_id or prior.amount_fc<>p_amount_fc then
      raise exception 'La solicitud corresponde a otra recarga';
    end if;
    return prior.receipt;
  end if;

  if game.state<>'playing' or game.engine_table_id is null or not exists(
    select 1 from public.dfc_z37_points_participants p
    where p.match_id=game.id and p.user_id=uid and p.charged
  ) then raise exception 'Tu partida ya no admite recargas'; end if;

  select s.id into active_seat from public.rf_domino_seats s
  where s.table_id=game.engine_table_id and s.user_id=uid and s.state='active' for update;
  if active_seat is null then raise exception 'Tu asiento ya no está activo'; end if;
  update public.rf_profiles set balance=balance-p_amount_fc,updated_at=now()
    where id=uid and balance>=p_amount_fc returning balance into personal_balance;
  if not found then raise exception 'Saldo personal de FlashCoin insuficiente'; end if;
  update public.rf_domino_seats s set table_balance=s.table_balance+p_amount_fc
    where s.id=active_seat returning s.table_balance into table_balance;
  perform public.rf_add_ledger(uid,-p_amount_fc,'DOMINO_RECARGA_MESA',
    'Transferencia de saldo personal a mesa '||game.engine_table_id,uid);
  receipt:=jsonb_build_object('ok',true,'amount_fc',p_amount_fc,'table_balance',table_balance,
    'wallet_fc',personal_balance);
  insert into dfc_private.points_table_topups(user_id,request_id,match_id,amount_fc,receipt)
    values(uid,p_request_id,p_match_id,p_amount_fc,receipt);
  return receipt;
end;
$$;
revoke all on function public.dfc_points_add_table_balance(uuid,uuid,numeric) from public, anon;
grant execute on function public.dfc_points_add_table_balance(uuid,uuid,numeric) to authenticated;

do $migration$
declare
  definition text:=pg_get_functiondef('public.dfc_z37_points_scoreboard(bigint)'::regprocedure);
  anchor constant text:=$anchor$  'replay_confirmed',exists$anchor$;
begin
  if (length(definition)-length(replace(definition,anchor,'')))<>length(anchor) then
    raise exception 'Unexpected Por puntos scoreboard definition';
  end if;
  execute replace(definition,anchor,$sql$  'my_table_funding',case when viewer.is_participant then (
    select jsonb_build_object('table_balance',s.table_balance,'wallet_fc',profile.balance,
      'missing_fc',greatest(0,c.min_pass_balance_fc-s.table_balance))
    from public.rf_domino_seats s
    join public.rf_profiles profile on profile.id=s.user_id
    where s.table_id=m.engine_table_id and s.user_id=auth.uid() and s.state='active'
  ) end,
  'replay_confirmed',exists$sql$);
end;
$migration$;
