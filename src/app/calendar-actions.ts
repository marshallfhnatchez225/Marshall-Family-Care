'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parseSheetDate, type CalendarKind, type CalendarStatus } from '@/lib/home-calendar';
import type { ActionState } from '@/components/action-form';

const kinds: CalendarKind[] = ['arrangement','funeral','wake','visitation','preneed','other'];
const statuses: CalendarStatus[] = ['confirmed','tentative','cancelled'];
const read = (form: FormData, key: string, max: number) => String(form.get(key) ?? '').trim().slice(0, max);

export async function saveCalendarEntry(_: ActionState, form: FormData): Promise<ActionState> {
  const title = read(form, 'title', 200);
  const kind = read(form, 'kind', 30) as CalendarKind;
  const eventDate = read(form, 'event_date', 10);
  const startTime = read(form, 'start_time', 5);
  const endTime = read(form, 'end_time', 5);
  const status = read(form, 'status', 20) as CalendarStatus;
  const source = read(form, 'source', 30);
  const caseId = read(form, 'case_id', 36);
  const id = read(form, 'id', 36);
  if (title.length < 2 || !kinds.includes(kind) || !statuses.includes(status)) return { error: 'Enter a title, type, and status.' };
  if (parseSheetDate(eventDate) !== eventDate) return { error: 'Choose a valid calendar date.' };
  if ((startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) || (endTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime))) return { error: 'Choose a valid time.' };
  if (endTime && (!startTime || endTime <= startTime)) return { error: 'The end time must be after the start time.' };
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (caseId && !uuid.test(caseId)) return { error: 'Choose a valid case.' };
  if (id && !uuid.test(id)) return { error: 'Choose a valid calendar entry.' };
  if (!id && !['manual','google_voice_group'].includes(source)) return { error: 'Choose where this information came from.' };

  const client = await createClient();
  const { data: auth, error: authError } = await client.auth.getClaims();
  const organizationId = (auth?.claims?.app_metadata as Record<string, unknown> | undefined)?.organization_id;
  if (authError || !auth?.claims?.sub || typeof organizationId !== 'string') return { error: 'Please sign in again.' };
  if (caseId) {
    const { data: matchingCase, error: caseError } = await client.from('cases').select('id').eq('id', caseId).eq('organization_id', organizationId).maybeSingle();
    if (caseError || !matchingCase) return { error: 'That case is unavailable.' };
  }
  const values = {
    case_id: caseId || null,
    title,
    kind,
    event_date: eventDate,
    start_time: startTime || null,
    end_time: endTime || null,
    location: read(form, 'location', 200) || null,
    staff: read(form, 'staff', 150) || null,
    status,
    notes: read(form, 'notes', 2000) || null,
    updated_at: new Date().toISOString(),
  };
  const result = id
    ? await client.from('calendar_entries').update(values).eq('id', id).eq('organization_id', organizationId).select('id').single()
    : await client.from('calendar_entries').insert({ ...values, organization_id: organizationId, source, created_by: auth.claims.sub }).select('id').single();
  if (result.error) return { error: 'Could not save the calendar entry. Check your access and try again.' };
  revalidatePath('/');
  return { message: id ? 'Calendar entry updated.' : 'Calendar entry added.' };
}
