import Link from 'next/link';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { AppShell } from '@/components/app-shell';
import { ActionForm } from '@/components/action-form';
import { createClient } from '@/lib/supabase/server';
import { createStaff } from './actions';

export default async function TeamPage() {
  const client = await createClient();
  const { data: auth } = await client.auth.getClaims();
  const userId = auth?.claims?.sub;
  const orgId = (auth?.claims?.app_metadata as Record<string, unknown> | undefined)?.organization_id;
  let authorized = false;
  let staffAccounts: { id: string; full_name: string | null; email: string; status: string }[] = [];
  if (userId && typeof orgId === 'string') {
    const { data: member } = await client.from('users').select('status').eq('id', userId).eq('organization_id', orgId).maybeSingle();
    const { data: assignments } = await client.from('user_roles').select('role_id').eq('user_id', userId).eq('organization_id', orgId);
    if (member?.status === 'active' && assignments?.length) {
      const { data: roles } = await client.from('roles').select('permissions').in('id', assignments.map(row => row.role_id));
      authorized = Boolean(roles?.some(role => Array.isArray(role.permissions) && (role.permissions.includes('*') || role.permissions.includes('settings.manage'))));
    }
  }
  if (authorized && typeof orgId === 'string') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && secret) {
      const admin = createAdminClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data } = await admin.from('users').select('id,full_name,email,status').eq('organization_id', orgId).order('full_name');
      staffAccounts = data ?? [];
    }
  }
  return <AppShell active="settings"><div className="content workflow">
    <Link className="link" href="/settings">← Settings</Link>
    <header className="commandhero"><div><p className="eyebrow">Marshall staff</p><h1>Team & roles</h1><p>Invite a staff member with limited access to the work they handle.</p></div></header>
    {authorized ? <section className="workflow-card"><h2>Create or update a staff sign-in</h2><p>This role can use Home, Intake, Cases, and Tasks. It cannot open Settings, Analytics, Content, Community, or Knowledge. For an existing account, submitting this form replaces its password and access with this role.</p>
      <ActionForm action={createStaff} submit="Save staff account"><label>Full name<input name="name" type="text" minLength={2} maxLength={150} required/></label><label>Sign-in email<input name="email" type="email" maxLength={254} required/></label><label>Google Voice number for login link (optional)<input name="phone" type="tel" inputMode="tel" placeholder="601-555-0123"/></label><label>New password<input name="password" type="password" minLength={8} autoComplete="new-password" required/></label><label>Confirm new password<input name="confirm_password" type="password" minLength={8} autoComplete="new-password" required/></label><p className="form-note">The account can sign in immediately. No invitation email is sent. If you enter a number, review the Google Voice login message after saving the account.</p></ActionForm>
    </section> : <section className="workflow-card"><h2>Administrator access required</h2><p>Only a Marshall administrator can invite staff.</p></section>}
    {authorized && <section className="workflow-card"><h2>Staff accounts</h2>{staffAccounts.length ? <ul>{staffAccounts.map(account => <li key={account.id}>{account.full_name || account.email} — {account.email} ({account.status})</li>)}</ul> : <p>No staff accounts are available to display.</p>}</section>}
  </div></AppShell>;
}
