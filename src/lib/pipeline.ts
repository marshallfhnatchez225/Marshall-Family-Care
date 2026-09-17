export const stages = ['intake','arrangement','documents','approvals','service','certificates','aftercare','complete'] as const;
export const certificateStates = ['ordered','filed','ready','picked_up','mailed'] as const;
export type CaseRecord = { id: string; organization_id: string; family_id: string; case_number: string; stage: string; status: string; updated_at: string; metadata: Record<string, unknown> };
export type DocumentRecord = { id: string; case_id: string; title: string; kind: string; status: string; storage_path: string | null; metadata: { section?: string; responses?: Record<string,string>; family_visible?: boolean; original_name?: string }; updated_at: string };
export type TaskRecord = { id: string; case_id: string; title: string; status: string; family_visible: boolean; due_at: string | null };
export type ServiceRecord = { id: string; title: string; starts_at: string | null; status: string };
export type MessageRecord = { id: string; subject: string; body: string; status: string; channel: string; created_at: string };
export function caseName(c: CaseRecord) { return String(c.metadata.decedent_name || c.case_number); }
export function label(value: string) { return value.replaceAll('_',' ').replaceAll('-',' '); }
export function dateLabel(value: string | null) { return value ? new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Chicago'}).format(new Date(value))+' CT' : 'Not scheduled'; }
