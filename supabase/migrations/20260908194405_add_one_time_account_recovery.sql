create table public.account_recovery_tokens (
  token_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.account_recovery_tokens enable row level security;
revoke all on table public.account_recovery_tokens from anon, authenticated;
comment on table public.account_recovery_tokens is 'Short-lived, single-use recovery grants. Only service_role may access this table.';
