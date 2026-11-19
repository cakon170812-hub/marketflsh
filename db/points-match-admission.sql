ALTER TABLE public.dfc_z37_points_matches ADD COLUMN IF NOT EXISTS starts_at timestamptz;

CREATE OR REPLACE FUNCTION dfc_private.start_waiting_points_match(p_config uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $start$
DECLARE game public.dfc_z37_points_matches%rowtype; seated integer; result jsonb;
BEGIN
 IF NOT pg_try_advisory_xact_lock(hashtextextended(p_config::text,37)) THEN RETURN false; END IF;
 IF EXISTS (SELECT 1 FROM public.dfc_z37_points_matches
  WHERE config_id=p_config AND state IN ('playing','settlement_pending')) THEN RETURN false; END IF;
 SELECT m.* INTO game FROM public.dfc_z37_points_matches m
 JOIN public.dfc_z37_points_configs c ON c.id=m.config_id AND c.enabled
 WHERE m.config_id=p_config AND m.state='waiting'
   AND m.starts_at<=clock_timestamp() AND m.engine_table_id IS NOT NULL
 ORDER BY m.created_at LIMIT 1 FOR UPDATE OF m;
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT count(*) INTO seated FROM public.dfc_z37_points_participants p
 JOIN public.rf_domino_seats s ON s.user_id=p.user_id AND s.table_id=game.engine_table_id AND s.state='active'
 WHERE p.match_id=game.id;
 IF seated<2 THEN
  UPDATE public.dfc_z37_points_matches SET starts_at=NULL WHERE id=game.id;
  RETURN false;
 END IF;
 UPDATE public.dfc_z37_points_participants SET team=CASE
   WHEN seated=4 THEN 1+mod(seat_number+1,2) ELSE seat_number END
 WHERE match_id=game.id;
 UPDATE public.dfc_z37_points_matches SET state='playing',players=seated,starts_at=NULL WHERE id=game.id;
 result:=public.rf_domino_try_start_v189(game.engine_table_id);
 IF NOT coalesce((result->>'started')::boolean,false) THEN
  RAISE EXCEPTION 'No se pudo iniciar la partida: %',result;
 END IF;
 RETURN true;
END;
$start$;
REVOKE ALL ON FUNCTION dfc_private.start_waiting_points_match(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_reserve_fc()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare game public.dfc_z37_points_matches%rowtype; new_balance numeric;
begin
 select * into strict game from public.dfc_z37_points_matches where id=new.match_id for update;
 if game.entry_fc=0 or not new.charged then return new; end if;
 if game.state<>'waiting' then raise exception 'La mesa no admite este aporte'; end if;
 insert into public.dfc_z37_points_fc_reserves(match_id,user_id,amount,status)
 values(game.id,new.user_id,game.entry_fc,'reserved')
 on conflict(match_id,user_id) do update set amount=excluded.amount,status='reserved'
 where dfc_z37_points_fc_reserves.status='refunded';
 if not found then raise exception 'El aporte de esta partida ya está registrado'; end if;
 update public.rf_profiles set balance=balance-game.entry_fc,updated_at=now()
 where id=new.user_id and balance>=game.entry_fc returning balance into new_balance;
 if not found then raise exception 'FlashCoin insuficiente para sentarse'; end if;
 insert into public.rf_wallet_ledger(user_id,delta,balance_after,movement_type,reference)
 values(new.user_id,-game.entry_fc,new_balance,'DOMINO_PUNTOS_APORTE','PUNTOS:'||game.id);
 return new;
end $function$;

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
 if not public.dfc_z9_diamond_transfer(new.user_id,null,game.entry_diamonds,ref,'DOMINO_PUNTOS_APORTE',false,jsonb_build_object('match_id',game.id)) then
  raise exception 'Aporte de diamantes duplicado';
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_join_paid(p_config uuid, p_request uuid, p_fc numeric, p_diamonds bigint)
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
 if previous_match is not null then raise exception 'Esta confirmación ya fue usada. Vuelve a seleccionar la mesa'; end if;
 if exists(select 1 from public.rf_domino_seats where user_id=uid) then
   raise exception 'Sal de tu mesa actual antes de sentarte';
 end if;
 select * into cfg from public.dfc_z37_points_configs where id=p_config and enabled and players between 2 and 4
 and id<>'b3abde40-ea42-4a52-ab24-0ce93c090200' for share;
 if not found then raise exception 'Mesa por puntos no disponible'; end if;
 if cfg.entry_fc is distinct from p_fc or cfg.entry_diamonds is distinct from p_diamonds then
   raise exception 'El aporte cambió. Vuelve a abrir Por puntos para confirmar el importe actual';
 end if;
 PERFORM dfc_private.start_waiting_points_match(cfg.id);
 select * into game from public.dfc_z37_points_matches m where m.config_id=cfg.id and m.state='waiting'
 and m.players=cfg.players and m.target_points=cfg.target_points and m.entry_fc=cfg.entry_fc
 and m.entry_diamonds=cfg.entry_diamonds and m.admin_pct=cfg.admin_pct and m.diamond_admin_pct=cfg.diamond_admin_pct
 order by created_at limit 1 for update;
 if not found then
   insert into public.dfc_z37_points_matches(config_id,players,target_points,entry_fc,entry_diamonds,admin_pct,diamond_admin_pct)
   values(cfg.id,cfg.players,cfg.target_points,cfg.entry_fc,cfg.entry_diamonds,cfg.admin_pct,cfg.diamond_admin_pct)
   returning * into game;
 end if;
 table_key:=public.dfc_z37_prepare_points_table_internal(game.id);
 select n into seat_number from generate_series(1,cfg.players) n where not exists(
   select 1 from public.rf_domino_seats where table_id=table_key and seat_no=n
 ) order by n limit 1;
 if seat_number is null then raise exception 'La mesa está llena'; end if;
 insert into public.rf_domino_seats(table_id,user_id,seat_no,table_balance,state,is_ready)
 values(table_key,uid,seat_number,0,'active',true);
 insert into public.dfc_z37_points_participants(match_id,user_id,seat_number,team,charged)
 values(game.id,uid,seat_number,1,true);
 insert into public.dfc_z37_paid_entry_requests values(uid,p_request,game.id);
 select count(*) into seated from public.dfc_z37_points_participants where match_id=game.id;
 if seated>=2 then
   update public.dfc_z37_points_matches
   set starts_at=clock_timestamp()+case when seated=cfg.players then interval '0 seconds' else interval '10 seconds' end
   where id=game.id;
   perform dfc_private.start_waiting_points_match(cfg.id);
   select * into strict game from public.dfc_z37_points_matches where id=game.id;
 end if;
 return jsonb_build_object('state',game.state,'table_id',table_key);
end;
$function$;

CREATE OR REPLACE FUNCTION public.dfc_z37_points_scoreboard(p_table_id bigint)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select jsonb_build_object(
  'starts_at',m.starts_at,'match_id',m.id,'target',m.target_points,'state',m.state,'winner_team',m.winner_team,
  'pot_fc',coalesce((select sum(p.fc_principal+p.fc_profit) from public.dfc_z37_points_payouts p where p.match_id=m.id),0),
  'pot_diamonds',coalesce((select sum(p.diamond_principal+p.diamond_profit) from public.dfc_z37_points_payouts p where p.match_id=m.id),0),
  'replay_opens',case when m.state='settled' and m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' then m.settled_at+interval '3 seconds' end,
  'replay_deadline',case when m.state='settled' and m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' then m.settled_at+interval '13 seconds' end,
  'server_time',statement_timestamp(),
  'replay_confirmed',exists(select 1 from public.dfc_z37_points_participants p where p.match_id=m.id and p.user_id=auth.uid() and p.replay_confirmed_at is not null),
  'players',coalesce((
    select jsonb_agg(jsonb_build_object('seat',p.seat_number,'team',p.team,
      'points',p.points_individual,'mine',p.user_id=auth.uid(),
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

CREATE OR REPLACE FUNCTION public.dfc_z37_trial_replay_cycle()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare item record;
begin
 for item in select distinct config_id from public.dfc_z37_points_matches
  where state='waiting' and starts_at<=clock_timestamp()
 loop
  begin
   perform dfc_private.start_waiting_points_match(item.config_id);
  exception when others then
   raise warning 'Inicio Por puntos %: %',item.config_id,SQLERRM;
  end;
 end loop;
 for item in select m.engine_table_id as table_id from public.dfc_z37_points_matches m
  where m.engine_table_id is not null
    and ((m.config_id='b3abde40-ea42-4a52-ab24-0ce93c090200' and m.state='settled' and m.settled_at+interval '13 seconds'<=clock_timestamp())
         or m.state='playing')
 loop
   perform public.dfc_z37_trial_replay_rotate(item.table_id);
   if exists(select 1 from public.dfc_z37_points_matches m where m.engine_table_id=item.table_id and m.state='playing') then
      perform public.dfc_z37_trial_restore_seats(item.table_id);
      if not exists(select 1 from public.rf_domino_hands h where h.table_id=item.table_id and h.status in ('playing','shuffling')) then
        perform public.rf_domino_try_start_v189(item.table_id);
      else
        perform public.rf_domino_tick_v11(item.table_id);
      end if;
   end if;
 end loop;
end $function$;
