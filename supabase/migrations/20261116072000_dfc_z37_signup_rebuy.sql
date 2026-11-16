-- DFC Z37 / Inscripciones y recompras (pendiente de habilitación de motor).
-- No conceder EXECUTE a authenticated antes de financiar, conectar y probar.
create or replace function public.dfc_z37_tournament_register(p_tournament uuid,p_request uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 uid uuid:=auth.uid();
 t public.dfc_z37_tournaments;
 v_player public.dfc_z37_tournament_players;
 v_fc numeric(20,2);
 v_admin numeric(20,2);
 v_winners numeric(20,2);
 v_balance numeric;
begin
 if uid is null or p_request is null then raise exception 'Sesión y solicitud requeridas'; end if;
 select * into t from public.dfc_z37_tournaments where id=p_tournament for update;
 if not found then raise exception 'Torneo no existe'; end if;
 select * into v_player from public.dfc_z37_tournament_players
 where tournament_id=p_tournament and user_id=uid;
 if found then return jsonb_build_object('tournament_id',p_tournament,'registered',true,'already_registered',true); end if;
 if t.state<>'open' or now()>=t.registration_closes_at then raise exception 'Inscripciones cerradas'; end if;
 if t.entry_fc=0 and t.funded_fc<t.guaranteed_fc then
  raise exception 'Fondo gratuito no garantizado'; end if;
 if exists(select 1 from public.dfc_z37_financial_events e where e.external_request_id=p_request) then
   raise exception 'Solicitud usada anteriormente';end if;
 v_fc:=t.entry_fc;
 update public.rf_profiles p set balance=p.balance-v_fc,updated_at=now()
 where p.id=uid and p.balance>=v_fc returning p.balance into v_balance;
 if not found then raise exception 'FlashCoin insuficiente';end if;
 v_admin:=round(v_fc*t.signup_admin_pct/100,2);
 v_winners:=v_fc-v_admin;
 insert into public.dfc_z37_tournament_players(tournament_id,user_id,diamonds_remaining,status)
 values(t.id,uid,t.diamond_initial,'registered');
 insert into public.dfc_z37_financial_events(tournament_id,user_id,external_request_id,event_type,fc_delta,diamond_delta,metadata)
 values(t.id,uid,p_request,'signup',-v_fc,t.diamond_initial,
 jsonb_build_object('admin_share',v_admin,'winners_share',v_winners));
 perform public.rf_add_ledger(uid,-v_fc,'Z37_TORNEO_INSCRIPCION','Inscripción torneo '||t.id,uid);
 update public.dfc_z37_tournament_funds set
 fc_signup_gross=fc_signup_gross+v_fc,fc_admin_share=fc_admin_share+v_admin,
 fc_prize_share=fc_prize_share+v_winners,diamond_issued_total=diamond_issued_total+t.diamond_initial,
 updated_at=now() where tournament_id=t.id;
 if not found then raise exception 'Cartera de torneo inexistente';end if;
 return jsonb_build_object('tournament_id',t.id,'registered',true,
  'already_registered',false,'entry_fc',v_fc,'starting_diamonds',t.diamond_initial);
end;$$;
revoke all on function public.dfc_z37_tournament_register(uuid,uuid) from public,anon,authenticated;

create or replace function public.dfc_z37_tournament_rebuy(p_tournament uuid,p_request uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 uid uuid:=auth.uid();
 t public.dfc_z37_tournaments;
 pl public.dfc_z37_tournament_players;
 v_admin numeric(20,2);
 v_winners numeric(20,2);
 v_balance numeric;
 v_existing jsonb;
begin
 if uid is null or p_request is null then raise exception 'Sesión y solicitud requeridas';end if;
 select e.metadata into v_existing from public.dfc_z37_financial_events e
 where e.external_request_id=p_request and e.event_type='rebuy'
 and e.user_id=uid and e.tournament_id=p_tournament;
 if found then return v_existing||jsonb_build_object('already_processed',true);end if;
 select * into t from public.dfc_z37_tournaments where id=p_tournament for update;
 if not found or t.state<>'running' then raise exception 'Torneo no está en juego';end if;
 select * into pl from public.dfc_z37_tournament_players
 where tournament_id=p_tournament and user_id=uid for update;
 if not found or pl.status<>'rebuy_window' or pl.rebuy_deadline is null
 or now()>pl.rebuy_deadline then raise exception 'Ventana de recompra no vigente';end if;
 if pl.rebuys_used>=2 then raise exception 'Máximo de dos recompras';end if;
 if t.rebuy_fc<=0 or t.rebuy_diamonds<=0 then raise exception 'Recompra no configurada';end if;
 if t.rebuy_fc<>round(t.rebuy_fc,2) or mod((t.rebuy_fc*100)::bigint,2)<>0 then
   raise exception 'Para dividir 50/50 exactamente debe tener centavos pares';end if;
 if exists(select 1 from public.dfc_z37_financial_events e where e.external_request_id=p_request) then
   raise exception 'Referencia usada';end if;
 update public.rf_profiles p set balance=p.balance-t.rebuy_fc,updated_at=now()
 where p.id=uid and p.balance>=t.rebuy_fc returning p.balance into v_balance;
 if not found then raise exception 'FlashCoin insuficiente';end if;
 v_admin:=t.rebuy_fc/2;v_winners:=t.rebuy_fc-v_admin;
 update public.dfc_z37_tournament_players p set
 diamonds_remaining=p.diamonds_remaining+t.rebuy_diamonds,rebuys_used=p.rebuys_used+1,
 status='playing',rebuy_deadline=null where p.tournament_id=t.id and p.user_id=uid;
 update public.dfc_z37_tournament_funds set
 fc_rebuy_gross=fc_rebuy_gross+t.rebuy_fc,fc_admin_share=fc_admin_share+v_admin,
 fc_prize_share=fc_prize_share+v_winners,diamond_issued_total=diamond_issued_total+t.rebuy_diamonds,
 updated_at=now() where tournament_id=t.id;
 if not found then raise exception 'Cartera contable inexistente';end if;
 insert into public.dfc_z37_financial_events
 (tournament_id,user_id,external_request_id,event_type,fc_delta,diamond_delta,metadata)
 values(t.id,uid,p_request,'rebuy',-t.rebuy_fc,t.rebuy_diamonds,
 jsonb_build_object('rebuy_number',pl.rebuys_used+1,'admin_share',v_admin,
 'winners_share',v_winners,'new_diamonds',pl.diamonds_remaining+t.rebuy_diamonds));
 perform public.rf_add_ledger(uid,-t.rebuy_fc,'Z37_TORNEO_RECOMPRA','Recompra torneo '||t.id,uid);
 return jsonb_build_object('rebuy_number',pl.rebuys_used+1,
 'new_diamonds',pl.diamonds_remaining+t.rebuy_diamonds,'already_processed',false);
end;$$;
revoke all on function public.dfc_z37_tournament_rebuy(uuid,uuid) from public,anon,authenticated;
