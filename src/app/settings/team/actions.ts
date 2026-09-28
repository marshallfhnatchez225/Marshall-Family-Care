'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionState } from '@/components/action-form';

const modules = ['', 'intake', 'cases', 'tasks'];
const permissions = ['cases.*', 'families.*', 'documents.*', 'communications.*', 'services.read', 'tasks.*'];
const roleKey = 'intake_tasks_staff';

export async function inviteStaff(_: ActionState, form: FormData): Promise<ActionState> {
  const name = String(form.get('name') ?? '').trim().replace(/\s+/g, ' ');
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (name.length < 2 || name.length > 150) return { error: 'Enter the staff member’s full name.' };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };

  const session = await createClient();
  const { data: auth, error: authError } = await session.auth.getClaims();
  if (authError || !auth?.claims?.sub) return { error: 'Please sign in again.' };
  const orgId = (auth.claims.app_metadata as Record<string, unknown> | undefined)?.organization_id;
  if (typeof orgId !== 'string') return { error: 'Your Marshall organization is unavailable.' };

  const { data: member, error: memberError } = await session.from('users').select('status').eq('id', auth.claims.sub).eq('organization_id', orgId).single();
  if (memberError || member?.status !== 'active') return { error: 'Administrator access is required.' };
  const { data: assignments, error: assignmentsError } = await session.from('user_roles').select('role_id').eq('user_id', auth.claims.sub).eq('organization_id', orgId);
  if (assignmentsError || !assignments?.length) return { error: 'Administrator access is required.' };
  const { data: roles, error: rolesError } = await session.from('roles').select('permissions').in('id', assignments.map(row => row.role_id));
  if (rolesError || !roles?.some(role => Array.isArray(role.permissions) && (role.permissions.includes('*') || role.permissions.includes('settings.manage')))) {
    return { error: 'Administrator access is required.' };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return { error: 'Staff invitations are not configured.' };
  const admin = createAdminClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: existing, error: existingError } = await admin.from('users').select('id').eq('organization_id', orgId).ilike('email', email).maybeSingle();
  if (existingError) return { error: 'Could not check for an existing staff account.' };
  if (existing) return { error: 'This email already has a Marshall staff account.' };

  const { data: role, error: roleError } = await admin.from('roles').upsert({ organization_id: orgId, key: roleKey, name: 'Intake & Tasks Staff', permissions }, { onConflict: 'organization_id,key' }).select('id').single();
  if (roleError || !role) return { error: 'Could not prepare the limited staff role.' };

  const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name },
    redirectTo: 'https://marshall-os.vercel.app/auth/callback?next=/reset-password',
  });
  if (inviteError || !invitation.user) return { error: 'The invitation could not be sent. Check whether this email already has an account.' };

  const userId = invitation.user.id;
  const { error: userError } = await admin.from('users').upsert({ id: userId, organization_id: orgId, full_name: name, email, status: 'active' }, { onConflict: 'id' });
  const { error: assignmentError } = userError ? { error: userError } : await admin.from('user_roles').upsert({ organization_id: orgId, user_id: userId, role_id: role.id }, { onConflict: 'user_id,role_id' });
  const { error: metadataError } = userError || assignmentError ? { error: userError || assignmentError } : await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...invitation.user.app_metadata, organization_id: orgId, role: roleKey, role_name: 'Intake & Tasks Staff', allowed_modules: modules },
  });
  if (userError || assignmentError || metadataError) {
    return { error: 'The invitation was sent, but access setup needs review. The account cannot enter Marshall OS until setup is repaired.' };
  }

  revalidatePath('/settings/team');
  return { message: `Invitation sent to ${email}. Access is limited to Home, Intake, Cases, and Tasks.` };
}
