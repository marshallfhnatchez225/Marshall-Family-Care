-- Run against the migrated database; all test data rolls back.
begin;
select set_config('request.jwt.claims',jsonb_build_object('sub','74ffa207-18dc-46e9-8fcd-8bcae75e9a4b','role','authenticated','app_metadata',jsonb_build_object('organization_id',(select id from public.organizations where slug='marshall-funeral-home')))::text,true);
set local role authenticated;
do $$
declare cid uuid; did uuid; n integer; org uuid:=public.current_organization_id();
begin
 cid:=public.create_pipeline_case('WORKFLOW VERIFICATION ONLY','','');
 if (select count(*) from public.documents where case_id=cid)<>4 then raise exception 'Packet initialization failed'; end if;
 insert into public.services(organization_id,case_id,kind,title,starts_at) values(org,cid,'arrangement','Test appointment',now()+interval '1 day');
 if not exists(select 1 from public.events where payload->>'case_id'=cid::text and name='ARRANGEMENT.SCHEDULED') then raise exception 'Arrangement event missing'; end if;
 update public.documents set status='approved' where case_id=cid and kind='obituary';
 select count(*) into n from public.events where payload->>'case_id'=cid::text and name='CASE.OBITUARY_APPROVED';
 if n<>1 then raise exception 'Approval event missing'; end if;
 update public.documents set status='approved' where case_id=cid and kind='obituary';
 if (select count(*) from public.events where payload->>'case_id'=cid::text and name='CASE.OBITUARY_APPROVED')<>n then raise exception 'Duplicate approval event'; end if;
 insert into public.documents(organization_id,case_id,kind,title,status) values(org,cid,'death_certificate','Test certificates','ready') returning id into did;
 if not exists(select 1 from public.events where aggregate_id=did and name='DEATH_CERTIFICATES.READY') then raise exception 'Certificate event missing'; end if;
 if (select count(*) from public.communications where case_id=cid and status='draft')<>3 then raise exception 'Notification drafts missing'; end if;
 if exists(select 1 from public.communications where case_id=cid and sent_at is not null) then raise exception 'Draft falsely marked sent'; end if;
 insert into public.tasks(organization_id,case_id,title,family_visible) values(org,cid,'Test checklist',true);
 update public.tasks set status='done' where case_id=cid;
 if not exists(select 1 from public.events where payload->>'case_id'=cid::text and name='CHECKLIST.COMPLETED') then raise exception 'Checklist event missing'; end if;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000001','role','authenticated','app_metadata',jsonb_build_object('organization_id',(select id from public.organizations where slug='marshall-funeral-home')))::text,true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.cases) then raise exception 'Unassigned user can read cases'; end if;
 if private.os_permission('cases.write') then raise exception 'Unassigned user has write permission'; end if;
 if exists(select 1 from public.portal_links) then raise exception 'Unassigned user can read links'; end if;
end $$;
reset role;
rollback;

