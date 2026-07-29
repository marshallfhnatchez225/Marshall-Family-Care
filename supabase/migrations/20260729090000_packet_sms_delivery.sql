begin;

alter table public.family_cases
  alter column family_email drop not null,
  add column family_mobile text,
  add column sms_consent_at timestamptz,
  add column delivery_state text check (delivery_state in ('queued-ready', 'sent', 'failed')),
  add column delivery_error text check (delivery_error is null or length(delivery_error) <= 1000);

alter table public.family_cases
  add constraint family_mobile_format
  check (family_mobile is null or family_mobile ~ '^\+?[1-9][0-9]{9,14}$'),
  add constraint sms_consent_required
  check (delivery_state is null or (family_mobile is not null and sms_consent_at is not null));

comment on column public.family_cases.family_mobile is
  'Validated family mobile destination for a consented packet delivery.';
comment on column public.family_cases.sms_consent_at is
  'Time staff attested that the family consented to receive the packet link by SMS.';
comment on column public.family_cases.delivery_state is
  'Truthful SMS state. queued-ready means no provider accepted a message.';

commit;
