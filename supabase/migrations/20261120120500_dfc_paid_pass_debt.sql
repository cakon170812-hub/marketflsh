
alter table public.rf_profiles drop constraint rf_profiles_balance_check;
alter table public.rf_domino_seats drop constraint rf_domino_seats_table_balance_check;
alter table public.dfc_z37_points_configs
 add column pass_fee_fc numeric(18,3) not null default 0 check (pass_fee_fc>=0);

-- Only the internal pass debit and its settlement can create or increase debt.
create table dfc_private.flashcoin_pass_debit_context (
 transaction_id bigint primary key
);
revoke all on table dfc_private.flashcoin_pass_debit_context from public,anon,authenticated;
create function dfc_private.guard_flashcoin_debt() returns trigger language plpgsql security definer set search_path='' as $body$
declare previous numeric:=0; next_balance numeric;
begin
 if tg_table_name='rf_profiles' then
   next_balance:=new.balance;
   if tg_op='UPDATE' then previous:=old.balance; end if;
 else
   next_balance:=new.table_balance;
   if tg_op='UPDATE' then previous:=old.table_balance; end if;
 end if;
 if next_balance<least(previous,0) and
    not exists(select 1 from dfc_private.flashcoin_pass_debit_context where transaction_id=txid_current()) then
   raise exception 'Saldo FlashCoin insuficiente';
 end if;
 return new;
end $body$;
create trigger dfc_guard_flashcoin_wallet_debt before insert or update of balance on public.rf_profiles
 for each row execute function dfc_private.guard_flashcoin_debt();
create trigger dfc_guard_flashcoin_seat_debt before insert or update of table_balance on public.rf_domino_seats
 for each row execute function dfc_private.guard_flashcoin_debt();

create function dfc_private.debit_pass_seat(p_seat uuid,p_fee numeric) returns void
 language plpgsql set search_path='' as $body$
begin
 insert into dfc_private.flashcoin_pass_debit_context values(txid_current());
 update public.rf_domino_seats set table_balance=table_balance-p_fee where id=p_seat;
 delete from dfc_private.flashcoin_pass_debit_context where transaction_id=txid_current();
end $body$;
create function dfc_private.settle_pass_wallet(p_user uuid,p_delta numeric) returns void
 language plpgsql set search_path='' as $body$
begin
 insert into dfc_private.flashcoin_pass_debit_context values(txid_current());
 update public.rf_profiles set balance=balance+p_delta,updated_at=now() where id=p_user;
 delete from dfc_private.flashcoin_pass_debit_context where transaction_id=txid_current();
