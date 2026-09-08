# Marshall OS architecture

Marshall OS is the first organization-scoped operating system under a future Jonte OS executive layer. `organization_id` is the boundary on every operational record. Future Innergetic OS and Marshall Family Capital OS should use the same identity, organization, event-envelope, and executive-summary contracts while keeping their domain tables separate.

## Reuse decisions

- Marshall Family Care remains a module. Reuse its packet, arrangement, invitation, death-certificate, and family portal flows by mapping them to `families`, `cases`, `documents`, `communications`, and `events`.
- Social Media Command Center remains the Content module. Reuse its prompt library, versioning, human approval gate, private asset model, and analytics normalization. Buffer publishing must stay behind explicit human approval.
- The prior Command Center supplied the navigation and operational-dashboard concept. This repository is the clean Next.js/Supabase foundation rather than extending that static preview.

## Event flow

1. A business change and its event are committed together in PostgreSQL.
2. The `events` table is the transactional outbox. Event names are stable, uppercase domain facts such as `CASE.OBITUARY_APPROVED` and `DEATH_CERTIFICATES.READY`.
3. n8n polls or receives a Supabase database webhook for pending events, claims one, and routes by `workflow_rules`.
4. Adapters call Gmail, Google Calendar, WhatsApp Business, or Buffer. Credentials live in n8n/Vercel secret stores, never database JSON.
5. The consumer uses `idempotency_key`, records the provider external ID, then marks the event delivered. Retries use exponential delay and end in `dead_letter` for staff review.

Suggested actions: obituary approval creates review-ready channel drafts; certificate readiness notifies authorized family contacts; service changes update Calendar and affected tasks. No external communication or publishing is automatic until its workflow rule and human-approval condition are explicitly enabled.

## Access model

Supabase Auth establishes identity. Trusted `app_metadata.organization_id` establishes the tenant boundary; user-editable metadata is never used for authorization. Database RLS enforces organization isolation. Roles add permissions such as `cases.write`, `documents.approve`, `content.publish`, `settings.manage`, and `analytics.read`. Admin-only server paths should re-check permissions and never expose a secret/service key to the browser.

Recommended initial roles: administrator, funeral director, family care, operations, content reviewer, and analyst. Family users require a separate, case-scoped portal policy before production enablement.

## Integration ownership

- Vercel: Next.js runtime and environment variables.
- Supabase: PostgreSQL, Auth, private Storage, RLS, and database webhooks.
- n8n: durable workflow orchestration, retries, and provider adapters.
- Buffer: approved social scheduling only.
- Gmail / Calendar / WhatsApp Business: communications and schedules through n8n, with provider IDs written back for traceability.
- GitHub: source, migrations, review, and deployment checks.

## Deferred decisions

Financial approval limits, legacy-family numbers, escalation thresholds, retention periods, and autonomous-send rules are intentionally absent. They require owner and legal/compliance decisions before configuration.
