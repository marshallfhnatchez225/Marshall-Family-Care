'use server';

import { revalidatePath } from 'next/cache';
import { allowedModulesFromClaims, canAccessPath } from '@/lib/access';
import { syncNewspaperObituary } from '@/lib/newspaper-obituary';
import { createClient } from '@/lib/supabase/server';
import type { ActionState } from '@/components/action-form';

const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

async function contentAccess() {
  const client = await createClient();
  const { data, error } = await client.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;
  const metadata = (claims?.app_metadata || {}) as Record<string, unknown>;
  if (error || !claims?.sub || typeof metadata.organization_id !== 'string' || !canAccessPath('/content', allowedModulesFromClaims(claims))) {
    throw new Error('Content access is required.');
  }
  const { data: member, error: memberError } = await client.from('users').select('status').eq('id', claims.sub).eq('organization_id', metadata.organization_id).single();
  if (memberError || member?.status !== 'active') throw new Error('Content access is required.');
  return { client, organizationId: metadata.organization_id };
}

export async function prepareNewspaperDraft(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const caseId = String(form.get('case_id') || '');
    const documentId = String(form.get('document_id') || '');
    if (!uuid(caseId) || !uuid(documentId)) throw new Error('Choose a valid obituary form.');
    const { client, organizationId } = await contentAccess();
    const result = await syncNewspaperObituary(client, organizationId, caseId, documentId);
    revalidatePath('/content');
    return { message: result === 'preserved' ? 'The existing staff-edited draft was preserved.' : 'Newspaper obituary draft prepared for staff review.' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not prepare the newspaper draft.' };
  }
}

export async function saveNewspaperDraft(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const id = String(form.get('id') || '');
    const body = String(form.get('body') || '').trim();
    const title = String(form.get('title') || '').trim();
    if (!uuid(id)) throw new Error('Choose a valid newspaper draft.');
    if (!title || title.length > 200) throw new Error('Enter a title under 200 characters.');
    if (!body || body.length > 20000) throw new Error('Enter newspaper copy under 20,000 characters.');
    const { client, organizationId } = await contentAccess();
    const { data: existing, error: lookupError } = await client.from('content').select('current_version,status').eq('id', id).eq('organization_id', organizationId).eq('channel', 'newspaper').single();
    if (lookupError || !existing) throw new Error('Newspaper draft not found.');
    if (existing.status !== 'draft' && existing.status !== 'in_review') throw new Error('This item is no longer editable as a draft.');
    const { data: saved, error: saveError } = await client.from('content')
      .update({ title, body, current_version: existing.current_version + 1, updated_at: new Date().toISOString() })
      .eq('id', id).eq('organization_id', organizationId).eq('current_version', existing.current_version)
      .in('status', ['draft', 'in_review']).select('id').maybeSingle();
    if (saveError || !saved) throw new Error('This draft changed while you were editing. Refresh the page and review it before saving.');
    revalidatePath('/content');
    return { message: 'Newspaper draft saved for staff review.' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not save the newspaper draft.' };
  }
}
