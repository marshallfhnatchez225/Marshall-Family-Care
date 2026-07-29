# Marshall Family Care production setup

The app has two isolated runtime paths:

- **Supabase production adapter**: selected only when the Supabase URL, publishable key, and server-only service-role key are all present.
- **Local fictional demo**: selected only when `MARSHALL_DEMO_MODE=true` and `NEXT_PUBLIC_APP_URL` has a loopback host (`127.0.0.1`, `localhost`, or `::1`).

Any other configuration fails closed. Production must set `MARSHALL_DEMO_MODE=false`; demo credentials and fictional records are not available through the Supabase adapter.

## Required environment

Set these in the hosting platform, not in committed files:

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Browser-safe | Canonical HTTPS Family Care origin used in packet links. |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Restored Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe | Supabase publishable key used by SSR/browser Auth. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Family-token validation, family response writes, and private uploads after server authorization. Never prefix with `NEXT_PUBLIC_`. |
| `MARSHALL_LINK_SECRET` | Server only | Long random secret mixed into stored family-token hashes. Changing it invalidates existing links. |
| `MARSHALL_SMS_PROVIDER` | Server only | Reserved provider identifier. No provider adapter is currently enabled. |
| `MARSHALL_SMS_API_KEY` | Server only | Reserved provider credential. Never returned to client code. |
| `MARSHALL_SMS_SENDER` | Server only | Reserved verified sender/number. |
| `MARSHALL_ESIGN_PROVIDER` | Server only | Approved e-signature provider identifier after counsel review. |
| `MARSHALL_ESIGN_API_KEY` | Server only | E-sign provider credential. Typed signatures remain disabled in production. |
| `MARSHALL_DEMO_MODE` | Server only | Must be `false` in production. |

`MARSHALL_SESSION_SECRET` and `MARSHALL_DEV_STAFF_PASSWORD` are only for the loopback demo. They are not used by Supabase Auth.

## Database and Auth

Apply [20260728040016_family_care_initial.sql](supabase/migrations/20260728040016_family_care_initial.sql) to the restored project through the coordinator's migration workflow. It creates:

- named `staff_profiles` tied to `auth.users`, with active-state and role checks;
- private family cases and packet-section JSON responses;
- review statuses, promised updates, completion/aftercare state;
- hashed, expiring, revocable family access links;
- append-only audit events;
- private upload metadata and a non-public `family-care-private` bucket;
- restrictive RLS policies. There is no anonymous table or Storage policy and no broad `TO authenticated USING (true)` policy.

After migration:

1. Create staff users in Supabase Auth. Do not enable public signup in this app.
2. Bootstrap the first `staff_profiles` row through a trusted administrator/migration workflow. Set `is_active=true` and the least-privileged role.
3. Put `marshall_role: admin` in trusted **app metadata**, never user metadata, only for users authorized to administer staff profiles.
4. Confirm Auth Site URL and redirect allowlist use the production Family Care origin.
5. Keep access-token lifetimes short enough for the sensitivity of the system and define staff offboarding/session-revocation procedures.
6. Run Supabase security and performance advisors after applying the migration.

## Private obituary photos

The family upload action validates the active case link on the server, accepts only JPG/PNG/WebP up to 5 MB, and uploads with the server-only client to `family-care-private`. Object paths use a case ID and random UUID. The application never creates public object URLs. Before live release, add malware scanning, image metadata stripping, retention/deletion rules, backup policy, and an authenticated download route that checks staff authorization before returning a short-lived signed URL or streamed object.

## SMS and signature release gates

No outbound SMS function is implemented or called. Staff can validate a family mobile number, document consent, create the scoped expiring link, and prepare a copyable SMS preview; delivery remains explicitly `queued-ready` and the UI does not claim a text was sent. Before live SMS, implement and test an approved provider adapter, delivery callbacks, opt-out handling, rate limits, audit/error updates, and suppression rules.

Google Voice is the primary staff-controlled delivery method for individual family packet links. Staff copy the prepared message into the family's Google Voice conversation and send it manually; no Google Voice automation or paid texting provider is used. If the family supplies an email address, staff may use the prepared email message as a fallback.

The approved 48-hour notice remains unchanged. Permission to Embalm uses the protected-link electronic authorization and browser signature capture, recorded for staff review; it does not verify identity or promise legal validity. Counsel must approve the wording, use, retention, and staff-review procedure before live release.

## Remaining operational prerequisites

- Resolve or formally assess the remaining `npm audit --omit=dev` findings in Next.js transitive `postcss`/`sharp` dependencies. The app was moved from vulnerable Next.js 15.5.7 to the current 15.5.22 backport, but a Next.js 16 upgrade may be required for a clean dependency audit.
- HTTPS hosting, security headers, rate limiting, monitoring, alerting, backups/PITR, and restore testing.
- Data-retention/deletion policy, incident response plan, staff access reviews, and privacy review.
- Verify RLS with multiple staff roles and an unauthenticated client.
- Test link expiry/revocation, upload cleanup, email suppression, and staff offboarding.
- Do not deploy until the migration, environment, legal, e-signature, and operational controls have been reviewed.
