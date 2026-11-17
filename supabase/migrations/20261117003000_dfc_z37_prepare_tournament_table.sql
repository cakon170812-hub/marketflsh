alter table public.dfc_z37_tournaments
 add column engine_table_id bigint unique references public.rf_domino_tables(id);

create function public.dfc_z37_admin_prepare_tournament_table(p_tournament uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_tournament public.dfc_z37_tournaments%rowtype;
 v_template public.rf_domino_configs%rowtype;
 v_config_id smallint;
 v_table_id bigint;
begin
 if auth.uid() is null or not coalesce(public.dfc_z37_is_admin(),false) then
  raise exception 'Acceso no autorizado';
 end if;

 select * into v_tournament
 from public.dfc_z37_tournaments
 where id=p_tournament
 for update;
 if not found then
  raise exception 'Torneo no encontrado';
 end if;
 if v_tournament.engine_table_id is not null then
  return v_tournament.engine_table_id;
 end if;
 if v_tournament.state <> 'draft' or v_tournament.starts_at <= now() then
  raise exception 'Solo se puede preparar la mesa de un torneo futuro en edición';
 end if;

 select * into v_template
 from public.rf_domino_configs
 where mode='paid_pass'
 order by active desc,id
 limit 1;
 if not found then
  raise exception 'No hay una configuración de Pintintín para usar como base';
 end if;

 perform pg_catalog.pg_advisory_xact_lock(1242999999::bigint);
 select candidate.id::smallint into v_config_id
 from pg_catalog.generate_series(8,32767) as candidate(id)
 where not exists (select 1 from public.rf_domino_configs c where c.id=candidate.id)
 order by candidate.id
 limit 1;
 if v_config_id is null then
  raise exception 'Se alcanzó el límite del catálogo de mesas';
 end if;

 -- The event configuration stays inactive until dedicated admission and settlement exist.
 insert into public.rf_domino_configs
  (id,name,mode,active,min_entry,hand_stake,commission_pct,pass_fee,min_continue_balance,turn_seconds,shuffle_seconds)
 values
  (v_config_id,pg_catalog.left(v_tournament.name,80),'paid_pass',false,v_template.min_entry,0,0,0,0,v_template.turn_seconds,v_template.shuffle_seconds);

 insert into public.rf_domino_tables(config_id,table_no)
 values(v_config_id,1)
 returning id into v_table_id;

 update public.dfc_z37_tournaments
 set engine_table_id=v_table_id,updated_at=now()
 where id=p_tournament;

 return v_table_id;
end;
$$;

revoke all on function public.dfc_z37_admin_prepare_tournament_table(uuid) from public,anon,authenticated;
grant execute on function public.dfc_z37_admin_prepare_tournament_table(uuid) to authenticated;
