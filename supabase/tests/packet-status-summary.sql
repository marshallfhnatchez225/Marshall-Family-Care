-- Run as the database administrator on a migrated local/test database.
begin;

select set_config('request.jwt.claims', '{"role":"service_role"}', true);

insert into auth.users(id, email) values
  ('24000000-0000-4000-8000-000000000001', 'packet-test-reader-a@example.invalid'),
  ('24000000-0000-4000-8000-000000000002', 'packet-test-reader-b@example.invalid'),
  ('24000000-0000-4000-8000-000000000003', 'packet-test-not-allowed@example.invalid'),
  ('24000000-0000-4000-8000-000000000004', 'packet-test-staff@example.invalid'),
  ('24000000-0000-4000-8000-000000000005', 'packet-test-empty@example.invalid'),
  ('24000000-0000-4000-8000-000000000006', 'packet-test-legacy-staff@example.invalid');

insert into public.organizations(id, name, slug) values
  ('25000000-0000-4000-8000-000000000001', 'Synthetic test A', 'packet-status-fixture-a'),
  ('25000000-0000-4000-8000-000000000002', 'Synthetic test B', 'packet-status-fixture-b'),
  ('25000000-0000-4000-8000-000000000003', 'Synthetic test empty', 'packet-status-fixture-empty');

insert into private.packet_status_readers(user_id, organization_id) values
  ('24000000-0000-4000-8000-000000000001', '25000000-0000-4000-8000-000000000001'),
  ('24000000-0000-4000-8000-000000000002', '25000000-0000-4000-8000-000000000002'),
  ('24000000-0000-4000-8000-000000000004', '25000000-0000-4000-8000-000000000001'),
  ('24000000-0000-4000-8000-000000000005', '25000000-0000-4000-8000-000000000003'),
  ('24000000-0000-4000-8000-000000000006', '25000000-0000-4000-8000-000000000001');

insert into public.users(id, organization_id, full_name) values
  ('24000000-0000-4000-8000-000000000004', '25000000-0000-4000-8000-000000000001', 'Synthetic staff');

insert into public.staff_profiles(user_id,full_name,is_active) values
  ('24000000-0000-4000-8000-000000000006','Synthetic legacy staff',true);

-- Cases 1 and 2: sent, all selected forms approved/submitted or needing follow-up.
-- Case 3: confirmed replacement expands requirements even after a narrow first send.
-- Case 4: queued-only, excluded. Case 5: closed, excluded. Case 6: tenant B.
-- Case 7: draft replacement doesn't expand requirements.
-- Case 8: old sent packet with no recorded selection defaults to all forms.
-- Case 9: a queued send with a timestamp still does not count.
insert into public.cases(id, organization_id, case_number, status, stage, closed_at, metadata)
select ('26000000-0000-4000-8000-00000000000'||n)::uuid,
       ('25000000-0000-4000-8000-00000000000'||case when n=6 then 2 else 1 end)::uuid,
       'STATUS-TEST-'||n,
       case when n=5 then 'closed'::public.case_status else 'intake'::public.case_status end,
       case when n=5 then 'complete' else 'intake' end,
       case when n=5 then now() end,
       case when n in (3,4,9) then '{"intake_documents":["general"]}'::jsonb
            when n=8 then '{"intake_sent_at":"2026-10-01T00:00:00Z"}'::jsonb
            else '{"intake_documents":["general","unrecognized"],"intake_sent_at":"2026-10-01T00:00:00Z"}'::jsonb end
from generate_series(1,9) n;

insert into public.documents(organization_id,case_id,kind,title,status,metadata)
select c.organization_id, c.id, 'family_information', 'Synthetic general section',
       case when c.case_number='STATUS-TEST-2' then 'needs-follow-up' else 'submitted' end,
       '{"section":"general","responses":{"name":"Synthetic fixture (must not appear in output)"}}'::jsonb
