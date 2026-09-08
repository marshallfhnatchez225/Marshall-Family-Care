# Marshall OS

Unified operations foundation for Marshall Funeral Home. The first working slice includes the executive dashboard, all MVP module routes, a Supabase-ready organization-scoped schema, role foundations, and an event outbox for n8n integrations.

## Start locally

Use Node.js 22 or later. Copy `.env.example` to `.env.local`, add the public Supabase values, then run `npm run dev`. Until Supabase is connected, the dashboard uses clearly representative operating data.

## Verify

Run `npm run lint`, `npm run build`, and `npx supabase test db` against a local Supabase instance. Review [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before connecting production providers.

## Deployment sequence

1. Create or select the GitHub repository and Vercel project.
2. Add the `.env.example` keys in Vercel without committing values.
3. Link a Supabase development project and apply the migration.
4. Test organization isolation, role permissions, event idempotency, and approval gates.
5. Connect n8n provider credentials and enable one workflow rule at a time.
