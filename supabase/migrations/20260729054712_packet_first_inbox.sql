begin;

create type public.family_packet_state as enum ('sent', 'submitted', 'attached');

alter table public.family_cases
  add column packet_state public.family_packet_state,
  add column packet_submitted_at timestamptz,
  add column attached_case_id uuid references public.family_cases(id) on delete set null;

create index family_cases_packet_inbox_idx
  on public.family_cases(packet_state, packet_submitted_at desc)
  where packet_state in ('submitted', 'attached');

comment on column public.family_cases.packet_state is
  'Packet-first workflow state. A sent packet is not treated as a Family Care case in staff UI until attached.';
comment on column public.family_cases.attached_case_id is
  'Case created from or selected for this packet. Structured packet responses are copied server-side without re-entry.';

commit;
