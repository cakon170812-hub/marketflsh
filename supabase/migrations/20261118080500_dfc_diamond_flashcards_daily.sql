create function public.dfc_diamond_flashcards_pending_v1()
returns table(created_on date, amount numeric, origin text)
language plpgsql stable security definer set search_path=''
as $$
declare uid uuid:=auth.uid(); first_date date; last_date date;
begin
 if uid is null or exists(select 1 from public.rf_domino_bot_claims_v17 where user_id=uid) then return; end if;
 select first_day,last_day into first_date,last_date from public.dfc_z9_card_window(uid);
 return query select d::date,10.000::numeric,'Recompensa diaria'::text
 from generate_series(first_date::timestamp,last_date::timestamp,interval '1 day') d
 where not exists(select 1 from public.dfc_diamond_cards_z9 c where c.user_id=uid and c.claim_day=d::date)
 order by d limit 100;
end $$;

create function public.dfc_diamond_flashcard_claim_v1(p_created_on date)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare uid uuid:=auth.uid(); first_date date; last_date date;
begin
 if uid is null or exists(select 1 from public.rf_domino_bot_claims_v17 where user_id=uid) then
   raise exception 'Debes iniciar sesión con una cuenta de jugador';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text||':diamondcards',0));
 select first_day,last_day into first_date,last_date from public.dfc_z9_card_window(uid);
 if p_created_on is null or p_created_on not between first_date and last_date then
   raise exception 'La fecha no corresponde a una tarjeta disponible';
 end if;
 insert into public.dfc_diamond_cards_z9(user_id,claim_day) values(uid,p_created_on)
 on conflict do nothing;
 if not found then return jsonb_build_object('redeemed',false); end if;
 perform public.dfc_z9_diamond_transfer(null,uid,10.000,
 'flashcard:'||uid::text||':'||p_created_on::text,'TARJETA_DIARIA',false,jsonb_build_object('claim_day',p_created_on));
 return jsonb_build_object('redeemed',true,'amount',10.000);
end $$;

revoke all on function public.dfc_diamond_flashcards_pending_v1(),public.dfc_diamond_flashcard_claim_v1(date) from public,anon,authenticated,service_role;
grant execute on function public.dfc_diamond_flashcards_pending_v1(),public.dfc_diamond_flashcard_claim_v1(date) to authenticated;
