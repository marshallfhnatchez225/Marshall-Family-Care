-- Existing Family Care records are retained; canonical OS records carry the workflow.
alter table public.cases add column stage text not null default 'arrangement'
  check (stage in ('intake','arrangement','documents','approvals','service','certificates','aftercare','complete'));
alter table public.tasks add column family_visible boolean not null default false;
alter table public.communications add column status text not null default 'draft'
  check (status in ('draft','sent','failed'));
create table public.portal_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  case_id uuid not null references public.cases(id) on delete cascade,
  token_hash text unique not null check(length(token_hash)=64),
  expires_at timestamptz not null, revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.portal_links enable row level security;
revoke all on public.portal_links from anon, authenticated;
grant select,insert,update on public.portal_links to authenticated;

create or replace function private.os_permission(permission text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.users u
 join public.user_roles ur on ur.user_id=u.id and ur.organization_id=u.organization_id
 join public.roles r on r.id=ur.role_id and r.organization_id=u.organization_id
 where u.id=(select auth.uid()) and u.status='active'
 and u.organization_id=(select public.current_organization_id())
 and (r.permissions @> array['*'] or r.permissions @> array[permission]
 or r.permissions @> array[split_part(permission,'.',1)||'.*']));
$$;
revoke all on function private.os_permission(text) from public,anon;
grant execute on function private.os_permission(text) to authenticated;
grant usage on schema private to authenticated;

-- Enforce the already-defined role permissions at the database boundary.
do $$ declare t text; p record; resource text; begin
 foreach t in array array['cases','families','people','documents','tasks','services','communications','portal_links','roles','user_roles','users'] loop
  resource:=case when t='portal_links' then 'families' when t='people' then 'families' when t in ('roles','user_roles','users') then 'settings' else t end;
  for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
   execute format('drop policy %I on public.%I',p.policyname,t);
  end loop;
  execute format('create policy os_read on public.%I for select to authenticated using (organization_id=(select public.current_organization_id()) and (select private.os_permission(%L)))',t,resource||'.read');
  execute format('create policy os_insert on public.%I for insert to authenticated with check (organization_id=(select public.current_organization_id()) and (select private.os_permission(%L)))',t,resource||case when resource='settings' then '.manage' else '.write' end);
  execute format('create policy os_update on public.%I for update to authenticated using (organization_id=(select public.current_organization_id()) and (select private.os_permission(%L))) with check (organization_id=(select public.current_organization_id()) and (select private.os_permission(%L)))',t,resource||case when resource='settings' then '.manage' else '.write' end,resource||case when resource='settings' then '.manage' else '.write' end);
 end loop;
end $$;
create policy own_user on public.users for select to authenticated using (id=(select auth.uid()));
create policy own_roles on public.user_roles for select to authenticated using (user_id=(select auth.uid()));
create policy assigned_roles on public.roles for select to authenticated using (exists(select 1 from public.user_roles ur where ur.role_id=id and ur.user_id=(select auth.uid())));

create index documents_case_updated_idx on public.documents(case_id,updated_at desc);
create index tasks_case_idx on public.tasks(case_id);
create index services_case_idx on public.services(case_id);
create index communications_case_idx on public.communications(case_id,created_at desc);
create index portal_links_case_idx on public.portal_links(case_id);
create index events_case_payload_idx on public.events((payload->>'case_id'),occurred_at desc);
create unique index documents_packet_section_idx on public.documents(case_id,(metadata->>'section')) where metadata ? 'section';
create unique index services_arrangement_case_idx on public.services(case_id) where kind='arrangement';
create unique index documents_certificates_case_idx on public.documents(case_id) where kind='death_certificate';

-- Copy existing structured responses without overwriting or removing the source portal.
update public.cases c set metadata=c.metadata || jsonb_build_object(
 'decedent_name',f.decedent_name,'family_email',f.family_email,'family_mobile',f.family_mobile,
 'arrangement_sheet',f.arrangement_sheet,'next_promised_update',f.next_promised_update)
 from public.family_cases f where c.metadata->>'legacy_family_case_id'=f.id::text;
