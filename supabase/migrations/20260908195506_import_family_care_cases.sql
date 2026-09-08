do $$
declare
  source record;
  org_id uuid;
  person_id uuid;
  family_id uuid;
  parts text[];
begin
  select id into org_id from public.organizations where slug = 'marshall-funeral-home';
  if org_id is null or to_regclass('public.family_cases') is null then return; end if;
  for source in select * from public.family_cases loop
    if exists (select 1 from public.cases where metadata->>'legacy_family_case_id' = source.id::text) then continue; end if;
    parts := regexp_split_to_array(trim(source.decedent_name), '\s+');
    insert into public.people (organization_id, first_name, last_name)
    values (org_id, coalesce(parts[1], 'Unknown'), coalesce(parts[array_length(parts, 1)], 'Unknown')) returning id into person_id;
    insert into public.families (organization_id, name, care_status, portal_enabled)
    values (org_id, coalesce(source.decedent_name, 'Family') || ' Family', source.status::text, true) returning id into family_id;
    insert into public.cases (organization_id, family_id, deceased_person_id, case_number, status, opened_at, closed_at, metadata)
    values (org_id, family_id, person_id, 'FC-' || upper(left(replace(source.id::text, '-', ''), 8)), case when source.completed_at is null then 'arrangement'::public.case_status else 'closed'::public.case_status end, source.created_at, source.completed_at, jsonb_build_object('legacy_family_case_id', source.id, 'legacy_packet_state', source.packet_state::text));
  end loop;
end $$;