end $body$;
revoke all on function dfc_private.debit_pass_seat(uuid,numeric),dfc_private.settle_pass_wallet(uuid,numeric) from public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.rf_domino_pass_internal_v11(p_hand_id bigint, p_user uuid, p_auto boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

DECLARE

  v_hand public.rf_domino_hands;

  v_hp public.rf_domino_hand_players;

  v_cfg public.rf_domino_configs;

  v_seat public.rf_domino_seats;

  v_source_seat public.rf_domino_seats;

  v_fee numeric(18,3) := 0;

  v_paid numeric(18,3) := 0;

  v_source_user uuid;

  v_pass_count integer := 0;

  v_player_count integer := 0;

  v_next_user uuid;

  v_winner uuid;

  v_rec record;

  v_min_pips integer := 999999;

  v_pips integer;

  v_current_seat integer;



BEGIN

  SELECT dh.*

  INTO v_hand

  FROM public.rf_domino_hands dh

  WHERE
    dh.id = p_hand_id
    AND dh.status = 'playing'

  FOR UPDATE;


  IF NOT FOUND
     OR v_hand.turn_user_id <> p_user
  THEN
    RETURN;
  END IF;


  SELECT hp.*

  INTO v_hp

  FROM public.rf_domino_hand_players hp

  WHERE
    hp.hand_id = v_hand.id
    AND hp.user_id = p_user

  FOR UPDATE;


  IF NOT FOUND THEN
    RETURN;
  END IF;


  IF public.rf_domino_has_legal_v11(

    v_hp.tiles,

    v_hand.open_left,

    v_hand.open_right,

    jsonb_array_length(v_hand.board) = 0

  ) THEN

    RETURN;

  END IF;


  SELECT dc.*

  INTO v_cfg

  FROM public.rf_domino_tables dt

  JOIN public.rf_domino_configs dc

    ON dc.id = dt.config_id

  WHERE dt.id = v_hand.table_id;


  SELECT ds.*

  INTO v_seat

  FROM public.rf_domino_seats ds

  WHERE
    ds.table_id = v_hand.table_id
    AND ds.user_id = p_user

  FOR UPDATE;


  -- Penalizacion configurada
  -- para las modalidades aplicables.

  v_fee := GREATEST(
    COALESCE(v_cfg.pass_fee, 0),
    0
  );

  v_source_user := v_hand.last_play_user_id;


  IF v_fee > 0
     AND v_source_user IS NOT NULL
     AND v_source_user <> p_user

  THEN


    -- Comprobar destinatario existente.

    IF NOT EXISTS (

      SELECT 1

      FROM public.rf_domino_seats ds

      WHERE
        ds.table_id = v_hand.table_id
        AND ds.user_id = v_source_user

    )

    AND NOT EXISTS (

      SELECT 1

      FROM public.rf_domino_hand_players hp2

      WHERE
        hp2.hand_id = v_hand.id
        AND hp2.user_id = v_source_user

    )

    THEN

      RAISE EXCEPTION
        'Pase sin receptor valido, mano %',
        v_hand.id;

    END IF;


    v_paid := v_fee;


    IF v_paid > 0 THEN


      IF v_seat.id IS NOT NULL THEN

        perform dfc_private.debit_pass_seat(v_seat.id,v_paid);


      ELSE

        UPDATE public.rf_domino_hand_players hp

        SET detached_balance = hp.detached_balance - v_paid

        WHERE
          hp.hand_id = v_hand.id
          AND hp.user_id = p_user;

      END IF;


      SELECT ds.*

      INTO v_source_seat

      FROM public.rf_domino_seats ds

      WHERE
        ds.table_id = v_hand.table_id
        AND ds.user_id = v_source_user

      FOR UPDATE;


      IF v_source_seat.id IS NOT NULL THEN

        UPDATE public.rf_domino_seats ds

        SET table_balance =
          ds.table_balance + v_paid

        WHERE ds.id = v_source_seat.id;


      ELSE

        UPDATE public.rf_domino_hand_players hp

        SET detached_balance =
          hp.detached_balance + v_paid

        WHERE
          hp.hand_id = v_hand.id
          AND hp.user_id = v_source_user;

      END IF;

    END IF;

  END IF;


  INSERT INTO public.rf_domino_moves(

    hand_id,

    user_id,

    action,

    amount

  )

  VALUES (

    v_hand.id,

    p_user,

    CASE
      WHEN p_auto THEN 'AUTO_PASS'
      ELSE 'PASS'
    END,

    v_paid

  );


  v_current_seat := v_hp.seat_no;


  UPDATE public.rf_domino_hands dh

  SET consecutive_passes =
    dh.consecutive_passes + 1

  WHERE dh.id = v_hand.id

  RETURNING dh.consecutive_passes
  INTO v_pass_count;


  SELECT COUNT(*)

  INTO v_player_count

  FROM public.rf_domino_hand_players hp

  WHERE hp.hand_id = v_hand.id;


  IF v_pass_count >= v_player_count THEN
    IF EXISTS (
      SELECT 1 FROM public.dfc_z37_points_matches m
      WHERE m.engine_table_id=v_hand.table_id AND m.state='playing'
    ) THEN
      v_winner := public.dfc_z37_points_blocked_winner(v_hand.id);
      PERFORM public.rf_domino_settle_v11(v_hand.id,v_winner,'TRANQUE_MENOS_PUNTOS');
      RETURN;
    END IF;


    FOR v_rec IN

      SELECT
        hp.user_id,
        hp.tiles

      FROM public.rf_domino_hand_players hp

      WHERE hp.hand_id = v_hand.id

    LOOP

      v_pips :=
        public.rf_domino_tiles_pips_v11(
          v_rec.tiles
        );


      IF v_pips < v_min_pips THEN

        v_min_pips := v_pips;

        v_winner := v_rec.user_id;

      END IF;

    END LOOP;


    PERFORM public.rf_domino_settle_v11(

      v_hand.id,

      v_winner,

      'TRANQUE_MENOS_PUNTOS'

    );

    RETURN;

  END IF;


  v_next_user :=
    public.rf_domino_next_user_v11(
      v_hand.id,
      v_current_seat
    );


  UPDATE public.rf_domino_hands dh

  SET
    turn_user_id = v_next_user,

    turn_deadline =
      NOW() +
      MAKE_INTERVAL(
        secs => v_cfg.turn_seconds
      )

  WHERE dh.id = v_hand.id;

END

$function$;
revoke execute on function public.rf_domino_pass_internal_v11(bigint,uuid,boolean) from public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.rf_domino_return_seat_v11(p_seat_id uuid, p_reason text DEFAULT 'Salida de mesa'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare s public.rf_domino_seats;
begin
  select * into s from public.rf_domino_seats where id=p_seat_id for update;
  if not found then return; end if;
  if exists(select 1 from public.dfc_z37_points_matches where engine_table_id=s.table_id and state='playing') then
    return;
  end if;
  if s.table_balance<>0 then
    perform dfc_private.settle_pass_wallet(s.user_id,s.table_balance);
    perform public.rf_add_ledger(s.user_id,s.table_balance,case when s.table_balance<0 then 'DOMINO_DEUDA_PASE' else 'DOMINO_RETIRO_MESA' end,p_reason,auth.uid());
  end if;
  delete from public.rf_domino_seats where id=s.id;
end $function$;
revoke execute on function public.rf_domino_return_seat_v11(uuid,text) from public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.dfc_z37_trial_keep_seat()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare waiting_match uuid;
begin
 if tg_op='UPDATE' and new.state='active' then return new; end if;
 select m.id into waiting_match from public.dfc_z37_points_matches m
 where m.engine_table_id=old.table_id and m.state='waiting' for update;
 if found then
   delete from public.dfc_z37_points_participants where match_id=waiting_match and user_id=old.user_id;
 end if;
 if not exists (
  select 1 from public.dfc_z37_points_matches m join public.dfc_z37_points_participants p on p.match_id=m.id
  where m.engine_table_id=old.table_id and m.state='playing'
    and p.user_id=old.user_id
 ) then
   if tg_op='DELETE' then return old; end if;
   return new;
 end if;
 update public.dfc_z37_points_participants p set absent_at=coalesce(p.absent_at,clock_timestamp())
 from public.dfc_z37_points_matches m
 where m.id=p.match_id and m.engine_table_id=old.table_id and p.user_id=old.user_id;
 if tg_op='DELETE' then return null; end if;
 new.state:='active';
 new.is_ready:=true;
 return new;
end $function$;
CREATE OR REPLACE FUNCTION public.rf_domino_exit_now_v11(p_table_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  uid uuid:=auth.uid();
  s public.rf_domino_seats;
  h_id bigint;
begin
  if uid is null then
    raise exception 'Sesión requerida';
  end if;

  perform pg_advisory_xact_lock(1243000000::bigint+p_table_id);

  select ds.*
  into s
  from public.rf_domino_seats ds
  where ds.table_id=p_table_id
    and ds.user_id=uid
  for update;

  if not found then
    return;
  end if;

  update public.dfc_z37_points_participants p
  set absent_at=coalesce(p.absent_at,clock_timestamp())
  from public.dfc_z37_points_matches m
  where m.id=p.match_id and m.engine_table_id=p_table_id and m.state='playing' and p.user_id=uid;
  if found then return; end if;

  select dh.id
  into h_id
  from public.rf_domino_hands dh
  where dh.table_id=p_table_id
    and dh.status in ('shuffling','playing')
    and exists(
      select 1
      from public.rf_domino_hand_players hp
      where hp.hand_id=dh.id
        and hp.user_id=uid
    )
  order by dh.id desc
  limit 1;

  if h_id is null then
    perform public.rf_domino_return_seat_v11(
      s.id,
      'Salida inmediata de mesa'
    );
    return;
  end if;

  update public.rf_domino_hand_players hp
  set left_table=true,
      exit_forfeit_prize=false,
      detached_balance=round(coalesce(hp.detached_balance,0)+s.table_balance,3)
  where hp.hand_id=h_id
    and hp.user_id=uid;

  -- El asiento queda disponible inmediatamente para otro usuario.
  delete from public.rf_domino_seats
  where id=s.id;
end
$function$;
CREATE OR REPLACE FUNCTION public.rf_domino_settle_v11(p_hand_id bigint, p_winner uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_hand public.rf_domino_hands;
  v_cfg public.rf_domino_configs;
  v_win_seat integer;
  v_player_count integer;
  v_prize numeric(18,3);
  v_share numeric(18,3);
  v_rec record;
  v_partner_seat integer;
  v_credit numeric(18,3);
  v_balance_after numeric(18,3);
begin
  IF EXISTS(SELECT 1 FROM public.rf_domino_hands h
    JOIN public.rf_domino_012n_matches m ON m.table_id=h.table_id AND m.status='active'
    WHERE h.id=p_hand_id) THEN
    PERFORM public.rf_domino_012n_settle_points(p_hand_id,p_winner,p_reason);
    RETURN;
  END IF;
  select dh.*
  into v_hand
  from public.rf_domino_hands dh
  where dh.id=p_hand_id
    and dh.status<>'settled'
  for update;

  if not found then
    return;
  end if;

  select dc.*
  into v_cfg
  from public.rf_domino_tables dt
  join public.rf_domino_configs dc on dc.id=dt.config_id
  where dt.id=v_hand.table_id;

  select hp.seat_no
  into v_win_seat
  from public.rf_domino_hand_players hp
  where hp.hand_id=v_hand.id
    and hp.user_id=p_winner;

  select count(*)
  into v_player_count
  from public.rf_domino_hand_players hp
  where hp.hand_id=v_hand.id;

  v_prize:=round(greatest(v_hand.pot-v_hand.commission,0),3);

  if v_player_count=4 then
    v_partner_seat:=case
      v_win_seat
      when 1 then 3
      when 3 then 1
      when 2 then 4
      else 2
    end;
    v_share:=round(v_prize/2,3);

    for v_rec in
      select hp.user_id,hp.seat_no,hp.left_table
      from public.rf_domino_hand_players hp
      where hp.hand_id=v_hand.id
        and hp.seat_no in (v_win_seat,v_partner_seat)
    loop
      if v_rec.left_table or not exists(
        select 1
        from public.rf_domino_seats ds
        where ds.table_id=v_hand.table_id
          and ds.user_id=v_rec.user_id
      ) then
        update public.rf_profiles p
        set balance=p.balance+v_share,
            updated_at=now()
        where p.id=v_rec.user_id
        returning p.balance into v_balance_after;

        perform public.rf_add_ledger(
          v_rec.user_id,
          v_share,
          'DOMINO_PREMIO',
          'Premio de Dominó acreditado fuera de la mesa · Mano '||v_hand.id,
          auth.uid()
        );
      else
        update public.rf_domino_seats ds
        set table_balance=ds.table_balance+v_share
        where ds.table_id=v_hand.table_id
          and ds.user_id=v_rec.user_id;
      end if;
    end loop;

    -- Redondeo de 0.001, si existiera, queda para el ganador principal.
    if v_share*2<v_prize then
      v_credit:=v_prize-v_share*2;
      if exists(
        select 1 from public.rf_domino_seats ds
        where ds.table_id=v_hand.table_id and ds.user_id=p_winner
      ) then
        update public.rf_domino_seats
        set table_balance=table_balance+v_credit
        where table_id=v_hand.table_id and user_id=p_winner;
      else
        update public.rf_profiles
        set balance=balance+v_credit,updated_at=now()
        where id=p_winner;
        perform public.rf_add_ledger(
          p_winner,v_credit,'DOMINO_PREMIO',
          'Ajuste de premio Dominó · Mano '||v_hand.id,auth.uid()
        );
      end if;
    end if;
  else
    if exists(
      select 1
      from public.rf_domino_seats ds
      where ds.table_id=v_hand.table_id
        and ds.user_id=p_winner
    ) then
      update public.rf_domino_seats ds
      set table_balance=ds.table_balance+v_prize
      where ds.table_id=v_hand.table_id
        and ds.user_id=p_winner;
    else
      update public.rf_profiles p
      set balance=p.balance+v_prize,
          updated_at=now()
      where p.id=p_winner
      returning p.balance into v_balance_after;

      perform public.rf_add_ledger(
        p_winner,
        v_prize,
        'DOMINO_PREMIO',
        'Premio de Dominó acreditado fuera de la mesa · Mano '||v_hand.id,
        auth.uid()
      );
    end if;
  end if;

  -- Devuelve el saldo de mesa en custodia a todo jugador que salió,
  -- gane o pierda. El premio se maneja arriba por separado.
  for v_rec in
    select hp.user_id,hp.detached_balance
    from public.rf_domino_hand_players hp
    where hp.hand_id=v_hand.id
      and hp.left_table=true
      and hp.detached_balance<>0
  loop
    perform dfc_private.settle_pass_wallet(v_rec.user_id,v_rec.detached_balance);

    perform public.rf_add_ledger(
      v_rec.user_id,
      v_rec.detached_balance,
      case when v_rec.detached_balance<0 then 'DOMINO_DEUDA_PASE' else 'DOMINO_RETIRO_MESA' end,
      'Saldo liquidado al finalizar mano · Mano '||v_hand.id,
      auth.uid()
    );

    update public.rf_domino_hand_players hp
    set detached_balance=0
    where hp.hand_id=v_hand.id
      and hp.user_id=v_rec.user_id;
  end loop;

  update public.rf_domino_hands dh
  set status='settled',
      winner_user_id=p_winner,
      winner_reason=p_reason,
      settled_at=now(),
      turn_user_id=null,
      turn_deadline=null
  where dh.id=v_hand.id;

  insert into public.rf_domino_moves(hand_id,user_id,action,amount)
  values(v_hand.id,p_winner,'WIN',v_prize);

  -- Atrás/Dejar la mano conserva su semántica anterior:
  -- sale al lobby y devuelve saldo al finalizar la mano.
  for v_rec in
    select ds.id
    from public.rf_domino_seats ds
    where ds.table_id=v_hand.table_id
      and (ds.state='leave_after_hand' or (
        ds.table_balance<0 and not exists(
          select 1 from public.dfc_z37_points_matches m
          where m.engine_table_id=v_hand.table_id and m.state='playing'
        )
      ))
  loop
    perform public.rf_domino_return_seat_v11(
      v_rec.id,
      'Salida después de mano de dominó'
    );
  end loop;
end
$function$;
CREATE OR REPLACE FUNCTION public.dfc_z37_admin_save_points(p_input jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_enabled boolean;
 v_pass_fee numeric:=(p_input->>'pass_fee_fc')::numeric;
 v_id uuid; v_name text; v_players smallint; v_target int;
 v_fc numeric; v_diamonds bigint; v_limit bigint; v_pct numeric;
begin
 if (select auth.uid()) is null or not public.dfc_z37_is_admin() then raise exception 'Acceso no autorizado'; end if;
 v_enabled=(p_input->>'enabled')::boolean;
 v_name=trim(p_input->>'name');
 v_players=(p_input->>'players')::smallint;
 v_target=(p_input->>'target_points')::int;
 v_fc=(p_input->>'entry_fc')::numeric;
 v_diamonds=(p_input->>'entry_diamonds')::bigint;
 v_limit=0;
 v_pct=(p_input->>'admin_pct')::numeric;
 if v_name is null or v_players is null or v_target is null or v_fc is null or
    v_diamonds is null or v_limit is null or v_pct is null or
    length(v_name) not between 1 and 160 or v_players not between 2 and 4 or v_target<1 or
    (v_pass_fee is not null and (v_pass_fee<0 or v_pass_fee>999999 or round(v_pass_fee,3)<>v_pass_fee)) or
    v_fc<0 or v_diamonds<0 or v_limit<0 or v_pct not between 0 and 50 then
    raise exception 'Configuración inválida';
 end if;
 if p_input ? 'id' and p_input->>'id' is not null then
  v_id=(p_input->>'id')::uuid;
  update public.dfc_z37_points_configs
  set pass_fee_fc=coalesce(v_pass_fee,pass_fee_fc),bots_allowed=coalesce((p_input->>'bots_allowed')::boolean,bots_allowed),name=v_name,players=v_players,target_points=v_target,entry_fc=v_fc,
      entry_diamonds=v_diamonds,max_negative_diamonds=v_limit,admin_pct=v_pct,diamond_admin_pct=coalesce((p_input->>'diamond_admin_pct')::numeric,diamond_admin_pct),
      enabled=coalesce(v_enabled,enabled),updated_at=now()
  where id=v_id;
  if not found then raise exception 'Mesa por puntos no encontrada'; end if;
 else
  insert into public.dfc_z37_points_configs(pass_fee_fc,bots_allowed,name,players,target_points,entry_fc,entry_diamonds,max_negative_diamonds,admin_pct,diamond_admin_pct,enabled)
  values(coalesce(v_pass_fee,0),coalesce((p_input->>'bots_allowed')::boolean,false),v_name,v_players,v_target,v_fc,v_diamonds,v_limit,v_pct,coalesce((p_input->>'diamond_admin_pct')::numeric,v_pct),coalesce(v_enabled,false)) returning id into v_id;
 end if;
 return v_id;
end;
$function$;

-- Apply the saved pass fee once the match starts, including a rematch on the same board.
create function dfc_private.set_points_pass_fee() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.rf_domino_configs engine
 set pass_fee=cfg.pass_fee_fc
 from public.rf_domino_tables board,public.dfc_z37_points_configs cfg
 where board.id=new.engine_table_id and board.config_id=engine.id and cfg.id=new.config_id;
 return new;
end $$;
revoke all on function dfc_private.set_points_pass_fee() from public,anon,authenticated;
create trigger dfc_points_pass_fee_at_start
 before update of state on public.dfc_z37_points_matches for each row
 when (old.state is distinct from new.state and new.state='playing')
 execute function dfc_private.set_points_pass_fee();
CREATE OR REPLACE FUNCTION public.dfc_z37_points_scoreboard(p_table_id bigint)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select jsonb_build_object(
  'my_prize',(select jsonb_build_object('id',g.id,'amount',g.amount,'redeemed',g.redeemed_at is not null) from public.dfc_z31_gift_cards g where g.points_match_id=m.id and g.recipient_id=auth.uid() and g.points_full_prize),
  'entry_fc',m.entry_fc,'entry_diamonds',m.entry_diamonds,'starts_at',m.starts_at,'match_id',m.id,'target',m.target_points,'state',m.state,'winner_team',m.winner_team,
  'replay_seat_released',m.state='settled' and not exists(
     select 1 from public.rf_domino_seats s where s.table_id=m.engine_table_id and s.user_id=auth.uid() and s.state='active'
  ),
  'replay_fc_missing',case when m.state='settled' and m.entry_fc>0
    then greatest(0,m.entry_fc-coalesce((select u.balance from public.rf_profiles u where u.id=auth.uid()),0)) else 0 end,
  'live_pot_fc',coalesce((select sum(r.amount) from public.dfc_z37_points_fc_reserves r where r.match_id=m.id and r.status='reserved'),0),
  'live_pot_diamonds',coalesce((select sum(r.amount) from public.dfc_z37_points_diamond_reserves r where r.match_id=m.id and r.state='reserved'),0),
  'pot_fc',coalesce((select sum(p.fc_principal+p.fc_profit) from public.dfc_z37_points_payouts p where p.match_id=m.id),0),
  'pot_diamonds',coalesce((select sum(p.diamond_principal+p.diamond_profit) from public.dfc_z37_points_payouts p where p.match_id=m.id),0),
  'replay_opens',case when m.state='settled' and (m.replay_v2 or m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') then m.settled_at+interval '3 seconds' end,
  'replay_deadline',case when m.state='settled' and (m.replay_v2 or m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200') then m.settled_at+interval '13 seconds' end,
  'server_time',statement_timestamp(),
  'replay_confirmed',exists(select 1 from public.dfc_z37_points_participants p where p.match_id=m.id and p.user_id=auth.uid() and p.replay_confirmed_at is not null),
  'players',coalesce((
    select jsonb_agg(jsonb_build_object('seat',p.seat_number,'team',p.team,
      'points',case when m.players=4 then case p.team when 1 then m.team_a_points else m.team_b_points end else p.points_individual end,'mine',p.user_id=auth.uid(),
      'name',coalesce(nullif(trim(concat_ws(' ',u.first_name,u.last_name)),''),'Jugador '||p.seat_number))
      order by p.seat_number)
    from public.dfc_z37_points_participants p left join public.rf_profiles u on u.id=p.user_id
    where p.match_id=m.id
  ),'[]'::jsonb),
  'last_hand',(
    select jsonb_build_object('id',h.id::text,'points',e.points,'kind',e.event_type,
      'seat',winner.seat_number,'deciding_tile',(
         select mv.tile from public.rf_domino_moves mv where mv.hand_id=h.id and mv.action in ('PLAY','AUTO_PLAY')
         order by mv.id desc limit 1
      ),'remaining',coalesce((
         select jsonb_agg(jsonb_build_object('seat',p.seat_number,'tiles',hp.tiles,
            'points',public.rf_domino_tiles_pips_v11(hp.tiles)) order by p.seat_number)
         from public.rf_domino_hand_players hp
         join public.dfc_z37_points_participants p on p.match_id=m.id and p.user_id=hp.user_id
         where hp.hand_id=h.id
      ),'[]'::jsonb))
    from public.dfc_z37_points_events e join public.rf_domino_hands h on h.id=e.engine_hand_id and h.status='settled'
    join public.dfc_z37_points_participants winner on winner.match_id=m.id and winner.user_id=e.user_id
    where e.match_id=m.id order by h.id desc limit 1
  ))
 from public.dfc_z37_points_matches m
 where m.engine_table_id=p_table_id and m.state in ('waiting','playing','settled')
 and auth.uid() is not null and exists (
   select 1 from public.dfc_z37_points_participants p where p.match_id=m.id and p.user_id=auth.uid()
 );
$function$;

drop function public.dfc_z37_public_points();
CREATE OR REPLACE FUNCTION public.dfc_z37_public_points()
 RETURNS TABLE(id uuid, name text, players smallint, target_points integer, entry_fc numeric, entry_diamonds bigint, admin_pct numeric, pass_fee_fc numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select c.id,c.name,c.players,c.target_points,c.entry_fc,c.entry_diamonds,c.admin_pct,c.pass_fee_fc
 from public.dfc_z37_points_configs c where c.enabled=true order by c.created_at desc limit 100
$function$;
revoke all on function public.dfc_z37_public_points() from public;
grant execute on function public.dfc_z37_public_points() to anon,authenticated,service_role;