insert into public.documents(organization_id,case_id,family_id,kind,title,status,metadata)
select c.organization_id,c.id,c.family_id,
 case s.section_key::text when 'obituary' then 'obituary' when 'deathCertificate' then 'death_certificate_worksheet' when 'embalming' then 'authorization' else 'family_information' end,
 case s.section_key::text when 'obituary' then 'Obituary' when 'deathCertificate' then 'Death Certificate Worksheet' when 'embalming' then 'Permission to Embalm' else 'General Information' end,
 s.review_status::text,jsonb_build_object('section',s.section_key,'responses',s.responses,'family_visible',true,'legacy_section_id',s.id)
from public.cases c join public.packet_sections s on s.case_id::text=c.metadata->>'legacy_family_case_id'
on conflict do nothing;

insert into public.documents(organization_id,case_id,family_id,kind,title,status,storage_path,metadata)
select c.organization_id,c.id,c.family_id,'attachment',a.original_name,'received',a.object_path,
 jsonb_build_object('family_visible',true,'storage_bucket',a.bucket_id,'legacy_asset_id',a.id)
from public.cases c join public.uploaded_assets a on a.case_id::text=c.metadata->>'legacy_family_case_id';

create function private.os_validate_case() returns trigger language plpgsql set search_path='' as $$
begin
 if new.case_id is not null and not exists(select 1 from public.cases c where c.id=new.case_id and c.organization_id=new.organization_id) then
 raise exception 'Case is unavailable in this organization'; end if;
 return new;
end $$;
do $$ declare t text; begin foreach t in array array['documents','tasks','services','communications','portal_links'] loop
execute format('create trigger os_validate_case before insert or update on public.%I for each row execute function private.os_validate_case()',t);
end loop; end $$;

-- Trigger events and notification drafts commit in the same transaction as the change.
drop trigger documents_emit_events on public.documents;
create function private.os_workflow_event() returns trigger language plpgsql security definer set search_path='' as $$
declare event_name text; cid uuid; subject_line text; event_id uuid:=gen_random_uuid(); actor uuid;
begin
 if (current_setting('request.jwt.claims',true)::jsonb->>'role') is distinct from 'service_role' and
 (auth.uid() is null or new.organization_id is distinct from public.current_organization_id()) then raise exception 'Unauthorized workflow change'; end if;
 actor:=auth.uid();
 if not exists(select 1 from public.users where id=actor) then actor:=null; end if;
 if tg_table_name='cases' then
  cid:=new.id;
  if tg_op='INSERT' then event_name:='CASE.CREATED';
  elsif new.stage is distinct from old.stage then event_name:='CASE.STAGE_CHANGED'; else return new; end if;
 elsif tg_table_name='documents' then
  cid:=new.case_id;
  if tg_op='UPDATE' and new.status is not distinct from old.status then return new; end if;
  if new.kind='obituary' and new.status='approved' then event_name:='CASE.OBITUARY_APPROVED'; subject_line:='Obituary information approved';
  elsif new.kind='death_certificate' then event_name:='DEATH_CERTIFICATES.'||upper(new.status); subject_line:='Death certificates: '||replace(new.status,'_',' ');
  elsif new.status='submitted' or new.status='received' then event_name:='DOCUMENT.RECEIVED';
  elsif new.status='requested' then event_name:='DOCUMENT.REQUESTED'; subject_line:='Document requested: '||new.title;
  else event_name:='DOCUMENT.UPDATED'; end if;
 elsif tg_table_name='services' then
  cid:=new.case_id;
  if new.kind<>'arrangement' then return new; end if;
  if tg_op='UPDATE' and new.starts_at is not distinct from old.starts_at and new.status is not distinct from old.status then return new; end if;
  event_name:=case when new.status='cancelled' then 'ARRANGEMENT.CANCELLED' else 'ARRANGEMENT.SCHEDULED' end;
  subject_line:=case when new.status='cancelled' then 'Arrangement appointment cancelled' else 'Arrangement appointment scheduled' end;
 elsif tg_table_name='tasks' then
  cid:=new.case_id;
  if tg_op='UPDATE' and new.status is not distinct from old.status then return new; end if;
  event_name:=case when new.status='done' then 'CHECKLIST.COMPLETED' else 'CHECKLIST.UPDATED' end;
 else return new; end if;
 insert into public.events(id,organization_id,name,aggregate_type,aggregate_id,actor_id,payload,idempotency_key)
 values(event_id,new.organization_id,event_name,tg_table_name,new.id,actor,
 jsonb_build_object('case_id',cid,'record_id',new.id),event_id::text);
 insert into public.activity_log(organization_id,actor_id,action,entity_type,entity_id) values(new.organization_id,actor,event_name,tg_table_name,new.id);
 if subject_line is not null and cid is not null then
 insert into public.communications(organization_id,case_id,channel,direction,subject,body,status,created_by)
 values(new.organization_id,cid,'internal','outbound',subject_line,
 subject_line||'. Please contact Marshall Funeral Home for details.','draft',actor);
 end if;
 return new;
