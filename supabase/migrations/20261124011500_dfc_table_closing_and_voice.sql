CREATE OR REPLACE FUNCTION public.dfc_points_close_panel(p_match_id uuid, p_hand_id bigint, p_phase text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  uid uuid:=auth.uid();
  g public.dfc_z37_points_matches%rowtype;
  latest_hand bigint;
  hand_settled timestamptz;
  begins_at timestamptz;
  ends_at timestamptz;
  closed uuid[];
  finished timestamptz;
begin
  if uid is null or p_phase is null or p_phase not in ('hand','victory') then return false; end if;
  select * into g from public.dfc_z37_points_matches where id=p_match_id;
  if not found then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(g.config_id::text,37));
  select * into g from public.dfc_z37_points_matches where id=p_match_id for update;
  if not found or g.engine_table_id is null or g.state not in ('playing','settled') or not exists (
    select 1 from public.dfc_z37_points_participants p
    join public.rf_domino_seats s on s.table_id=g.engine_table_id and s.user_id=p.user_id and s.state='active'
    where p.match_id=g.id and p.user_id=uid
      and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=uid)
  ) then return false; end if;

  IF p_phase='victory' AND EXISTS (SELECT 1 FROM dfc_private.points_final_players f WHERE f.match_id=g.id) THEN
    IF g.state<>'settled' OR p_hand_id IS DISTINCT FROM 0 THEN RETURN false; END IF;
    UPDATE dfc_private.points_final_players
    SET continued_at=coalesce(continued_at,clock_timestamp())
    WHERE match_id=g.id AND user_id=uid AND NOT auto_mode;
    RETURN found;
  END IF;

  if p_phase='hand' then
    select h.id,h.settled_at into latest_hand,hand_settled
    from public.dfc_z37_points_events e
    join public.rf_domino_hands h on h.id=e.engine_hand_id and h.status='settled'
    where e.match_id=g.id order by h.id desc limit 1;
    if latest_hand is null or p_hand_id is distinct from latest_hand then return false; end if;
    if exists(select 1 from public.rf_domino_hands h where h.table_id=g.engine_table_id
        and h.id>latest_hand and h.status in ('playing','shuffling')) then return false; end if;
    ends_at:=coalesce(g.settled_at,hand_settled)+interval '19 seconds';
  else
    if g.state<>'settled' or p_hand_id is distinct from 0 then return false; end if;
    begins_at:=dfc_private.points_victory_opens(g);
    ends_at:=begins_at+interval '10 seconds';
  end if;
  if ends_at is null or clock_timestamp()>=ends_at or clock_timestamp()<begins_at then return false; end if;

  insert into dfc_private.points_panel_closures as c(match_id,hand_id,phase,closed_by,is_final)
  values(g.id,p_hand_id,p_phase,array[uid],g.state='settled')
  on conflict (match_id,hand_id,phase) do update
  set closed_by=case when uid=any(c.closed_by) then c.closed_by else array_append(c.closed_by,uid) end,
      is_final=c.is_final or excluded.is_final
  returning c.closed_by,c.completed_at into closed,finished;
  if finished is not null then return true; end if;

  if not exists(
    select 1 from public.dfc_z37_points_participants p
    join public.rf_domino_seats s on s.table_id=g.engine_table_id and s.user_id=p.user_id and s.state='active'
    where p.match_id=g.id and not (p.user_id=any(closed))
      and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=p.user_id)
  ) then
    update dfc_private.points_panel_closures set completed_at=clock_timestamp()
    where match_id=g.id and hand_id=p_hand_id and phase=p_phase;
    if p_phase='hand' and g.state='playing' then
      begin
        perform public.rf_domino_try_start_v189(g.engine_table_id);
      exception when others then
        raise warning 'Reintento de barajeo Por puntos %: %', g.engine_table_id, SQLSTATE;
      end;
    end if;
  end if;
  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.dfc_points_replay_choice_with_balance(p_match_id uuid, p_choice text, p_terms jsonb, p_add_fc numeric DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
 uid uuid:=auth.uid();
 game public.dfc_z37_points_matches%rowtype;
 cfg public.dfc_z37_points_configs%rowtype;
 seat public.rf_domino_seats%rowtype;
 current_terms jsonb;
 minimum numeric;
 missing numeric;
 funding_required boolean;
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
 WHERE table_id=coalesce(game.engine_table_id,CASE WHEN p_choice='exit' THEN (
      SELECT f.table_id FROM dfc_private.points_final_players f
      WHERE f.match_id=game.id AND f.user_id=uid
    ) END) AND user_id=uid
   AND (state='active' OR p_choice='exit') FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('state','left'); END IF;
 funding_required:=dfc_private.points_replay_funding_required(game,uid);
 IF p_choice='exit' OR (p_choice='timeout' AND NOT funding_required
      AND clock_timestamp()>=(dfc_private.points_replay_opens_for(game,uid)+interval '10 seconds')) THEN
   PERFORM public.rf_domino_return_seat_v11(seat.id,'Salida de la revancha Por puntos');
   IF EXISTS (SELECT 1 FROM public.rf_domino_seats WHERE id=seat.id) THEN
     RETURN jsonb_build_object('state','pending');
   END IF;
   RETURN jsonb_build_object('state','left');
 END IF;
 IF p_choice='confirm' AND dfc_private.points_replay_opens_for(game,uid) IS NULL THEN
   RAISE EXCEPTION 'Toca Continuar para abrir la revancha';
 END IF;
 IF p_choice='timeout' THEN RETURN jsonb_build_object('state','pending'); END IF;
 SELECT * INTO STRICT cfg FROM public.dfc_z37_points_configs WHERE id=game.config_id FOR SHARE;
 current_terms:=dfc_private.points_replay_terms(game,cfg);
 IF NOT cfg.enabled OR (current_terms->>'players')::integer<>coalesce(game.flexible_capacity,game.players) THEN
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
 PERFORM dfc_private.confirm_points_replay_at_terms(game.id,p_terms,funding_required);
 PERFORM dfc_private.start_confirmed_points_replay(game.id);
 RETURN jsonb_build_object('state','confirmed','added_fc',p_add_fc,
            'table_balance',seat.table_balance+p_add_fc,'entry_fc',entry);
END
$function$;

CREATE OR REPLACE FUNCTION dfc_private.issue_points_fc_card()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE payout record; paid_balance numeric;
BEGIN
 INSERT INTO dfc_private.points_final_players(match_id,user_id,seat_number,table_id,place,table_balance,auto_mode)
 SELECT new.id,p.user_id,p.seat_number,new.engine_table_id,
   dense_rank() OVER (ORDER BY (p.team IS NOT DISTINCT FROM new.winner_team) DESC,
     CASE WHEN new.players=4 THEN CASE p.team WHEN 1 THEN new.team_a_points ELSE new.team_b_points END
          ELSE p.points_individual END DESC),
   s.table_balance,
   (p.absent_at IS NOT NULL OR coalesce(ctrl.auto_mode,false)) AND NOT EXISTS (
     SELECT 1 FROM public.rf_domino_moves move
     WHERE move.hand_id=(
       SELECT max(e.engine_hand_id) FROM public.dfc_z37_points_events e WHERE e.match_id=new.id
     ) AND move.user_id=p.user_id AND move.action IN ('PLAY','PASS')
   )
 FROM public.dfc_z37_points_participants p
 LEFT JOIN public.rf_domino_seats s ON s.table_id=new.engine_table_id AND s.user_id=p.user_id
 LEFT JOIN public.dfc_z11_seat_control ctrl ON ctrl.table_id=new.engine_table_id AND ctrl.user_id=p.user_id
 WHERE p.match_id=new.id
 ON CONFLICT (match_id,user_id) DO NOTHING;

 FOR payout IN
   SELECT p.* FROM public.dfc_z37_points_payouts p
   JOIN dfc_private.points_final_players f USING(match_id,user_id)
   WHERE p.match_id=new.id AND f.auto_mode AND p.paid_at IS NULL AND NOT p.fc_card_issued
     AND NOT EXISTS (SELECT 1 FROM public.rf_domino_bot_instances_v18 b WHERE b.user_id=p.user_id)
   ORDER BY p.user_id FOR UPDATE OF p
 LOOP
   IF payout.fc_principal+payout.fc_profit>0 THEN
     UPDATE public.rf_profiles SET balance=balance+payout.fc_principal+payout.fc_profit,updated_at=clock_timestamp()
     WHERE id=payout.user_id RETURNING balance INTO STRICT paid_balance;
     INSERT INTO public.rf_wallet_ledger(user_id,delta,balance_after,movement_type,reference)
     VALUES(payout.user_id,payout.fc_principal+payout.fc_profit,paid_balance,
       'DOMINO_PUNTOS_PREMIO_AUTOMATICO','PUNTOS-AUTO:'||new.id||':'||payout.user_id);
   END IF;
   IF payout.diamond_principal+payout.diamond_profit>0 THEN
     PERFORM public.dfc_z9_diamond_transfer(NULL,payout.user_id,payout.diamond_principal+payout.diamond_profit,
       'points-diamond-auto:'||new.id||':'||payout.user_id,'DOMINO_PUNTOS_PREMIO_AUTOMATICO',false,'{}');
   END IF;
   UPDATE public.dfc_z37_points_payouts SET paid_at=clock_timestamp()
   WHERE match_id=new.id AND user_id=payout.user_id;
 END LOOP;

 insert into public.dfc_z31_gift_cards(points_match_id,recipient_id,amount,origin_name,origin_detail,expires_at,points_full_prize)
 select new.id,p.user_id,p.fc_principal+p.fc_profit,'Premio de mesa por puntos',c.name,
 case when e.expiry_days is not null then clock_timestamp()+make_interval(days=>e.expiry_days) end,true
 from public.dfc_z37_points_payouts p
 join public.dfc_z37_points_configs c on c.id=new.config_id
 left join dfc_private.z32_gift_expiry_config e on e.id=1
 where p.match_id=new.id and p.paid_at is null and p.fc_principal+p.fc_profit>0
 and not exists(select 1 from public.rf_domino_bot_instances_v18 b where b.user_id=p.user_id)
 on conflict do nothing;
 update public.dfc_z37_points_payouts p set fc_card_issued=true where p.match_id=new.id and exists(select 1 from public.dfc_z31_gift_cards g where g.points_match_id=p.match_id and g.recipient_id=p.user_id and g.points_full_prize);
 return new;
end
$function$;


CREATE TABLE dfc_private.domino_voice_notes (
  id uuid PRIMARY KEY,
  table_id bigint NOT NULL REFERENCES public.rf_domino_tables(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.rf_profiles(id) ON DELETE CASCADE,
  mime text NOT NULL CHECK (mime IN ('audio/webm','audio/ogg','audio/mp4')),
  audio bytea NOT NULL CHECK (octet_length(audio) BETWEEN 1 AND 524288),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX domino_voice_notes_by_table ON dfc_private.domino_voice_notes(table_id, created_at);
CREATE INDEX domino_voice_notes_expiry ON dfc_private.domino_voice_notes(created_at);
ALTER TABLE dfc_private.domino_voice_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON dfc_private.domino_voice_notes FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.dfc_domino_send_voice(p_table_id bigint,p_note_id uuid,p_mime text,p_audio text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE sender uuid := auth.uid();
DECLARE clip bytea;
BEGIN
  IF sender IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.rf_domino_seats
    WHERE table_id=p_table_id AND user_id=sender AND state='active'
  ) THEN RAISE EXCEPTION 'Debes estar sentado en la mesa'; END IF;

  IF EXISTS (SELECT 1 FROM public.dfc_mod_admin_chat_bans_v003 WHERE user_id=sender) THEN
    RAISE EXCEPTION 'Tu chat ha sido suspendido por administración';
  END IF;
  IF p_note_id IS NULL OR p_mime IS NULL OR p_mime NOT IN ('audio/webm','audio/ogg','audio/mp4')
     OR p_audio IS NULL OR length(p_audio) NOT BETWEEN 1 AND 699052 THEN
    RAISE EXCEPTION 'La nota de voz no está disponible o supera el tamaño permitido';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(sender::text, 56013));
  IF EXISTS (SELECT 1 FROM dfc_private.domino_voice_notes
             WHERE id=p_note_id AND table_id=p_table_id AND sender_id=sender) THEN
    RETURN p_note_id;
  END IF;
  IF (SELECT count(*) FROM dfc_private.domino_voice_notes
      WHERE table_id=p_table_id AND sender_id=sender AND created_at>clock_timestamp()-interval '1 minute') >= 8 THEN
    RAISE EXCEPTION 'Espera un momento antes de enviar otra nota';
  END IF;
  clip := decode(p_audio,'base64');
  IF octet_length(clip) NOT BETWEEN 1 AND 524288 THEN
    RAISE EXCEPTION 'La nota de voz supera el tamaño permitido';
  END IF;
  IF NOT (
    (p_mime='audio/webm' AND substring(clip from 1 for 4)=decode('1a45dfa3','hex')) OR
    (p_mime='audio/ogg' AND substring(clip from 1 for 4)=convert_to('OggS','UTF8')) OR
    (p_mime='audio/mp4' AND substring(clip from 5 for 4)=convert_to('ftyp','UTF8'))
  ) THEN RAISE EXCEPTION 'El formato del audio no es válido'; END IF;
  INSERT INTO dfc_private.domino_voice_notes(id,table_id,sender_id,mime,audio)
    VALUES(p_note_id,p_table_id,sender,p_mime,clip);
  RETURN p_note_id;
END;
$$;

CREATE FUNCTION public.dfc_domino_list_voice(p_table_id bigint)
RETURNS TABLE(id uuid, sender_name text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
  SELECT n.id, coalesce(nullif(trim(concat_ws(' ',p.first_name,p.last_name)),''),'Jugador'), n.created_at
  FROM dfc_private.domino_voice_notes n
  JOIN public.rf_profiles p ON p.id=n.sender_id
  WHERE n.table_id=p_table_id
    AND n.sender_id<>auth.uid()
    AND n.created_at>statement_timestamp()-interval '2 minutes'
    AND EXISTS (SELECT 1 FROM public.rf_domino_seats s
                WHERE s.table_id=n.table_id AND s.user_id=auth.uid() AND s.state='active'
                  AND s.joined_at<=n.created_at)
    AND NOT EXISTS (SELECT 1 FROM public.dfc_mod_blocked_users_v002 b
                    WHERE b.blocker_id=auth.uid() AND b.blocked_id=n.sender_id)
  ORDER BY n.created_at,n.id
  LIMIT 48;
$$;

CREATE FUNCTION public.dfc_domino_read_voice(p_table_id bigint,p_note_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
  SELECT jsonb_build_object('mime',n.mime,'audio',encode(n.audio,'base64'))
  FROM dfc_private.domino_voice_notes n
  WHERE n.id=p_note_id AND n.table_id=p_table_id
    AND n.created_at>statement_timestamp()-interval '10 minutes'
    AND EXISTS (SELECT 1 FROM public.rf_domino_seats s
                WHERE s.table_id=n.table_id AND s.user_id=auth.uid() AND s.state='active'
                  AND s.joined_at<=n.created_at)
    AND NOT EXISTS (SELECT 1 FROM public.dfc_mod_blocked_users_v002 b
                    WHERE b.blocker_id=auth.uid() AND b.blocked_id=n.sender_id);
$$;

REVOKE ALL ON FUNCTION public.dfc_domino_send_voice(bigint,uuid,text,text),
  public.dfc_domino_list_voice(bigint), public.dfc_domino_read_voice(bigint,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dfc_domino_send_voice(bigint,uuid,text,text),
  public.dfc_domino_list_voice(bigint), public.dfc_domino_read_voice(bigint,uuid) TO authenticated;

SELECT cron.schedule('dfc-expire-domino-voice', '*/10 * * * *',
  'DELETE FROM dfc_private.domino_voice_notes WHERE created_at < now() - interval ''10 minutes''');

CREATE INDEX dfc_z16_pass_flights_table_idx
  ON public.dfc_z16_table_diamond_ledger(table_id,created_at DESC)
  WHERE category='PASS_TRANSFER' AND delta<0;

CREATE FUNCTION public.dfc_z163_table_diamond_sync()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
  WITH wallet AS MATERIALIZED (
    SELECT public.dfc_z16_table_diamond_status() AS payload
  )
  SELECT wallet.payload || jsonb_build_object(
    'server_time',statement_timestamp(),'passes',coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'key',t.event_key,'sender',t.user_id,'recipient',r.user_id,
        'amount',r.delta,'created_at',t.created_at
      ) ORDER BY t.created_at,t.event_key)
      FROM public.dfc_z16_table_diamond_ledger t
      JOIN public.dfc_z16_table_diamond_ledger r
        ON r.event_key=left(t.event_key,-6)||'recipient'
        AND r.table_id=t.table_id AND r.category='PASS_TRANSFER' AND r.delta>0
      WHERE t.table_id=(wallet.payload->>'table_id')::bigint
        AND t.category='PASS_TRANSFER' AND t.delta<0 AND right(t.event_key,7)=':sender'
        AND t.created_at>statement_timestamp()-interval '25 seconds'
    ),'[]'::jsonb))
  FROM wallet;
$$;
REVOKE ALL ON FUNCTION public.dfc_z163_table_diamond_sync() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dfc_z163_table_diamond_sync() TO authenticated;
