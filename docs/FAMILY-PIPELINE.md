# Family Portal workflow in Marshall OS

## Reused source

Reviewed `origin/codex/packet-first-family-care`: `components/family-packet.tsx`, `components/family-care-dashboard.tsx`, `lib/family-care-supabase-repository.ts`, the four original migrations, and setup notes. The original packet field definitions are reused in `src/lib/packet-fields.ts`.

The migration imports packet answers, review states, arrangement notes, contact details and private asset references for OS cases already linked by `metadata.legacy_family_case_id`. The source tables and original links remain intact. This is a cutover snapshot, not ongoing bidirectional synchronization: use the new OS family links for subsequent work. Certificate records without a reliable case ID are not guessed or joined by name.

## Staff workflow

Cases and Family Care open the same eight-stage pipeline. Opening a case shows packet review, arrangement scheduling, a staff arrangement sheet prefilled from packet answers, family/staff checklist, private documents, certificate tracking, notification drafts and an activity timeline. Documents, Tasks, Services and Communications link back to the same case. Home uses actual records, replacing the earlier representative dashboard.

Creating a case creates its family and all four packet worksheets atomically. Staff can generate seven-day, revocable family links, request documents, share files, review submissions, and record delivery of prepared messages. The family portal shows only its case, family-visible tasks and documents, arrangement appointments and certificate status. It supports draft/submitted worksheets, checklist completion, private upload and download.

Permission-to-Embalm carries representative details and the selected preference for staff review; this release does not collect an electronic signature or claim completed legal authorization. Existing signature records stay in imported responses and the old portal. No old pricing or the previous 48-hour legal/payment language was copied into new forms.

## Access and files

Staff mutations use the session client and RLS. Database role permissions are enforced for pipeline tables and role assignment tables. The case-creation function is security invoker. Trigger functions write events and audit entries in the same transaction. Cross-organization case references are rejected. New family links store only SHA-256 hashes of random 256-bit tokens.

Family requests validate active, unexpired, non-revoked tokens before using a server-only Supabase secret. Every document/task query is scoped again to the validated case and family visibility. `SUPABASE_SECRET_KEY` (already configured in Vercel) or `SUPABASE_SERVICE_ROLE_KEY` is required. Secret values never go to the client. Private pages use no-store/no-referrer; downloads use 60-second signed URLs. Uploads validate a 5 MB limit, MIME type and basic file signatures; malware scanning is not provided by this implementation.

## Events and delivery

Database triggers emit CASE.CREATED, CASE.STAGE_CHANGED, DOCUMENT.RECEIVED, DOCUMENT.REQUESTED, DOCUMENT.UPDATED, CASE.OBITUARY_APPROVED, ARRANGEMENT.SCHEDULED, CHECKLIST.COMPLETED and DEATH_CERTIFICATES status events. Unchanged approval/status saves do not duplicate an event. Each event has an immutable unique idempotency key.

Arrangement, document-request, obituary-approval and certificate events also create communication drafts. No messages are sent automatically. The original portal also prepared Google Voice/SMS/email messages manually. Staff copy the draft, send through their chosen channel, and record delivery. n8n/Gmail/WhatsApp/Buffer provider delivery remains unconfigured; external consumers must honor event idempotency and explicit approval. Calendar downloads are working ICS files, not a claim of Google Calendar synchronization.

## Performance and verification

Navigation uses verified getClaims (local verification with asymmetric signing keys; Auth call fallback on legacy keys), streaming loading states, parallel case-section queries, selected list columns, case indexes, and Vercel pdx1 colocated with Supabase us-west-2. Actual gains depend on signing-key type and warm/cold conditions.

Checks: lint, production build/typecheck, and transactional SQL tests in `supabase/tests/pipeline.sql` covering packet creation, atomic events/drafts, duplicate approval suppression, checklist completion and denied access for an unassigned user. Tests roll back their records. Supabase advisors reported no new pipeline security warnings; existing household-helper/password-protection notices belong to older configuration.
