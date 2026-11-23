# Read-only family packet status

This branch is for review and local or isolated development testing only. Vercel Git deployment is disabled for this branch in `vercel.json`. Nothing here creates an account, connects a production project, sends a message, reads a packet body, or changes any existing packet.

The Supabase Data API exposes `POST /rest/v1/rpc/family_packet_status_summary` with body `{}`, the project's publishable key in `apikey`, and a short-lived Supabase Auth access token in `Authorization: Bearer …`. The method is POST because this is a PostgREST RPC; the database function is read-only. It accepts no arguments and returns only four integer counts. It has no staff credential or service-role dependency.

| Field | Meaning |
| --- | --- |
| `sent` | Open cases with a recorded sent initial or replacement family packet, counted once per case. This does not verify delivery to a recipient. Draft/queued sends do not count. |
| `submitted` | Sent cases with every required section marked Submitted or Approved. |
| `waiting` | Sent cases not yet in Submitted; includes missing forms, saved drafts, and cases needing corrections. |
| `needs_follow_up` | Subset of Waiting with at least one required section marked Needs Follow-up. |

Initially required sections are the recorded selection or all four supported forms when no recognized selection is available. Sent replacement packets request all four. A resend does not reset an already submitted section; the counts reflect current section review status. An expired link does not erase the fact a packet was sent. Closed cases are excluded; this is an operational snapshot, not a historical send report.

## Isolated setup and test

1. Use a local or dedicated development Supabase project with synthetic records. Do not use a preview project until its database and provider settings have been verified to be isolated.
2. Apply the migration. In the isolated project, create a dedicated Supabase Auth identity. Do not create a `public.users` or legacy `public.staff_profiles` record for it or set an `app_metadata.organization_id` claim. Do not share a staff login, service role key, access token, or refresh token in chat or GitHub.
3. With an administrator-controlled database connection, explicitly insert the test Auth user UUID and the one test organization UUID into `private.packet_status_readers(user_id, organization_id)`. The integration user cannot grant itself access. Remove the row to revoke access immediately.
4. Run `supabase/tests/packet-status-summary.sql` with an administrator role on the migrated isolated database. The fixture inserts roll back. For an HTTP smoke test, sign in as the test integration identity and call the RPC with its token, then verify a normal authenticated test identity and an unauthenticated request are rejected.

Before a live connection, separately approve provisioning a dedicated production identity and storing its credentials in an approved secret store. No production setup or deployment is part of this branch.
