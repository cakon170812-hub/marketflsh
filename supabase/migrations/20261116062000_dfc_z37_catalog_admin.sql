-- DOMINÓ FLASH COIN Z37: catálogo y borradores administrativos
-- Estructuras ya instaladas por dfc_z37_base_aislada.
-- En esta etapa NO se habilitan inscripciones ni cobros.

create or replace function public.dfc_z37_is_admin()
returns boolean language sql stable security definer set search_path=''
as $$
 select exists (
  select 1 from public.rf_profiles p
  where p.id = (select auth.uid()) and p.role in ('leader','admin')
 )
$$;
revoke all on function public.dfc_z37_is_admin() from public, anon;
grant execute on function public.dfc_z37_is_admin() to authenticated;

create or replace function public.dfc_z37_public_tournaments()
returns table(
 id uuid, name text, description text, artwork_key text, starts_at timestamptz,
 entry_fc numeric, diamond_initial bigint, diamond_pass_cost bigint,
 diamond_minimum bigint, rebuy_fc numeric, rebuy_diamonds bigint,
 paid_places smallint, state text, registered_count bigint
)
language sql stable security definer set search_path=''
as $$
 select t.id,t.name,t.description,t.artwork_key,t.starts_at,t.entry_fc,
        t.diamond_initial,t.diamond_pass_cost,t.diamond_minimum,
        t.rebuy_fc,t.rebuy_diamonds,t.paid_places,t.state,
        (select count(*) from public.dfc_z37_tournament_players p where p.tournament_id=t.id)
 from public.dfc_z37_tournaments t
 where t.state in ('open','locked','running','settled')
 order by t.starts_at,t.name
 limit 100
$$;
revoke all on function public.dfc_z37_public_tournaments() from public;
grant execute on function public.dfc_z37_public_tournaments() to anon,authenticated;

create or replace function public.dfc_z37_public_points()
returns table(id uuid,name text,players smallint,target_points integer,entry_fc numeric,entry_diamonds bigint,admin_pct numeric)
language sql stable security definer set search_path=''
as $$
 select c.id,c.name,c.players,c.target_points,c.entry_fc,c.entry_diamonds,c.admin_pct
 from public.dfc_z37_points_configs c where c.enabled=true order by c.created_at desc limit 100
$$;
revoke all on function public.dfc_z37_public_points() from public;
grant execute on function public.dfc_z37_public_points() to anon,authenticated;

create or replace function public.dfc_z37_admin_tournaments()
returns setof public.dfc_z37_tournaments
language plpgsql security definer set search_path=''
as $$
begin
 if (select auth.uid()) is null or not public.dfc_z37_is_admin() then
   raise exception 'Acceso no autorizado';
 end if;
 return query select * from public.dfc_z37_tournaments order by created_at desc limit 200;
end $$;
revoke all on function public.dfc_z37_admin_tournaments() from public,anon;
grant execute on function public.dfc_z37_admin_tournaments() to authenticated;

create or replace function public.dfc_z37_admin_points()
returns setof public.dfc_z37_points_configs
language plpgsql security definer set search_path=''
as $$
begin
 if (select auth.uid()) is null or not public.dfc_z37_is_admin() then
   raise exception 'Acceso no autorizado';
 end if;
 return query select * from public.dfc_z37_points_configs order by created_at desc limit 200;
end $$;
revoke all on function public.dfc_z37_admin_points() from public,anon;
grant execute on function public.dfc_z37_admin_points() to authenticated;

create or replace function public.dfc_z37_admin_save_points(p_input jsonb)
returns uuid language plpgsql security definer set search_path=''
as $$
declare
 v_id uuid; v_name text; v_players smallint; v_target int;
 v_fc numeric; v_diamonds bigint; v_limit bigint; v_pct numeric;
begin
 if (select auth.uid()) is null or not public.dfc_z37_is_admin() then raise exception 'Acceso no autorizado'; end if;
 v_name=trim(p_input->>'name');
 v_players=(p_input->>'players')::smallint;
 v_target=(p_input->>'target_points')::int;
 v_fc=(p_input->>'entry_fc')::numeric;
 v_diamonds=(p_input->>'entry_diamonds')::bigint;
 v_limit=(p_input->>'max_negative_diamonds')::bigint;
 v_pct=(p_input->>'admin_pct')::numeric;
 if length(v_name) not between 1 and 160 or v_players not between 2 and 4 or v_target<1 or
    v_fc<0 or v_diamonds<0 or v_limit<0 or v_pct not between 0 and 50 then
    raise exception 'Configuración inválida';
 end if;
 if p_input ? 'id' and p_input->>'id' is not null then
  v_id=(p_input->>'id')::uuid;
  update public.dfc_z37_points_configs
  set name=v_name,players=v_players,target_points=v_target,entry_fc=v_fc,
      entry_diamonds=v_diamonds,max_negative_diamonds=v_limit,admin_pct=v_pct,updated_at=now()
  where id=v_id and enabled=false;
  if not found then raise exception 'Solo se pueden editar mesas desactivadas'; end if;
 else
  insert into public.dfc_z37_points_configs(name,players,target_points,entry_fc,entry_diamonds,max_negative_diamonds,admin_pct,enabled)
  values(v_name,v_players,v_target,v_fc,v_diamonds,v_limit,v_pct,false) returning id into v_id;
 end if;
 return v_id;