end $$;
revoke all on function private.os_workflow_event() from public,anon,authenticated;
do $$ declare t text; begin foreach t in array array['cases','documents','services','tasks'] loop
execute format('create trigger os_workflow_event after insert or update on public.%I for each row execute function private.os_workflow_event()',t);
end loop; end $$;

create function public.create_pipeline_case(decedent text, contact_email text, contact_mobile text) returns uuid
language plpgsql security invoker set search_path='' as $$
declare org uuid:=public.current_organization_id(); fid uuid; cid uuid;
begin
 if not private.os_permission('cases.write') then raise exception 'Case permission required'; end if;
 if length(trim(decedent)) not between 2 and 200 then raise exception 'Enter the decedent name'; end if;
 insert into public.families(organization_id,name,portal_enabled) values(org,trim(decedent)||' Family',true) returning id into fid;
 insert into public.cases(organization_id,family_id,case_number,stage,status,metadata)
 values(org,fid,'MF-'||upper(substr(gen_random_uuid()::text,1,8)),'intake','intake',jsonb_build_object('decedent_name',trim(decedent),'family_email',contact_email,'family_mobile',contact_mobile)) returning id into cid;
 insert into public.documents(organization_id,case_id,family_id,kind,title,status,metadata)
 select org,cid,fid,k,t,'incomplete',jsonb_build_object('section',s,'responses','{}'::jsonb,'family_visible',true)
 from (values ('general','family_information','General Information'),('obituary','obituary','Obituary'),('deathCertificate','death_certificate_worksheet','Death Certificate Worksheet'),('embalming','authorization','Permission to Embalm')) as sections(s,k,t);
 return cid;
end $$;
revoke all on function public.create_pipeline_case(text,text,text) from public,anon;
grant execute on function public.create_pipeline_case(text,text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('marshall-documents','marshall-documents',false,5242880,array['application/pdf','image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy os_documents_read on storage.objects for select to authenticated using
 (bucket_id='marshall-documents' and (storage.foldername(name))[1]=public.current_organization_id()::text and (select private.os_permission('documents.read')));
create policy os_documents_insert on storage.objects for insert to authenticated with check
 (bucket_id='marshall-documents' and (storage.foldername(name))[1]=public.current_organization_id()::text and (select private.os_permission('documents.write')));
create policy os_documents_delete on storage.objects for delete to authenticated using
 (bucket_id='marshall-documents' and (storage.foldername(name))[1]=public.current_organization_id()::text and (select private.os_permission('documents.write')));
