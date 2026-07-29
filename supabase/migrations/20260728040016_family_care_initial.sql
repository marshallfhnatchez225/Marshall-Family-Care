begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.staff_role as enum ('admin', 'care_director', 'family_care', 'service_coordinator', 'read_only');
create type public.family_case_status as enum ('active', 'aftercare-ready', 'complete');
create type public.packet_section_key as enum ('general', 'obituary', 'deathCertificate', 'embalming');
create type public.form_review_status as enum ('incomplete', 'submitted', 'needs-follow-up', 'approved');
create type public.audit_event_type as enum ('case', 'access', 'save', 'submission', 'review', 'communication', 'handoff');

create table public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  role public.staff_role not null default 'read_only',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_cases (
  id uuid primary key default gen_random_uuid(),
  decedent_name text not null check (length(trim(decedent_name)) between 2 and 200),
  family_email text not null check (family_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  owner_name text not null check (length(trim(owner_name)) between 2 and 120),
  owner_id uuid references public.staff_profiles(user_id) on delete set null,
  next_promised_update timestamptz not null,
  status public.family_case_status not null default 'active',
  created_by uuid not null references public.staff_profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.packet_sections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.family_cases(id) on delete cascade,
  section_key public.packet_section_key not null,
  review_status public.form_review_status not null default 'incomplete',
  responses jsonb not null default '{}'::jsonb check (jsonb_typeof(responses) = 'object'),
  family_submitted_at timestamptz,
  reviewed_by uuid references public.staff_profiles(user_id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, section_key)
);

create table public.family_access_links (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.family_cases(id) on delete cascade,
  token_hash text not null unique check (length(token_hash) = 64),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_by uuid references public.staff_profiles(user_id) on delete set null,
  last_opened_at timestamptz,
  created_by uuid not null references public.staff_profiles(user_id),
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.family_cases(id) on delete cascade,
  actor_user_id uuid references public.staff_profiles(user_id) on delete set null,
  actor_label text not null check (length(trim(actor_label)) between 2 and 120),
  event_type public.audit_event_type not null,
  detail text not null check (length(trim(detail)) between 2 and 2000),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table public.uploaded_assets (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.family_cases(id) on delete cascade,
  section_key public.packet_section_key not null,
  bucket_id text not null check (bucket_id = 'family-care-private'),
  object_path text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 5242880),
  uploaded_by uuid references public.staff_profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

create index family_cases_owner_id_idx on public.family_cases(owner_id);
create index family_cases_next_update_idx on public.family_cases(next_promised_update) where status <> 'complete';
create index packet_sections_case_id_idx on public.packet_sections(case_id);
create index access_links_case_id_idx on public.family_access_links(case_id);
create index audit_events_case_created_idx on public.audit_events(case_id, created_at desc);
create index uploaded_assets_case_id_idx on public.uploaded_assets(case_id);

create or replace function private.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_profiles
    where user_id = (select auth.uid()) and is_active
  );
$$;

create or replace function private.can_manage_cases()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_profiles
    where user_id = (select auth.uid())
      and is_active
      and role in ('admin', 'care_director', 'family_care', 'service_coordinator')
  );
$$;

create or replace function private.is_staff_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_active_staff()
    and coalesce((select auth.jwt() -> 'app_metadata' ->> 'marshall_role'), '') = 'admin';
$$;

revoke all on function private.is_active_staff() from public, anon;
revoke all on function private.can_manage_cases() from public, anon;
revoke all on function private.is_staff_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_active_staff() to authenticated;
grant execute on function private.can_manage_cases() to authenticated;
grant execute on function private.is_staff_admin() to authenticated;

alter table public.staff_profiles enable row level security;
alter table public.family_cases enable row level security;
alter table public.packet_sections enable row level security;
alter table public.family_access_links enable row level security;
alter table public.audit_events enable row level security;
alter table public.uploaded_assets enable row level security;

create policy staff_profiles_select_active_staff on public.staff_profiles for select to authenticated using ((select private.is_active_staff()));
create policy staff_profiles_insert_admin on public.staff_profiles for insert to authenticated with check ((select private.is_staff_admin()));
create policy staff_profiles_update_admin on public.staff_profiles for update to authenticated using ((select private.is_staff_admin())) with check ((select private.is_staff_admin()));

create policy family_cases_select_staff on public.family_cases for select to authenticated using ((select private.is_active_staff()));
create policy family_cases_insert_managers on public.family_cases for insert to authenticated with check ((select private.can_manage_cases()) and created_by = (select auth.uid()));
create policy family_cases_update_managers on public.family_cases for update to authenticated using ((select private.can_manage_cases())) with check ((select private.can_manage_cases()));

create policy packet_sections_select_staff on public.packet_sections for select to authenticated using ((select private.is_active_staff()));
create policy packet_sections_insert_managers on public.packet_sections for insert to authenticated with check ((select private.can_manage_cases()));
create policy packet_sections_update_managers on public.packet_sections for update to authenticated using ((select private.can_manage_cases())) with check ((select private.can_manage_cases()));

create policy access_links_select_staff on public.family_access_links for select to authenticated using ((select private.is_active_staff()));
create policy access_links_insert_managers on public.family_access_links for insert to authenticated with check ((select private.can_manage_cases()) and created_by = (select auth.uid()));
create policy access_links_update_managers on public.family_access_links for update to authenticated using ((select private.can_manage_cases())) with check ((select private.can_manage_cases()));

create policy audit_events_select_staff on public.audit_events for select to authenticated using ((select private.is_active_staff()));
create policy audit_events_insert_staff on public.audit_events for insert to authenticated with check ((select private.is_active_staff()) and (actor_user_id is null or actor_user_id = (select auth.uid())));

create policy uploaded_assets_select_staff on public.uploaded_assets for select to authenticated using ((select private.is_active_staff()));
create policy uploaded_assets_insert_managers on public.uploaded_assets for insert to authenticated with check ((select private.can_manage_cases()));

revoke all on public.staff_profiles, public.family_cases, public.packet_sections, public.family_access_links, public.audit_events, public.uploaded_assets from anon, authenticated;
grant select, insert, update on public.staff_profiles to authenticated;
grant select, insert, update on public.family_cases, public.packet_sections, public.family_access_links to authenticated;
grant select, insert on public.audit_events, public.uploaded_assets to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('family-care-private', 'family-care-private', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy family_care_storage_select_staff on storage.objects for select to authenticated
using (bucket_id = 'family-care-private' and (select private.is_active_staff()));
create policy family_care_storage_insert_managers on storage.objects for insert to authenticated
with check (bucket_id = 'family-care-private' and (select private.can_manage_cases()));
create policy family_care_storage_delete_managers on storage.objects for delete to authenticated
using (bucket_id = 'family-care-private' and (select private.can_manage_cases()));

comment on table public.packet_sections is 'Family packet responses. Permission-to-embalm production signatures must be external provider references, never typed signatures.';
comment on table public.family_access_links is 'Only SHA-256/HMAC-derived token hashes are stored; plaintext family tokens must never be persisted.';
comment on table public.audit_events is 'Append-only application audit history; authenticated roles receive no update/delete grants.';
comment on table public.uploaded_assets is 'Metadata for objects in the non-public family-care-private Storage bucket.';

commit;
