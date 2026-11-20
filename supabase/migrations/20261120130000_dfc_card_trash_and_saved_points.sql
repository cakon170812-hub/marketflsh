CREATE OR REPLACE FUNCTION public.dfc_gift_trash_v1()
 RETURNS TABLE(gift_id uuid, amount numeric, origin_name text, expires_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select c.id,c.amount,coalesce(c.origin_name,'Tarjeta FlashCoin'),c.expires_at
 from public.dfc_z31_gift_cards c
 where c.recipient_id=auth.uid() and c.redeemed_at is null
   and c.expired_acknowledged_at is not null and c.trash_cleared_at is null
 order by c.expired_acknowledged_at desc,c.id;
$function$;
CREATE OR REPLACE FUNCTION public.dfc_gift_trash_clear_v1(p_ids uuid[])
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
 with removed as (
   update public.dfc_z31_gift_cards c set trash_cleared_at=now()
   where c.recipient_id=auth.uid() and (p_ids is null or c.id=any(p_ids))
     and c.redeemed_at is null and c.expired_acknowledged_at is not null
     and c.trash_cleared_at is null
   returning 1
 ) select count(*)::integer from removed;
$function$;

alter table public.dfc_z37_points_configs add column archived_at timestamptz,
 add constraint dfc_points_archived_disabled check (archived_at is null or not enabled);
CREATE OR REPLACE FUNCTION public.dfc_z37_admin_points()
 RETURNS SETOF dfc_z37_points_configs
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if (select auth.uid()) is null or not public.dfc_z37_is_admin() then
   raise exception 'Acceso no autorizado';
 end if;
 return query select * from public.dfc_z37_points_configs where archived_at is null order by created_at desc;
end $function$;
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
  where id=v_id and archived_at is null;
  if not found then raise exception 'Mesa por puntos no encontrada'; end if;
 else
  insert into public.dfc_z37_points_configs(pass_fee_fc,bots_allowed,name,players,target_points,entry_fc,entry_diamonds,max_negative_diamonds,admin_pct,diamond_admin_pct,enabled)
  values(coalesce(v_pass_fee,0),coalesce((p_input->>'bots_allowed')::boolean,false),v_name,v_players,v_target,v_fc,v_diamonds,v_limit,v_pct,coalesce((p_input->>'diamond_admin_pct')::numeric,v_pct),coalesce(v_enabled,false)) returning id into v_id;
 end if;
 return v_id;
end;
$function$;

create function public.dfc_z37_admin_archive_points(p_config uuid) returns void
 language plpgsql security definer set search_path='' as $archive$
begin
 if auth.uid() is null or not public.dfc_z37_is_admin() then
   raise exception 'Acceso no autorizado';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_config::text,37));
 if exists(
   select 1 from public.dfc_z37_points_matches m
   join public.dfc_z37_points_participants p on p.match_id=m.id
   where m.config_id=p_config and m.state='waiting' and m.replay_from is null
 ) then
   raise exception 'Hay jugadores esperando. Espera a que comience o se desocupe la mesa.';
 end if;
 update public.dfc_z37_points_configs
 set enabled=false,archived_at=coalesce(archived_at,now()),updated_at=now()
 where id=p_config;
 if not found then raise exception 'Mesa por puntos no encontrada'; end if;
end $archive$;
revoke all on function public.dfc_z37_admin_archive_points(uuid) from public,anon;
grant execute on function public.dfc_z37_admin_archive_points(uuid) to authenticated;

create function public.dfc_gift_trash_all() returns jsonb
 language sql stable security invoker set search_path='' as $trash$
 select coalesce(jsonb_agg(to_jsonb(cards) order by cards.ordinal),'[]'::jsonb)
 from public.dfc_gift_trash_v1() with ordinality
   as cards(gift_id,amount,origin_name,expires_at,ordinal);
$trash$;
revoke all on function public.dfc_gift_trash_all() from public,anon;
grant execute on function public.dfc_gift_trash_all() to authenticated;
