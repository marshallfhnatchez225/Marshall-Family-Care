alter table public.portal_links
  add column first_opened_at timestamptz,
  add column last_opened_at timestamptz,
  add column open_count integer not null default 0 check (open_count >= 0);

create or replace function public.record_portal_activity(
  target_link uuid,
  activity text,
  section_name text default null,
  record_id uuid default null
) returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  link public.portal_links;
  event_name text;
  event_key text;
  event_id uuid:=gen_random_uuid();
begin
  if (current_setting('request.jwt.claims',true)::jsonb->>'role') is distinct from 'service_role' then
    raise exception 'Service role required';
  end if;

  select * into link from public.portal_links where id=target_link and revoked_at is null;
  if not found then raise exception 'Portal link unavailable'; end if;

  event_name:=case activity
    when 'portal_opened' then 'PORTAL.OPENED'
    when 'form_opened' then 'FORM.OPENED'
    when 'form_saved' then 'FORM.SAVED'
    when 'form_submitted' then 'FORM.SUBMITTED'
    when 'file_uploaded' then 'PORTAL.FILE_UPLOADED'
    else null
  end;
  if event_name is null then raise exception 'Invalid portal activity'; end if;
  if activity like 'form_%' and coalesce(section_name,'') not in ('general','obituary','deathCertificate','embalming') then
    raise exception 'Invalid packet section';
  end if;

  if activity='portal_opened' then
    update public.portal_links set
      first_opened_at=coalesce(first_opened_at,now()),
      last_opened_at=now(),
      open_count=open_count+1
    where id=target_link;
    event_key:='portal-opened:'||target_link;
  elsif activity='form_opened' then
    event_key:='form-opened:'||target_link||':'||section_name;
  else
    event_key:=lower(replace(event_name,'.','-'))||':'||target_link||':'||event_id;
  end if;

  insert into public.events(id,organization_id,name,aggregate_type,aggregate_id,payload,idempotency_key)
  values(event_id,link.organization_id,event_name,'portal_links',link.id,
    jsonb_build_object('case_id',link.case_id,'portal_link_id',link.id,'section',section_name,'record_id',record_id),event_key)
  on conflict(organization_id,idempotency_key) do nothing;

  insert into public.activity_log(organization_id,action,entity_type,entity_id,changes)
  values(link.organization_id,event_name,'portal_links',link.id,
    jsonb_build_object('case_id',link.case_id,'section',section_name,'record_id',record_id));
end;
$$;

revoke all on function public.record_portal_activity(uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.record_portal_activity(uuid,text,text,uuid) to service_role;

create index portal_links_case_created_idx on public.portal_links(case_id,created_at desc);
