do $timing$
declare
  fn regprocedure;
  definition text;
  updated text;
begin
  fn := 'public.rf_domino_try_start_v189(bigint)'::regprocedure;
  definition := pg_get_functiondef(fn);
  updated := replace(definition,
    $old$THEN interval '21 seconds' ELSE interval '13 seconds' END$old$,
    $new$THEN interval '25 seconds' ELSE interval '18 seconds' END$new$);
  updated := replace(updated,
    $old$last_hand.settled_at > clock_timestamp()-interval '10 seconds' and exists($old$,
    $new$last_hand.settled_at > clock_timestamp()-interval '19 seconds' and exists($new$);
  if updated=definition or strpos(updated,$new$last_hand.settled_at > clock_timestamp()-interval '19 seconds' and exists($new$)=0
     or strpos(updated,$new$THEN interval '25 seconds' ELSE interval '18 seconds' END$new$)=0 then
    raise exception 'No se pudo validar la espera de barajeo';
  end if;
  execute updated;

  fn := 'public.dfc_points_close_panel(uuid,bigint,text)'::regprocedure;
  definition := pg_get_functiondef(fn);
  updated := replace(definition,$old$ends_at:=coalesce(g.settled_at,hand_settled)+interval '10 seconds';$old$,
                                 $new$ends_at:=coalesce(g.settled_at,hand_settled)+interval '19 seconds';$new$);
  if updated=definition then raise exception 'No se pudo validar el cierre de mano'; end if;
  execute updated;

  fn := 'dfc_private.points_victory_opens(public.dfc_z37_points_matches)'::regprocedure;
  definition := pg_get_functiondef(fn);
  updated := replace(definition,$old$m.settled_at+interval '10 seconds'$old$,$new$m.settled_at+interval '15 seconds'$new$);
  if updated=definition then raise exception 'No se pudo validar la apertura del resultado final'; end if;
  execute updated;

  fn := 'dfc_private.z32_domino_card_on_settle()'::regprocedure;
  definition := pg_get_functiondef(fn);
  updated := replace(definition,
    $old$insert into public.dfc_z31_gift_cards(campaign_id,recipient_id,amount)
 values(v_campaign,new.winner_user_id,v_amount);$old$,
    $new$insert into public.dfc_z31_gift_cards(campaign_id,recipient_id,amount,origin_name,origin_detail)
 values(v_campaign,new.winner_user_id,v_amount,
    case v_kind when 'CAPICUA' then 'Tarjeta Capicúa' when 'TRANQUE' then 'Tarjeta Tranque' else 'Tarjeta Dominó' end,
    'Mano '||new.id);$new$);
  if updated=definition then raise exception 'No se pudo validar el origen de la tarjeta'; end if;
  execute updated;
end
$timing$;
