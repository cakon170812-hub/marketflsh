-- Create independent configurations for the existing Domino engine.
create function public.dfc_z37_admin_create_domino_config(
 p_name text, p_mode text, p_min_entry numeric
) returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_name text := pg_catalog.btrim(p_name);
 v_id smallint;
begin
 if not coalesce(public.rf_is_leader(auth.uid()),false) then
  raise exception 'Solo Administrador Líder';
 end if;
 if v_name is null or pg_catalog.length(v_name) not between 1 and 80
    or p_mode is null or p_mode not in ('normal','paid_pass')
    or p_min_entry is null or p_min_entry not between 0.001 and 999999999.999
    or p_min_entry <> pg_catalog.round(p_min_entry,3) then
  raise exception 'Nombre, modalidad o entrada mínima inválidos';
 end if;

 -- Serialize allocation and retries. Each amount remains independent.
 perform pg_catalog.pg_advisory_xact_lock(1242999999::bigint);
 select c.id into v_id
 from public.rf_domino_configs c
 where c.id > 7 and c.mode=p_mode and c.name=v_name and c.min_entry=p_min_entry
 order by c.id limit 1;
 if found then return v_id; end if;

 select i::smallint into v_id
 from pg_catalog.generate_series(8,32767) i
 where not exists (select 1 from public.rf_domino_configs c where c.id=i)
 order by i limit 1;
 if v_id is null then
  raise exception 'Se alcanzó el límite del catálogo de mesas';
 end if;
 insert into public.rf_domino_configs(id,name,mode,min_entry,active)
 values(v_id,v_name,p_mode,p_min_entry,false);
 return v_id;
end;
$;
revoke all on function public.dfc_z37_admin_create_domino_config(text,text,numeric) from public,anon;
grant execute on function public.dfc_z37_admin_create_domino_config(text,text,numeric) to authenticated;
