
CREATE OR REPLACE FUNCTION dfc_private.points_require_entry_funds(
 p_user uuid,p_fc numeric,p_diamonds numeric
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE wallet_fc numeric; wallet_diamonds numeric; missing_fc numeric:=0; missing_diamonds numeric:=0;
BEGIN
 IF p_fc>0 THEN
  SELECT p.balance INTO wallet_fc FROM public.rf_profiles p WHERE p.id=p_user FOR UPDATE;
  missing_fc:=greatest(0,p_fc-coalesce(wallet_fc,0));
 END IF;
 IF p_diamonds>0 THEN
  SELECT d.balance INTO wallet_diamonds FROM public.dfc_diamond_wallet_z9 d WHERE d.user_id=p_user FOR UPDATE;
  missing_diamonds:=greatest(0,p_diamonds-coalesce(wallet_diamonds,0));
 END IF;
 IF missing_fc>0 OR missing_diamonds>0 THEN
  RAISE EXCEPTION USING
   ERRCODE='DF004',
   MESSAGE='Saldo insuficiente para sentarte. Te faltan '||concat_ws(' y ',
     CASE WHEN missing_fc>0 THEN replace(trim_scale(missing_fc)::text,'.',',')||' FC' END,
     CASE WHEN missing_diamonds>0 THEN replace(trim_scale(missing_diamonds)::text,'.',',')||
       CASE WHEN missing_diamonds=1 THEN ' diamante' ELSE ' diamantes' END END)||'.',
   DETAIL=jsonb_build_object('missing_fc',missing_fc,'missing_diamonds',missing_diamonds)::text;
 END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION dfc_private.points_check_funds_before_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE game public.dfc_z37_points_matches%rowtype;
BEGIN
 IF EXISTS (SELECT 1 FROM public.rf_domino_bot_instances_v18 b WHERE b.user_id=NEW.user_id) THEN
  RETURN NEW;
 END IF;
 SELECT * INTO STRICT game FROM public.dfc_z37_points_matches WHERE id=NEW.match_id FOR UPDATE;
 PERFORM dfc_private.points_require_entry_funds(NEW.user_id,game.entry_fc,game.entry_diamonds);
 RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION dfc_private.points_require_confirmed_reservations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE game public.dfc_z37_points_matches%rowtype; fc numeric; diamonds numeric;
BEGIN
 SELECT * INTO STRICT game FROM public.dfc_z37_points_matches WHERE id=NEW.match_id FOR UPDATE;
 SELECT f.amount INTO fc FROM public.dfc_z37_points_fc_reserves f
 WHERE f.match_id=NEW.match_id AND f.user_id=NEW.user_id AND f.status='reserved';
 SELECT d.amount INTO diamonds FROM public.dfc_z37_points_diamond_reserves d
 WHERE d.match_id=NEW.match_id AND d.user_id=NEW.user_id AND d.state='reserved';
 IF fc IS DISTINCT FROM (CASE WHEN game.entry_fc>0 THEN game.entry_fc END)
 OR diamonds IS DISTINCT FROM (CASE WHEN game.entry_diamonds>0 THEN game.entry_diamonds END) THEN
  RAISE EXCEPTION 'No se pudo confirmar el aporte completo. Vuelve a intentar.';
 END IF;
 RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION dfc_private.points_require_entry_funds(uuid,numeric,numeric),
 dfc_private.points_check_funds_before_confirmation(),
 dfc_private.points_require_confirmed_reservations()
FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER dfc_z37_check_funds_before_confirmation
BEFORE INSERT ON public.dfc_z37_points_participants FOR EACH ROW WHEN (NEW.charged)
EXECUTE FUNCTION dfc_private.points_check_funds_before_confirmation();

-- PostgreSQL runs triggers of the same kind in name order, after both reserves here.
CREATE OR REPLACE TRIGGER dfc_z37_verify_reservations_after_confirmation
AFTER INSERT ON public.dfc_z37_points_participants FOR EACH ROW WHEN (NEW.charged)
EXECUTE FUNCTION dfc_private.points_require_confirmed_reservations();

CREATE OR REPLACE FUNCTION public.dfc_z37_points_reserve_diamonds()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare game public.dfc_z37_points_matches%rowtype; ref text:='points-diamond:'||gen_random_uuid();
begin
 select * into strict game from public.dfc_z37_points_matches where id=new.match_id for update;
 if game.entry_diamonds=0 or not new.charged then return new; end if;
 if game.state<>'waiting' then raise exception 'Mesa de diamantes no disponible'; end if;
 insert into public.dfc_z37_points_diamond_reserves values(game.id,new.user_id,game.entry_diamonds,ref,'reserved')
 on conflict(match_id,user_id) do update set amount=excluded.amount,debit_key=excluded.debit_key,state='reserved'
 where dfc_z37_points_diamond_reserves.state='refunded';
 if not found then raise exception 'El aporte de diamantes ya está registrado'; end if;
 if exists(select 1 from public.rf_domino_bot_instances_v18 where user_id=new.user_id) then perform dfc_private.points_bot_diamonds(-game.entry_diamonds,new.user_id,ref); return new; end if;
 if not public.dfc_z9_diamond_transfer(new.user_id,null,game.entry_diamonds,ref,'DOMINO_PUNTOS_APORTE',true,jsonb_build_object('match_id',game.id)) then
  raise exception 'Aporte de diamantes duplicado';
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION dfc_private.join_points_at_terms(p_config uuid, p_request uuid, p_terms jsonb, p_table bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 uid uuid:=auth.uid();
 cfg public.dfc_z37_points_configs%rowtype;
 game public.dfc_z37_points_matches%rowtype;
 previous_match uuid;
 table_key bigint;
 seat_number smallint;
 seated integer;
 bot_seat uuid;
 pass_balance numeric;
begin
 if uid is null or p_request is null then raise exception 'Inicia sesión para sentarte'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,38));
 perform pg_advisory_xact_lock(hashtextextended(p_config::text,37));
 select match_id into previous_match from public.dfc_z37_paid_entry_requests
 where user_id=uid and request_id=p_request;
 select m.* into game from public.dfc_z37_points_matches m
 join public.dfc_z37_points_participants p on p.match_id=m.id and p.user_id=uid
 join public.rf_domino_seats s on s.table_id=m.engine_table_id and s.user_id=uid and s.state='active'
 where m.config_id=p_config and m.state in ('waiting','playing','settled')
 and (previous_match is null or m.id=previous_match)
 order by m.created_at desc limit 1 for update of m;
 if found then
   insert into public.dfc_z37_paid_entry_requests values(uid,p_request,game.id) on conflict do nothing;
   return jsonb_build_object('state',game.state,'table_id',game.engine_table_id);
 end if;
 if previous_match is not null then
   raise exception using errcode='DF005',message='Esta confirmación ya fue usada. Vuelve a seleccionar la mesa.';
 end if;
 if exists(select 1 from public.rf_domino_seats where user_id=uid) then
   raise exception 'Sal de tu mesa actual antes de sentarte';
 end if;
 select * into cfg from public.dfc_z37_points_configs where id=p_config and enabled and players between 2 and 4
 and id<>'b3abde40-ea42-4a52-ab24-0ce93c090200' for share;
 if not found then raise exception 'Mesa por puntos no disponible'; end if;
 select m.* into game from public.dfc_z37_points_matches m
 where m.config_id=cfg.id and dfc_private.points_waiting_board_eligible(m,cfg)
   and dfc_private.points_board_can_join(m)
   and (p_table is null or m.engine_table_id=p_table)
 order by exists(select 1 from public.dfc_z37_points_participants p where p.match_id=m.id) desc,
          m.created_at,m.id
 limit 1 for update;
 if not found and p_table is not null then
   raise exception using errcode='DF002',message='Este tablero cambió o ya no admite asientos. Revisa el catálogo.';
 end if;
 if not found then
   insert into public.dfc_z37_points_matches(config_id,players,target_points,entry_fc,entry_diamonds,admin_pct,diamond_admin_pct)
   values(cfg.id,cfg.players,cfg.target_points,cfg.entry_fc,cfg.entry_diamonds,cfg.admin_pct,cfg.diamond_admin_pct)
   returning * into game;
 end if;
 if dfc_private.points_terms(coalesce(game.players,cfg.players),
   coalesce(game.target_points,cfg.target_points),coalesce(game.entry_fc,cfg.entry_fc),coalesce(game.entry_diamonds,cfg.entry_diamonds),
   coalesce(game.admin_pct,cfg.admin_pct),coalesce(game.diamond_admin_pct,cfg.diamond_admin_pct),coalesce(game.pass_fee_fc,cfg.pass_fee_fc)) is distinct from p_terms then
   raise exception using errcode='DF001',message='Cambiaron las condiciones. Revísalas y confirma de nuevo.';
 end if;
 if game.pass_fee_fc is null then
   update public.dfc_z37_points_matches set pass_fee_fc=cfg.pass_fee_fc where id=game.id;
 end if;
 table_key:=public.dfc_z37_prepare_points_table_internal(game.id);
 select n into seat_number from generate_series(1,game.players) n where not exists(
   select 1 from public.rf_domino_seats where table_id=table_key and seat_no=n
 ) order by n limit 1;
 if seat_number is null and game.players in (3,4) then
   select s.id,s.seat_no into bot_seat,seat_number
   from public.rf_domino_seats s
   join public.rf_domino_bot_instances_v18 b on b.table_id=s.table_id and b.user_id=s.user_id
   where s.table_id=table_key and s.state='active'
   order by s.seat_no desc limit 1 for update of s;
   if found then
     perform public.rf_domino_return_seat_v11(bot_seat,'Prioridad de asiento para jugador en Por puntos');
   end if;
 end if;
 if seat_number is null then raise exception 'La mesa está llena'; end if;
 select coalesce((select amount from dfc_private.points_join_funds_context
                  where transaction_id=txid_current() and user_id=uid),0)
 into pass_balance;
 if pass_balance<cfg.min_pass_balance_fc then
   raise exception 'Debes reservar por lo menos % FC para pagar pases',cfg.min_pass_balance_fc;
 end if;
 if pass_balance>0 then
   perform dfc_private.points_require_entry_funds(uid,game.entry_fc+pass_balance,game.entry_diamonds);
 end if;
 insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready)
 values(table_key,uid,seat_number,0,'active',true);
 -- A confirmed user's chosen pass fund is transferred exactly once here,
 -- before the point-match participant/reservation triggers can start play.
 if pass_balance>0 then
   update public.rf_profiles p set balance=p.balance-pass_balance,updated_at=now()
   where p.id=uid and p.balance>=pass_balance;
   if not found then raise exception 'FlashCoin insuficiente para saldo de pases'; end if;
   update public.rf_domino_seats s set table_balance=s.table_balance+pass_balance
   where s.table_id=table_key and s.user_id=uid;
   perform public.rf_add_ledger(uid,-pass_balance,
      'DOMINO_PUNTOS_SALDO_PASES','Mesa por puntos '||table_key,uid);
 end if;
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged)
 values(game.id,uid,seat_number,1,true);
 insert into public.dfc_z37_paid_entry_requests values(uid,p_request,game.id);
 select count(*) into seated from public.dfc_z37_points_participants where match_id=game.id;
 if seated>=2 then
   update public.dfc_z37_points_matches
   set starts_at=dfc_private.points_start_time(table_key,game.players,seated,starts_at)
   where id=game.id;
   perform dfc_private.start_waiting_points_match(cfg.id,table_key);
   select * into strict game from public.dfc_z37_points_matches where id=game.id;
 end if;
 return jsonb_build_object('state',game.state,'table_id',table_key);
