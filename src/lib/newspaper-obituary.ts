import type { SupabaseClient } from '@supabase/supabase-js';

type Answers = Record<string, unknown>;
type Source = { caseName: string; caseNumber: string; obituary: Answers; general: Answers };

const answer = (source: Answers, key: string) => typeof source[key] === 'string' ? String(source[key]).trim().replace(/\s+/g, ' ').slice(0, 5000) : '';
const first = (...values: string[]) => values.find(Boolean) || '';
const sentence = (value: string) => value ? /[.!?]$/.test(value) ? value : `${value}.` : '';

function dateLabel(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  return date.toISOString().slice(0, 10) === value
    ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date)
    : value;
}

function timeLabel(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return value;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? 'AM' : 'PM'}`;
}

function eventLine(label: string, date: string, time: string, place: string) {
  if (!date && !time && !place) return '';
  return sentence(`${label}${date ? ` on ${dateLabel(date)}` : ''}${time ? ` at ${timeLabel(time)}` : ''}${place ? ` at ${place}` : ''}`);
}

export function buildNewspaperObituary({ caseName, caseNumber, obituary, general }: Source) {
  const name = first(answer(obituary, 'name'), answer(general, 'fullName'), /^(awaiting|unknown)/i.test(caseName) ? '' : caseName);
  const ageValue = first(answer(obituary, 'age'), answer(general, 'age'));
  const age = /^\d{1,3}$/.test(ageValue) && Number(ageValue) <= 120 ? ageValue : '';
  const city = first(answer(obituary, 'city'), answer(general, 'city'));
  const state = first(answer(obituary, 'state'), answer(general, 'state'));
  const residence = first([city, state].filter(Boolean).join(', '), answer(obituary, 'address'));
  const died = first(answer(obituary, 'dateOfDeath'), answer(general, 'dateOfDeath'));
  const displayName = name || '[Full name to confirm]';
  const lead = died
    ? sentence(`${displayName}${age ? `, ${age}` : ''}${residence ? `, of ${residence}` : ''}, died ${dateLabel(died)}`)
    : sentence(`Family and friends remember ${displayName}${age ? `, ${age}` : ''}${residence ? `, of ${residence}` : ''}`);

  const life = answer(obituary, 'lifeDetails');
  const organizations = answer(obituary, 'organizations');
  const preceded = answer(obituary, 'precededInDeath').replace(/^preceded in death by\s*/i, '');
  const survivors = answer(obituary, 'survivors').replace(/^(survived by|survivors include)\s*/i, '');
  const serviceDate = first(answer(obituary, 'serviceDate'), answer(general, 'funeralDate'));
  const serviceTime = first(answer(obituary, 'serviceTime'), answer(general, 'funeralTime'));
  const servicePlace = first(answer(obituary, 'servicePlace'), answer(general, 'funeralPlace'));
  const viewingDate = first(answer(obituary, 'viewingWakeDate'), answer(obituary, 'viewingDate'), answer(obituary, 'wakeDate'));
  const viewingTime = first(answer(obituary, 'viewingWakeTime'), answer(obituary, 'viewingTime'), answer(obituary, 'wakeTime'));
  const viewingPlace = first(answer(obituary, 'viewingWakePlace'), answer(obituary, 'viewingPlace'), answer(obituary, 'wakePlace'));
  const churchViewing = answer(obituary, 'viewingAtChurch');
  const cemetery = first(answer(obituary, 'cemetery'), answer(general, 'cemeteryName'));

  const paragraphs = [
    lead,
    life && sentence(life),
    organizations && sentence(`${displayName} was a member of ${organizations}`),
    preceded && sentence(`${displayName} was preceded in death by ${preceded}`),
    survivors && sentence(`Survivors include ${survivors}`),
    eventLine('Visitation will be held', viewingDate, viewingTime, viewingPlace),
    churchViewing && sentence(`Viewing at the church begins at ${timeLabel(churchViewing)}`),
    eventLine('Funeral services will be held', serviceDate, serviceTime, servicePlace),
    cemetery && sentence(`Interment will be at ${cemetery}`),
  ].filter(Boolean);

  return { title: `Newspaper obituary — ${name || caseNumber}`, body: paragraphs.join('\n\n') };
}

export async function syncNewspaperObituary(client: SupabaseClient, organizationId: string, caseId: string, documentId: string, force = false) {
  const [caseResult, obituaryResult, generalResult] = await Promise.all([
    client.from('cases').select('case_number,metadata').eq('id', caseId).eq('organization_id', organizationId).single(),
    client.from('documents').select('id,status,metadata').eq('id', documentId).eq('case_id', caseId).eq('organization_id', organizationId).eq('kind', 'obituary').single(),
    client.from('documents').select('metadata').eq('case_id', caseId).eq('organization_id', organizationId).eq('metadata->>section', 'general').maybeSingle(),
  ]);
  if (caseResult.error || obituaryResult.error || generalResult.error || !caseResult.data || !obituaryResult.data) throw new Error('Could not read the obituary source.');
  if (obituaryResult.data.status !== 'submitted' && obituaryResult.data.status !== 'approved') throw new Error('Submit the family obituary form before preparing a newspaper draft.');

  const obituaryMetadata = (obituaryResult.data.metadata || {}) as Answers;
  const generalMetadata = (generalResult.data?.metadata || {}) as Answers;
  const caseMetadata = (caseResult.data.metadata || {}) as Answers;
  const draft = buildNewspaperObituary({
    caseName: answer(caseMetadata, 'decedent_name'),
    caseNumber: caseResult.data.case_number,
    obituary: (obituaryMetadata.responses || {}) as Answers,
    general: (generalMetadata.responses || {}) as Answers,
  });
  const { data: existing, error: lookupError } = await client.from('content')
    .select('id,status,current_version').eq('organization_id', organizationId).eq('document_id', documentId)
    .eq('channel', 'newspaper').order('created_at', { ascending: true }).limit(1).maybeSingle();
  if (lookupError) throw new Error('Could not check the newspaper draft.');
  if (existing) {
    if (!force && (existing.status !== 'draft' || existing.current_version > 1)) return 'preserved';
    const { error } = await client.from('content').update({
      title: draft.title, body: draft.body, updated_at: new Date().toISOString(),
      ...(force ? { status: 'draft', current_version: existing.current_version + 1, approved_by: null, approved_at: null } : {}),
    }).eq('id', existing.id).eq('organization_id', organizationId);
    if (error) throw new Error('Could not update the newspaper draft.');
    return 'updated';
  }
  const { error } = await client.from('content').insert({
    organization_id: organizationId, case_id: caseId, document_id: documentId,
    channel: 'newspaper', title: draft.title, body: draft.body, status: 'draft',
  });
  if (error) throw new Error('Could not create the newspaper draft.');
  return 'created';
}
