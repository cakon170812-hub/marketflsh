alter table public.dfc_z37_tournaments add column visible boolean not null default false;

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
        t.rebuy_fc,t.rebuy_diamonds,t.paid_places,case when t.state='draft' then 'scheduled' else t.state end,
        (select count(*) from public.dfc_z37_tournament_players p where p.tournament_id=t.id)
 from public.dfc_z37_tournaments t
 where (t.state='draft' and t.visible) or t.state in ('open','locked','running','settled')
 order by t.starts_at,t.name
 limit 100
$$;
revoke all on function public.dfc_z37_public_tournaments() from public;
grant execute on function public.dfc_z37_public_tournaments() to anon,authenticated;

create or replace function public.dfc_z37_admin_save_tournament(p_input jsonb)
returns uuid language plpgsql security definer set search_path=''
as $$
declare
 v_visible boolean;
 v_id uuid; v_name text; v_entry numeric; v_guarantee numeric; v_admin numeric;
 v_places int; v_prizes jsonb; v_total numeric:=0; v_pct numeric;
 v_start timestamptz; v_closes timestamptz; v_i int;
begin
 if (select auth.uid()) is null or not public.dfc_z37_is_admin() then raise exception 'Acceso no autorizado'; end if;
 v_visible=(p_input->>'visible')::boolean;
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
    card_expiry_days=(p_input->>'card_expiry_days')::int,visible=coalesce(v_visible,visible),updated_at=now()
  where id=v_id and state='draft';
  if not found then raise exception 'Torneo cerrado para edición'; end if;
 else
  insert into public.dfc_z37_tournaments (
    name,description,artwork_key,starts_at,registration_closes_at,min_players,
    entry_fc,guaranteed_fc,diamond_initial,diamond_pass_cost,diamond_minimum,
    rebuy_fc,rebuy_diamonds,paid_places,signup_admin_pct,prize_pct,card_expiry_days,visible
  ) values (
    v_name,coalesce(p_input->>'description',''),p_input->>'artwork_key',
    v_start,v_closes,(p_input->>'min_players')::int,
    v_entry,v_guarantee,(p_input->>'diamond_initial')::bigint,
    (p_input->>'diamond_pass_cost')::bigint,(p_input->>'diamond_minimum')::bigint,
    (p_input->>'rebuy_fc')::numeric,(p_input->>'rebuy_diamonds')::bigint,
    v_places,v_admin,v_prizes,(p_input->>'card_expiry_days')::int,coalesce(v_visible,false)
  ) returning id into v_id;
  insert into public.dfc_z37_tournament_funds(tournament_id) values(v_id);
 end if;
 return v_id;
end;
$$;
revoke all on function public.dfc_z37_admin_save_tournament(jsonb) from public,anon;
grant execute on function public.dfc_z37_admin_save_tournament(jsonb) to authenticated;
