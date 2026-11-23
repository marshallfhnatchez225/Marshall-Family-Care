-- Opt-in integration principals. The migration does not provision any credential.
create table private.packet_status_readers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade
);

alter table private.packet_status_readers enable row level security;
revoke all on private.packet_status_readers from public, anon, authenticated, service_role;

-- PostgREST supplies the authenticated caller. No caller-selected organization,
-- filters, case identifiers, or rows leave this function.
create function public.family_packet_status_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  target_org uuid;
  summary jsonb;
  standard_sections constant text[] := array['embalming', 'general', 'obituary', 'deathCertificate'];
begin
  if caller_id is null
     or (auth.jwt()->>'role') is distinct from 'authenticated'
     or nullif(auth.jwt()->'app_metadata'->>'organization_id', '') is not null
     or exists (select 1 from public.users u where u.id = caller_id)
     or exists (select 1 from public.staff_profiles p where p.user_id = caller_id) then
    raise exception using errcode = '42501', message = 'Packet status access denied';
  end if;

  select r.organization_id into target_org
  from private.packet_status_readers r
  where r.user_id = caller_id;

  if not found then
    raise exception using errcode = '42501', message = 'Packet status access denied';
  end if;

  with sent_cases as (
    select c.id, c.metadata->'intake_documents' as intake_documents,
           delivery.replacement_sent
    from public.cases c
    cross join lateral (
      select
        coalesce(bool_or(m.subject = 'Your Marshall Family Care first-call packet'), false) as initial_sent,
        coalesce(bool_or(m.subject = 'Resent Marshall Family Care packet'), false) as replacement_sent
      from public.communications m
      where m.organization_id = target_org and m.case_id = c.id
        and m.direction = 'outbound' and m.status = 'sent' and m.sent_at is not null
        and m.subject in ('Your Marshall Family Care first-call packet', 'Resent Marshall Family Care packet')
    ) delivery
    where c.organization_id = target_org
      and c.closed_at is null and c.status <> 'closed' and c.stage <> 'complete'
      and (nullif(btrim(c.metadata->>'intake_sent_at'), '') is not null
           or delivery.initial_sent or delivery.replacement_sent)
  ), required_sections as (
    select c.id, s.section
    from sent_cases c
    cross join lateral unnest(standard_sections) s(section)
    where c.replacement_sent
      or not exists (select 1 from unnest(standard_sections) k(section)
                     where jsonb_typeof(c.intake_documents) = 'array'
                       and c.intake_documents ? k.section)
      or (jsonb_typeof(c.intake_documents) = 'array' and c.intake_documents ? s.section)
  ), case_status as (
    select r.id,
      bool_and(coalesce(d.status in ('submitted', 'approved'), false)) as submitted,
      coalesce(bool_or(d.status = 'needs-follow-up'), false) as follow_up
    from required_sections r
    left join public.documents d
      on d.organization_id = target_org and d.case_id = r.id
      and d.metadata->>'section' = r.section
      and d.kind = case r.section
        when 'embalming' then 'authorization'
        when 'general' then 'family_information'
        when 'obituary' then 'obituary'
        when 'deathCertificate' then 'death_certificate_worksheet'
      end
    group by r.id
  )
  select jsonb_build_object(
    'sent', count(*),
    'submitted', count(*) filter (where submitted),
    'waiting', count(*) filter (where not submitted),
    'needs_follow_up', count(*) filter (where follow_up)
  ) into summary
  from case_status;

  return summary;
end;
$$;

revoke all on function public.family_packet_status_summary() from public, anon, authenticated, service_role;
grant execute on function public.family_packet_status_summary() to authenticated;
