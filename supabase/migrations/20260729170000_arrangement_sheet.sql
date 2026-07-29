begin;

alter table public.family_cases
  add column if not exists arrangement_sheet jsonb not null default '{}'::jsonb,
  add column if not exists arrangement_updated_at timestamptz;

comment on column public.family_cases.arrangement_sheet is
  'Staff-only Arrangement Sheet values, prefilled from the submitted family packet and completed by Marshall staff.';

commit;
