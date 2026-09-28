create table public.calendar_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  case_id uuid references public.cases(id) on delete set null,
  title text not null check (length(trim(title)) between 2 and 200),
  kind text not null check (kind in ('arrangement','funeral','wake','visitation','preneed','other')),
  event_date date not null,
  start_time time,
  end_time time,
  location text,
  staff text,
  status text not null default 'confirmed' check (status in ('confirmed','tentative','cancelled')),
  source text not null default 'manual' check (source in ('manual','google_voice_group')),
  source_ref text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,source,source_ref)
);
create index calendar_entries_org_date_idx on public.calendar_entries(organization_id,event_date);
alter table public.calendar_entries enable row level security;
grant select,insert,update on public.calendar_entries to authenticated;
create policy calendar_read on public.calendar_entries for select to authenticated
  using (organization_id=(select public.current_organization_id()) and (select private.os_permission('cases.read')));
create policy calendar_insert on public.calendar_entries for insert to authenticated
  with check (organization_id=(select public.current_organization_id()) and (select private.os_permission('tasks.write')));
create policy calendar_update on public.calendar_entries for update to authenticated
  using (organization_id=(select public.current_organization_id()) and (select private.os_permission('tasks.write')))
  with check (organization_id=(select public.current_organization_id()) and (select private.os_permission('tasks.write')));
create trigger calendar_validate_case before insert or update on public.calendar_entries
  for each row execute function private.os_validate_case();

-- The September 27 Marshall Google Voice group update was posted at 9:04 PM Central.
-- Times not stated in the message stay NULL and appear as Time TBD in the calendar.
with marshall as (select id from public.organizations where slug='marshall-funeral-home')
insert into public.calendar_entries
  (organization_id,case_id,title,kind,event_date,start_time,location,staff,status,source,source_ref,notes)
select m.id,
  (select c.id from public.cases c where c.organization_id=m.id and c.id=v.case_id),
  v.title,v.kind,v.event_date::date,v.start_time::time,v.location,v.staff,v.status,
  'google_voice_group',v.source_ref,v.notes
from marshall m cross join (values
  ('Leak arrangement','arrangement','2026-09-28','12:00','Bude','Ev','confirmed','2026-09-27-leak-arrangement','Cremation case; group update does not specify the exact meeting address.',null::uuid),
  ('Covington arrangement','arrangement','2026-09-28','14:00','Bude','Ev','confirmed','2026-09-27-covington-arrangement','Funeral mentioned for Saturday, October 3.', '2a09aba5-7bac-488e-804f-551fb8dda166'::uuid),
  ('Gant arrangement','arrangement','2026-09-28','16:00','Bude','Ev','confirmed','2026-09-27-gant-arrangement','Funeral mentioned for Saturday, October 3.',null::uuid),
  ('Dobbins arrangement','arrangement','2026-09-28','12:00','Natchez office','Jonte','confirmed','2026-09-27-dobbins-arrangement','Funeral mentioned for Thursday, October 1.','af223839-7660-4d7d-86e8-4a33b95db0af'::uuid),
  ('Knapp arrangement','arrangement','2026-09-28','13:00','Natchez office','Jonte','confirmed','2026-09-27-knapp-arrangement','Funeral mentioned for Thursday, October 1.','24771879-5608-4ba1-954d-b9a7a0e7acf7'::uuid),
  ('Washington family meeting','arrangement','2026-09-29',null,null,null,'tentative','2026-09-27-washington-meeting','Family requested 2:00 or 2:30 PM; exact time and place need confirmation.','4db78b73-27f4-4739-beca-debe92b6f8a1'::uuid),
  ('Dobbins funeral','funeral','2026-10-01',null,null,null,'confirmed','2026-09-27-dobbins-funeral','Time TBD.','af223839-7660-4d7d-86e8-4a33b95db0af'::uuid),
  ('Knapp funeral','funeral','2026-10-01',null,null,null,'confirmed','2026-09-27-knapp-funeral','Time TBD.','24771879-5608-4ba1-954d-b9a7a0e7acf7'::uuid),
  ('Washington funeral','funeral','2026-10-02',null,null,null,'confirmed','2026-09-27-washington-funeral','Time TBD.','4db78b73-27f4-4739-beca-debe92b6f8a1'::uuid),
  ('Covington funeral','funeral','2026-10-03',null,null,null,'confirmed','2026-09-27-covington-funeral','Time TBD.','2a09aba5-7bac-488e-804f-551fb8dda166'::uuid),
  ('Gant funeral','funeral','2026-10-03',null,null,null,'confirmed','2026-09-27-gant-funeral','Time TBD.',null::uuid)
) as v(title,kind,event_date,start_time,location,staff,status,source_ref,notes,case_id)
on conflict (organization_id,source,source_ref) do nothing;