end;
$function$;

CREATE OR REPLACE FUNCTION public.dfc_points_replay_choice_with_balance(p_match_id uuid, p_choice text, p_terms jsonb, p_add_fc numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 uid uuid:=auth.uid();
 game public.dfc_z37_points_matches%rowtype;
 cfg public.dfc_z37_points_configs%rowtype;
 seat public.rf_domino_seats%rowtype;
 current_terms jsonb;
 minimum numeric;
 missing numeric;
 wallet numeric;
 entry numeric;
 total numeric;
 shortage_details text;
BEGIN
 IF uid IS NULL OR p_choice NOT IN ('check','confirm','exit','timeout') THEN
   RAISE EXCEPTION 'Selección de revancha inválida';
 END IF;
 IF p_choice='confirm' AND (p_add_fc IS NULL OR p_add_fc<0 OR p_add_fc>10000
                            OR round(p_add_fc,3)<>p_add_fc) THEN
   RAISE EXCEPTION 'Importe de recarga inválido';
 END IF;
 SELECT * INTO game FROM public.dfc_z37_points_matches WHERE id=p_match_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Partida no disponible'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(game.config_id::text,37));
 SELECT * INTO STRICT game FROM public.dfc_z37_points_matches WHERE id=p_match_id FOR UPDATE;
 IF game.state<>'settled' OR NOT EXISTS(
    SELECT 1 FROM public.dfc_z37_points_participants WHERE match_id=game.id AND user_id=uid
 ) THEN RAISE EXCEPTION 'La revancha no está disponible'; END IF;
 IF EXISTS(SELECT 1 FROM public.dfc_z37_points_participants
           WHERE match_id=game.id AND user_id=uid AND replay_confirmed_at IS NOT NULL) THEN
   RETURN jsonb_build_object('state','confirmed');
 END IF;
 -- Lock profile before seat, consistent with the first-join and cash-transfer flows.
 SELECT balance INTO wallet FROM public.rf_profiles WHERE id=uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Perfil sin cartera de FlashCoin'; END IF;
 SELECT * INTO seat FROM public.rf_domino_seats
 WHERE table_id=game.engine_table_id AND user_id=uid AND state='active' FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('state','left'); END IF;
 IF p_choice='exit' OR (p_choice='timeout' AND clock_timestamp()>=game.settled_at+interval '13 seconds') THEN
   PERFORM public.rf_domino_return_seat_v11(seat.id,'Salida de la revancha Por puntos');
   RETURN jsonb_build_object('state','left');
 END IF;
 IF p_choice='timeout' THEN RETURN jsonb_build_object('state','pending'); END IF;
 SELECT * INTO STRICT cfg FROM public.dfc_z37_points_configs WHERE id=game.config_id FOR SHARE;
 current_terms:=dfc_private.points_replay_terms(game,cfg);
 IF NOT cfg.enabled OR (current_terms->>'players')::integer<>game.players THEN
   IF p_choice='confirm' THEN RAISE EXCEPTION 'La revancha está cerrada. Regresa a Mesas por puntos.'; END IF;
   RETURN jsonb_build_object('state','pending');
 END IF;
 IF current_terms IS DISTINCT FROM p_terms THEN
   IF p_choice='confirm' THEN
     RAISE EXCEPTION USING errcode='DF001',message='Cambiaron las condiciones. Revísalas y confirma de nuevo.';
   END IF;
   RETURN jsonb_build_object('state','pending');
 END IF;
 minimum:=cfg.min_pass_balance_fc;
 missing:=greatest(0,minimum-coalesce(seat.table_balance,0));
 entry:=coalesce((current_terms->>'entry_fc')::numeric,0);
 total:=entry+coalesce(p_add_fc,0);
 IF p_choice='check' THEN
   RETURN jsonb_build_object('state','pending','table_balance',seat.table_balance,
                             'minimum_fc',minimum,'missing_fc',missing,'entry_fc',entry,
                             'wallet_fc',wallet);
 END IF;
 IF p_add_fc<missing THEN
   RETURN jsonb_build_object('state','topup_required','table_balance',seat.table_balance,
                             'minimum_fc',minimum,'missing_fc',missing,'entry_fc',entry);
 END IF;
 BEGIN
  PERFORM dfc_private.points_require_entry_funds(uid,total,(current_terms->>'entry_diamonds')::numeric);
 EXCEPTION WHEN SQLSTATE 'DF004' THEN
  GET STACKED DIAGNOSTICS shortage_details=PG_EXCEPTION_DETAIL;
  RETURN jsonb_build_object('state','insufficient','wallet_fc',wallet,
    'required_fc',total,'entry_fc',entry,'added_fc',p_add_fc,'message',SQLERRM)||shortage_details::jsonb;
 END;
 IF p_add_fc>0 THEN
   UPDATE public.rf_profiles SET balance=balance-p_add_fc,updated_at=now()
   WHERE id=uid AND balance >=entry+p_add_fc;
   IF NOT FOUND THEN RAISE EXCEPTION 'Saldo FlashCoin insuficiente'; END IF;
   UPDATE public.rf_domino_seats SET table_balance=table_balance+p_add_fc WHERE id=seat.id;
   PERFORM public.rf_add_ledger(uid,-p_add_fc,'DOMINO_PUNTOS_RECARGA_REvancha',
                                'Revancha '||game.id,uid);
 END IF;
 PERFORM dfc_private.confirm_points_replay_at_terms(game.id,p_terms);
 RETURN jsonb_build_object('state','confirmed','added_fc',p_add_fc,
            'table_balance',seat.table_balance+p_add_fc,'entry_fc',entry);
END $function$;
