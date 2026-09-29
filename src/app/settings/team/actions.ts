'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionState } from '@/components/action-form';

const modules = ['', 'intake', 'cases', 'tasks'];
const permissions = ['cases.*', 'families.*', 'documents.*', 'communications.*', 'services.read', 'tasks.*'];
const roleKey = 'intake_tasks_staff';

export async function createStaff(_: ActionState, form: FormData): Promise<ActionState> {
  const name = String(form.get('name') ?? '').trim().replace(/\s+/g, ' ');
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const phone = String(form.get('phone') ?? '').replace(/\D/g, '');
  const password = String(form.get('password') ?? '');
  const confirmation = String(form.get('confirm_password') ?? '');
  if (name.length < 2 || name.length > 150) return { error: 'Enter the staff member’s full name.' };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };
  if (phone && phone.length !== 10) return { error: 'Enter a 10-digit Google Voice recipient number, or leave it blank.' };
  if (password.length < 8) return { error: 'Enter a password with at least 8 characters.' };
  if (password !== confirmation) return { error: 'The passwords do not match.' };

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
  const { data: role, error: roleError } = await admin.from('roles').upsert({ organization_id: orgId, key: roleKey, name: 'Intake & Tasks Staff', permissions }, { onConflict: 'organization_id,key' }).select('id').single();
  if (roleError || !role) return { error: 'Could not prepare the limited staff role.' };

  if (existing) {
    if (existing.id === auth.claims.sub) return { error: 'Use your own account settings to change your password.' };
    const { data: account, error: accountError } = await admin.auth.admin.getUserById(existing.id);
    if (accountError || account.user?.email?.toLowerCase() !== email) return { error: 'The existing staff sign-in could not be verified.' };
    const { error: assignmentError } = await admin.from('user_roles').upsert({ organization_id: orgId, user_id: existing.id, role_id: role.id }, { onConflict: 'user_id,role_id' });
    if (assignmentError) return { error: 'Could not assign limited staff access.' };
    const { error: removalError } = await admin.from('user_roles').delete().eq('organization_id', orgId).eq('user_id', existing.id).neq('role_id', role.id);
    if (removalError) return { error: 'Could not remove the account’s previous access. The password was not changed.' };
    const { error: profileError } = await admin.from('users').update({ full_name: name, status: 'active' }).eq('id', existing.id).eq('organization_id', orgId);
    if (profileError) return { error: 'Could not update the staff profile. The password was not changed.' };
    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { ...account.user.user_metadata, full_name: name },
      app_metadata: { ...account.user.app_metadata, organization_id: orgId, role: roleKey, role_name: 'Intake & Tasks Staff', allowed_modules: modules },
    });
    if (updateError) return { error: 'Could not set the existing account password. Please try again.' };
    revalidatePath('/settings/team');
    return { message: `Access and password updated for ${email}.${phone ? ' Review and send the login link through Google Voice.' : ''}`, ...(phone ? { voicePhone: phone, voiceMessage: `${name.split(' ')[0]}, your Marshall OS staff account is ready. Sign in at https://marshall-os.vercel.app/login using ${email} and the password Jonte gave you.` } : {}) };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
  let authUser = created.user;
  let linkedExistingSignIn = false;
  if (createError) {
    const reason = `${createError.code ?? ''} ${createError.message}`;
    if (!/already|exists|registered/i.test(reason)) {
      return { error: /password|weak/i.test(reason) ? 'That password does not meet the sign-in requirements. Choose a stronger password and try again.' : 'The account could not be created. Please try again.' };
    }

    // An Auth sign-in may predate Marshall OS and have no staff profile yet.
    let page = 1;
    while (!authUser) {
      const { data: accounts, error: lookupError } = await admin.auth.admin.listUsers({ page, perPage: 100 });
      if (lookupError) return { error: 'Could not check the existing sign-in. Please try again.' };
      authUser = accounts.users.find(user => user.email?.toLowerCase() === email) ?? null;
      if (authUser || !accounts.nextPage) break;
      page = accounts.nextPage;
    }
    if (!authUser) return { error: 'This email already has a sign-in, but its account could not be found. Please contact a Marshall administrator.' };
    const { data: profile, error: profileError } = await admin.from('users').select('organization_id').eq('id', authUser.id).maybeSingle();
    if (profileError) return { error: 'Could not check the existing account’s access. Please try again.' };
    if (profile || (authUser.app_metadata?.organization_id && authUser.app_metadata.organization_id !== orgId)) {
      return { error: 'This email already belongs to another staff account. Its access was not changed.' };
    }
    linkedExistingSignIn = true;
  }
  if (!authUser) return { error: 'The account could not be created. Please try again.' };

  const userId = authUser.id;
  const { error: userError } = await admin.from('users').upsert({ id: userId, organization_id: orgId, full_name: name, email, status: 'active' }, { onConflict: 'id' });
  const { error: assignmentError } = userError ? { error: userError } : await admin.from('user_roles').upsert({ organization_id: orgId, user_id: userId, role_id: role.id }, { onConflict: 'user_id,role_id' });
  const { error: metadataError } = userError || assignmentError ? { error: userError || assignmentError } : await admin.auth.admin.updateUserById(userId, {
    ...(linkedExistingSignIn ? { password, email_confirm: true, user_metadata: { ...authUser.user_metadata, full_name: name } } : {}),
    app_metadata: { ...authUser.app_metadata, organization_id: orgId, role: roleKey, role_name: 'Intake & Tasks Staff', allowed_modules: modules },
  });
  if (userError || assignmentError || metadataError) {
    if (linkedExistingSignIn) await admin.from('users').delete().eq('id', userId).eq('organization_id', orgId);
    else await admin.auth.admin.deleteUser(userId);
    return { error: 'Access setup failed. Please try again; the incomplete Marshall OS staff profile was removed.' };
  }

  revalidatePath('/settings/team');
  return { message: `${linkedExistingSignIn ? 'Existing sign-in linked to Marshall OS' : 'Account created'} for ${email}. The password is set.${phone ? ' Review and send the login link through Google Voice.' : ''}`, ...(phone ? { voicePhone: phone, voiceMessage: `${name.split(' ')[0]}, your Marshall OS staff account is ready. Sign in at https://marshall-os.vercel.app/login using ${email} and the password Jonte gave you.` } : {}) };
}