end $$;
revoke all on function public.dfc_z37_admin_save_points(jsonb) from public,anon;
grant execute on function public.dfc_z37_admin_save_points(jsonb) to authenticated;

create or replace function public.dfc_z37_admin_save_tournament(p_input jsonb)
returns uuid language plpgsql security definer set search_path=''
as $$
declare
 v_id uuid; v_name text; v_entry numeric; v_guarantee numeric; v_admin numeric;
 v_places int; v_prizes jsonb; v_total numeric:=0; v_pct numeric;
 v_start timestamptz; v_closes timestamptz; v_i int;
begin
 if (select auth.uid()) is null or not public.dfc_z37_is_admin() then raise exception 'Acceso no autorizado'; end if;
 v_name=trim(p_input->>'name');
 v_entry=(p_input->>'entry_fc')::numeric;
 v_guarantee=(p_input->>'guaranteed_fc')::numeric;
 v_admin=(p_input->>'signup_admin_pct')::numeric;
 v_places=(p_input->>'paid_places')::int;
 v_prizes=p_input->'prize_pct';
 v_start=(p_input->>'starts_at')::timestamptz;
 v_closes=(p_input->>'registration_closes_at')::timestamptz;
 if length(v_name) not between 1 and 160 or v_entry<0 or v_guarantee<0 or v_admin not between 0 and 100 or
    v_places not between 1 and 10 or jsonb_typeof(v_prizes)<>'array' or
    jsonb_array_length(v_prizes)<>v_places or v_closes>v_start or v_start<now() or
    (p_input->>'min_players')::int<2 then raise exception 'Parámetros inválidos'; end if;
 for v_i in 0..v_places-1 loop
   v_pct=(v_prizes->>v_i)::numeric;
   if v_pct<=0 or v_pct>100 then raise exception 'Porcentajes inválidos'; end if;
   v_total=v_total+v_pct;
 end loop;
 if (v_entry>0 and abs(v_total+v_admin-100)>0.001)
     or (v_entry=0 and (v_admin<>0 or abs(v_total-100)>0.001)) then
  raise exception 'Los porcentajes deben sumar exactamente 100';
 end if;
 if p_input ? 'id' and p_input->>'id' is not null then
  v_id=(p_input->>'id')::uuid;
  update public.dfc_z37_tournaments set
    name=v_name,description=coalesce(p_input->>'description',''),
    artwork_key=p_input->>'artwork_key',starts_at=v_start,registration_closes_at=v_closes,
    min_players=(p_input->>'min_players')::int,entry_fc=v_entry,guaranteed_fc=v_guarantee,
    diamond_initial=(p_input->>'diamond_initial')::bigint,
    diamond_pass_cost=(p_input->>'diamond_pass_cost')::bigint,
    diamond_minimum=(p_input->>'diamond_minimum')::bigint,
    rebuy_fc=(p_input->>'rebuy_fc')::numeric,rebuy_diamonds=(p_input->>'rebuy_diamonds')::bigint,
    paid_places=v_places,signup_admin_pct=v_admin,prize_pct=v_prizes,
    card_expiry_days=(p_input->>'card_expiry_days')::int,updated_at=now()
  where id=v_id and state='draft';
  if not found then raise exception 'Torneo cerrado para edición'; end if;
 else
  insert into public.dfc_z37_tournaments (
    name,description,artwork_key,starts_at,registration_closes_at,min_players,
    entry_fc,guaranteed_fc,diamond_initial,diamond_pass_cost,diamond_minimum,
    rebuy_fc,rebuy_diamonds,paid_places,signup_admin_pct,prize_pct,card_expiry_days
  ) values (
    v_name,coalesce(p_input->>'description',''),p_input->>'artwork_key',
    v_start,v_closes,(p_input->>'min_players')::int,
    v_entry,v_guarantee,(p_input->>'diamond_initial')::bigint,
    (p_input->>'diamond_pass_cost')::bigint,(p_input->>'diamond_minimum')::bigint,
    (p_input->>'rebuy_fc')::numeric,(p_input->>'rebuy_diamonds')::bigint,
    v_places,v_admin,v_prizes,(p_input->>'card_expiry_days')::int
  ) returning id into v_id;
  insert into public.dfc_z37_tournament_funds(tournament_id) values(v_id);
 end if;
 return v_id;
end $$;
revoke all on function public.dfc_z37_admin_save_tournament(jsonb) from public,anon;
grant execute on function public.dfc_z37_admin_save_tournament(jsonb) to authenticated;
