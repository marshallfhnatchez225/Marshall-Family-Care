create table public.delivery_settings (
 organization_id uuid primary key references public.organizations(id),
 email_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.delivery_settings enable row level security;
revoke all on public.delivery_settings from anon,authenticated;
grant select,insert,update on public.delivery_settings to authenticated;
create policy delivery_settings_read on public.delivery_settings for select to authenticated using(organization_id=public.current_organization_id() and private.os_permission('settings.manage'));
create policy delivery_settings_insert on public.delivery_settings for insert to authenticated with check(organization_id=public.current_organization_id() and private.os_permission('settings.manage'));
create policy delivery_settings_update on public.delivery_settings for update to authenticated using(organization_id=public.current_organization_id() and private.os_permission('settings.manage')) with check(organization_id=public.current_organization_id() and private.os_permission('settings.manage'));

create table public.email_deliveries (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 communication_id uuid not null unique references public.communications(id) on delete cascade,
 case_id uuid not null references public.cases(id) on delete cascade,
 recipient text not null,
 subject text not null,
 body text not null,
 status text not null default 'pending' check(status in ('pending','sending','accepted','failed','uncertain','cancelled')),
 attempts integer not null default 0,
 available_at timestamptz not null default now(),
 started_at timestamptz,
 provider_id text,
 last_error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.email_deliveries enable row level security;
revoke all on public.email_deliveries from anon,authenticated;
grant select on public.email_deliveries to authenticated;
create policy email_deliveries_read on public.email_deliveries for select to authenticated using(organization_id=public.current_organization_id() and private.os_permission('communications.read'));
create index email_deliveries_pending on public.email_deliveries(organization_id,available_at) where status='pending';
alter table public.communications drop constraint communications_status_check;
alter table public.communications add constraint communications_status_check check(status in ('draft','sent','failed','queued','accepted','uncertain'));

create function private.queue_family_email() returns trigger language plpgsql security definer set search_path='' as $$
declare contact jsonb; destination text;
begin
 if new.direction<>'outbound' or new.status<>'draft' or new.channel<>'internal' or new.case_id is null then return new; end if;
 if not exists(select 1 from public.delivery_settings where organization_id=new.organization_id and email_enabled) then return new; end if;
 select metadata into contact from public.cases where id=new.case_id and organization_id=new.organization_id;
 if contact->>'email_updates_enabled' is distinct from 'true' then return new; end if;
 destination:=trim(contact->>'family_email');
 if destination is null or destination !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then return new; end if;
 insert into public.email_deliveries(organization_id,communication_id,case_id,recipient,subject,body)
 values(new.organization_id,new.id,new.case_id,destination,coalesce(new.subject,'Marshall Family Care update'),coalesce(new.body,'')) on conflict(communication_id) do nothing;
 update public.communications set status='queued',channel='email' where id=new.id;
 return new;
end $$;
revoke all on function private.queue_family_email() from public,anon,authenticated;
create trigger queue_family_email after insert on public.communications for each row execute function private.queue_family_email();

create function public.claim_family_email(target_org uuid) returns setof public.email_deliveries language plpgsql security invoker set search_path='' as $$
declare item public.email_deliveries;
begin
 -- Only service_role can execute; never automatically resend an ambiguous attempt.
 update public.email_deliveries set status='uncertain',last_error='Interrupted delivery; check Gmail Sent before taking further action.',updated_at=now()
 where organization_id=target_org and status='sending' and started_at<now()-interval '5 minutes';
 update public.communications c set status='uncertain' from public.email_deliveries d where c.id=d.communication_id and d.organization_id=target_org and d.status='uncertain' and c.status='queued';
 if not exists(select 1 from public.delivery_settings where organization_id=target_org and email_enabled) then return; end if;
 select * into item from public.email_deliveries where organization_id=target_org and status='pending' and available_at<=now() and attempts<3 order by created_at for update skip locked limit 1;
 if not found then return; end if;
 if not exists(select 1 from public.cases where id=item.case_id and organization_id=target_org and metadata->>'email_updates_enabled'='true' and trim(metadata->>'family_email')=item.recipient) then
 update public.email_deliveries set status='cancelled',last_error='Family contact or email permission changed.',updated_at=now() where id=item.id;
 update public.communications set status='draft',channel='internal' where id=item.communication_id;
 return;
 end if;
 return query update public.email_deliveries set status='sending',attempts=attempts+1,started_at=now(),updated_at=now() where id=item.id returning *;
end $$;
revoke all on function public.claim_family_email(uuid) from public,anon,authenticated;
grant execute on function public.claim_family_email(uuid) to service_role;