from public.cases c
where c.id between '26000000-0000-4000-8000-000000000001' and '26000000-0000-4000-8000-000000000009';

update public.documents set status='approved',approved_at=now(),
  approved_by='24000000-0000-4000-8000-000000000004'
where case_id='26000000-0000-4000-8000-000000000001';

insert into public.communications(organization_id,case_id,channel,direction,subject,status,sent_at)
select c.organization_id, c.id, 'sms', 'outbound',
       case when x.n in (3,7) then 'Resent Marshall Family Care packet' else 'Your Marshall Family Care first-call packet' end,
       x.delivery_status, x.sent_at
from (values (1,'sent',now()),(3,'sent',now()),(4,'queued',null),(7,'draft',null),(9,'queued',now())) x(n,delivery_status,sent_at)
join public.cases c on c.id=('26000000-0000-4000-8000-00000000000'||x.n)::uuid;

do $$
begin
  if has_function_privilege('anon','public.family_packet_status_summary()','EXECUTE') or
     has_function_privilege('service_role','public.family_packet_status_summary()','EXECUTE') then
    raise exception 'Unauthorized database role can invoke summary';
  end if;
  if has_table_privilege('authenticated','private.packet_status_readers','SELECT,INSERT,UPDATE,DELETE') then
    raise exception 'Authenticated users can access the private grant table';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"24000000-0000-4000-8000-000000000001"}',true);
do $$
begin
  if public.family_packet_status_summary() is distinct from
     '{"sent":5,"submitted":2,"waiting":3,"needs_follow_up":1}'::jsonb then
    raise exception 'Unexpected status breakdown for tenant A';
  end if;
  if exists (select 1 from public.cases)
     or exists (select 1 from public.documents)
     or exists (select 1 from public.communications)
     or exists (select 1 from public.portal_links)
     or exists (select 1 from public.family_cases)
     or exists (select 1 from public.packet_sections) then
    raise exception 'Integration role can read protected packet rows directly';
  end if;
end;
$$;

select set_config('request.jwt.claims','{"role":"authenticated","sub":"24000000-0000-4000-8000-000000000002"}',true);
do $$
begin
  if public.family_packet_status_summary() is distinct from
     '{"sent":1,"submitted":1,"waiting":0,"needs_follow_up":0}'::jsonb then
    raise exception 'Unexpected status breakdown for tenant B';
  end if;
end;
$$;

select set_config('request.jwt.claims','{"role":"authenticated","sub":"24000000-0000-4000-8000-000000000005"}',true);
do $$
begin
  if public.family_packet_status_summary() is distinct from
     '{"sent":0,"submitted":0,"waiting":0,"needs_follow_up":0}'::jsonb then
    raise exception 'Unexpected status breakdown for empty tenant';
  end if;
end;
$$;

do $$
declare claims text;
begin
  foreach claims in array array[
    '{"role":"authenticated","sub":"24000000-0000-4000-8000-000000000003"}',
    '{"role":"authenticated","sub":"24000000-0000-4000-8000-000000000004"}',
    '{"role":"authenticated","sub":"24000000-0000-4000-8000-000000000006"}',
    '{"role":"authenticated","sub":"24000000-0000-4000-8000-000000000001","app_metadata":{"organization_id":"25000000-0000-4000-8000-000000000002"}}',
    '{"role":"authenticated"}'
  ] loop
    perform set_config('request.jwt.claims', claims, true);
    begin
      perform public.family_packet_status_summary();
      raise exception 'Unpermitted identity obtained status counts';
    exception when insufficient_privilege then null;
    end;
  end loop;
end;
$$;

reset role;
delete from private.packet_status_readers where user_id='24000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"24000000-0000-4000-8000-000000000001"}',true);
do $$
begin
  perform public.family_packet_status_summary();
  raise exception 'Revoked identity obtained status counts';
exception when insufficient_privilege then null;
end;
$$;
reset role;
rollback;
