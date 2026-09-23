-- Browser-mediated delivery. No Google credentials or public worker endpoint.
create table public.voice_deliveries (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 case_id uuid not null references public.cases(id) on delete cascade,
 communication_id uuid not null unique references public.communications(id),
 portal_link_id uuid not null references public.portal_links(id),
 recipient text not null check(recipient ~ '^\+1[2-9][0-9]{9}$'),
 body text not null,
 status text not null default 'queued' check(status in ('queued','claimed','sending','sent','failed','uncertain','cancelled')),
 claim_token uuid, claimed_by uuid, lease_until timestamptz,
 evidence text, created_by uuid not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index voice_one_active_intake on public.voice_deliveries(case_id) where status <> 'cancelled';
alter table public.voice_deliveries enable row level security;
revoke all on public.voice_deliveries from anon,authenticated;
grant select(id,organization_id,case_id,communication_id,portal_link_id,recipient,body,status,claimed_by,lease_until,evidence,created_by,created_at,updated_at) on public.voice_deliveries to authenticated;
create policy voice_read on public.voice_deliveries for select to authenticated using(organization_id=public.current_organization_id() and private.os_permission('communications.read'));

create function private.audit_voice_delivery() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.activity_log(organization_id,actor_id,action,entity_type,entity_id,changes)
 values(new.organization_id,auth.uid(),'GOOGLE_VOICE.'||upper(new.status),'voice_deliveries',new.id,jsonb_build_object('case_id',new.case_id,'status',new.status));
 return new;
end $$;
revoke all on function private.audit_voice_delivery() from public,anon,authenticated;
create trigger audit_voice_delivery after insert or update of status on public.voice_deliveries for each row execute function private.audit_voice_delivery();

create function public.queue_voice_intake(target_case uuid, sections text[], link_hash text, portal_url text) returns uuid
language plpgsql security definer set search_path='' as $$
declare c public.cases; existing uuid; phone text; link_id uuid; comm_id uuid; job_id uuid; message text;
begin
 if not private.os_permission('communications.write') or not private.os_permission('cases.write') or not private.os_permission('documents.write') or not private.os_permission('families.write') then raise exception 'Intake sending permission required'; end if;
 select * into c from public.cases where id=target_case and organization_id=public.current_organization_id() for update;
 if not found then raise exception 'Case unavailable'; end if;
 select id into existing from public.voice_deliveries where case_id=c.id and status<>'cancelled';
 if found then return existing; end if;
 if c.stage<>'intake' then raise exception 'This case has already left Intake'; end if;
 if cardinality(sections) is null or cardinality(sections)<1 or not sections <@ array['embalming','general','obituary','deathCertificate']::text[] then raise exception 'Choose valid first-call documents'; end if;
 if portal_url !~ '^https://marshall-os\.vercel\.app/family/[A-Za-z0-9_-]{43}$' or link_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid private link'; end if;
 phone:=regexp_replace(coalesce(c.metadata->>'family_mobile',''),'[^0-9]','','g');
 if length(phone)=10 then phone:='1'||phone; end if;
 phone:='+'||phone;
 if phone !~ '^\+1[2-9][0-9]{9}$' then raise exception 'Enter a valid US family mobile number before sending'; end if;
 insert into public.portal_links(organization_id,case_id,token_hash,expires_at) values(c.organization_id,c.id,link_hash,now()+interval '7 days') returning id into link_id;
 message:='Marshall Funeral Home: Please complete your secure first-call documents: '||array_to_string(array(select case s when 'embalming' then 'Permission to Embalm' when 'general' then 'General Information' when 'obituary' then 'Obituary' else 'Death Certificate Worksheet' end from unnest(sections) s),', ')||E'\n\n'||portal_url||E'\n\nThis private link expires in 7 days. Reply here if you need help.';
 insert into public.communications(organization_id,case_id,channel,direction,subject,body,status,created_by) values(c.organization_id,c.id,'sms','outbound','Your Marshall Family Care first-call packet',message,'queued',auth.uid()) returning id into comm_id;
 insert into public.voice_deliveries(organization_id,case_id,communication_id,portal_link_id,recipient,body,created_by) values(c.organization_id,c.id,comm_id,link_id,phone,message,auth.uid()) returning id into job_id;
 update public.documents set status='requested',updated_at=now() where case_id=c.id and metadata->>'section'=any(sections) and status not in ('approved','submitted');
 update public.cases set metadata=metadata||jsonb_build_object('intake_prepared_at',now(),'intake_documents',sections,'voice_delivery_id',job_id),updated_at=now() where id=c.id;
 return job_id;
end $$;

create function public.voice_job_action(job_id uuid, command text, lease_token uuid default null, note text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
declare j public.voice_deliveries; c public.cases; phone text;
begin
 if not private.os_permission('communications.write') or not private.os_permission('cases.write') then raise exception 'Delivery permission required'; end if;
 -- Lock case before job, matching enqueue; serializes manual and browser delivery.
 select c1.* into c from public.cases c1 join public.voice_deliveries d on d.case_id=c1.id where d.id=job_id and d.organization_id=public.current_organization_id() for update of c1;
 if not found then raise exception 'Delivery unavailable'; end if;
 select * into j from public.voice_deliveries where id=job_id for update;
 if j.status in ('claimed','sending') and j.lease_until<now() then
  update public.voice_deliveries set status='uncertain',evidence='Worker interrupted. Inspect Google Voice before resolving.',updated_at=now() where id=j.id returning * into j;
  update public.communications set status='uncertain' where id=j.communication_id;
  return to_jsonb(j)-'claim_token';
 end if;
 if command in ('claim','begin') then
  if command='claim' and j.status<>'queued' then raise exception 'This delivery is not queued'; end if;
  if command='begin' and (j.status<>'claimed' or j.claim_token is distinct from lease_token or j.claimed_by is distinct from auth.uid()) then raise exception 'Delivery claim is no longer valid'; end if;
  phone:=regexp_replace(coalesce(c.metadata->>'family_mobile',''),'[^0-9]','','g');
  if length(phone)=10 then phone:='1'||phone; end if;
  if '+'||phone<>j.recipient or c.stage<>'intake' or not exists(select 1 from public.portal_links where id=j.portal_link_id and revoked_at is null and expires_at>now()+interval '15 minutes') then
   update public.voice_deliveries set status='cancelled',evidence='Contact, case stage, or private link changed.',updated_at=now() where id=j.id returning * into j;
   update public.communications set status='failed' where id=j.communication_id;
   return to_jsonb(j)-'claim_token';
  end if;
  update public.voice_deliveries set status=case command when 'claim' then 'claimed' else 'sending' end,claim_token=case command when 'claim' then gen_random_uuid() else claim_token end,claimed_by=auth.uid(),lease_until=now()+interval '10 minutes',updated_at=now() where id=j.id returning * into j;
  return to_jsonb(j);
 elsif command='cancel' then
  if j.status<>'queued' then raise exception 'Only an unclaimed queued delivery can be cancelled'; end if;
  update public.voice_deliveries set status='cancelled',evidence='Cancelled by staff before sending.',updated_at=now() where id=j.id returning * into j;
  update public.communications set status='failed' where id=j.communication_id;
  update public.portal_links set revoked_at=now() where id=j.portal_link_id;
 elsif command in ('sent','failed','uncertain') then
  if j.status not in ('claimed','sending') or j.claim_token is distinct from lease_token or j.claimed_by is distinct from auth.uid() then raise exception 'Delivery claim is no longer valid'; end if;
  if command='sent' and j.status<>'sending' then raise exception 'Begin sending before confirming success'; end if;
  if command='failed' and j.status='sending' then raise exception 'A send attempt must be held as uncertain'; end if;
  if length(trim(note))<10 then raise exception 'Record verification evidence or the failure reason'; end if;
  update public.voice_deliveries set status=command,evidence=left(note,2000),updated_at=now() where id=j.id returning * into j;
 elsif command in ('resolve-sent','resolve-unsent') then
  if j.status not in ('uncertain','failed') then raise exception 'Only held deliveries need reconciliation'; end if;
  if length(trim(note))<20 then raise exception 'Record what you checked in Google Voice'; end if;
  update public.voice_deliveries set status=case command when 'resolve-sent' then 'sent' else 'cancelled' end,evidence=left(note,2000),updated_at=now() where id=j.id returning * into j;
  if command='resolve-unsent' then update public.portal_links set revoked_at=now() where id=j.portal_link_id; end if;
 else raise exception 'Unknown delivery action'; end if;
 if j.status='sent' then
  update public.communications set status='sent',sent_at=now() where id=j.communication_id;
  update public.cases set stage=case when stage='intake' then 'arrangement' else stage end,status=case when stage='intake' then 'arrangement' else status end,metadata=metadata||jsonb_build_object('intake_sent_at',now(),'intake_delivery_method','google_voice_browser'),updated_at=now() where id=c.id;
 elsif j.status in ('failed','uncertain','cancelled') then
  update public.communications set status=case when j.status='uncertain' then 'uncertain' else 'failed' end where id=j.communication_id;
 end if;
 return to_jsonb(j)-'claim_token';
end $$;
revoke all on function public.queue_voice_intake(uuid,text[],text,text) from public,anon;
revoke all on function public.voice_job_action(uuid,text,uuid,text) from public,anon;
grant execute on function public.queue_voice_intake(uuid,text[],text,text), public.voice_job_action(uuid,text,uuid,text) to authenticated;
