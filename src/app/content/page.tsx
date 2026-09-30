import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { ActionForm } from '@/components/action-form';
import { createClient } from '@/lib/supabase/server';
import { prepareNewspaperDraft, saveNewspaperDraft } from './actions';

type ContentRow = { id: string; case_id: string | null; document_id: string | null; title: string; channel: string; status: string; body: string | null; current_version: number; updated_at: string };
type ObituaryDocument = { id: string; case_id: string; updated_at: string };

export default async function ContentPage() {
  const client = await createClient();
  const [contentResult, formsResult, generalResult] = await Promise.all([
    client.from('content').select('id,case_id,document_id,title,channel,status,body,current_version,updated_at').order('updated_at', { ascending: false }).limit(100),
    client.from('documents').select('id,case_id,updated_at').eq('kind', 'obituary').in('status', ['submitted', 'approved']).order('updated_at', { ascending: false }).limit(100),
    client.from('documents').select('case_id,updated_at').eq('metadata->>section', 'general').order('updated_at', { ascending: false }).limit(100),
  ]);
  const records = (contentResult.data || []) as ContentRow[];
  const forms = (formsResult.data || []) as ObituaryDocument[];
  const draftDocumentIds = new Set(records.filter(row => row.channel === 'newspaper').map(row => row.document_id));
  const missing = forms.filter(form => !draftDocumentIds.has(form.id));
  const caseIds = [...new Set(missing.map(form => form.case_id))];
  const caseResult = caseIds.length ? await client.from('cases').select('id,case_number,metadata').in('id', caseIds) : null;
  const caseLabels = new Map((caseResult?.data || []).map(row => [row.id, `${row.case_number} · ${String((row.metadata as Record<string, unknown>)?.decedent_name || 'Family case')}`]));
  const formDates = new Map(forms.map(form => [form.id, form.updated_at]));
  const generalDates = new Map((generalResult.data || []).map(form => [form.case_id, form.updated_at]));

  return <AppShell active="content"><div className="content workflow">
    <header className="commandhero"><div><p className="eyebrow">Editorial workspace</p><h1>Content</h1><p>Review newspaper obituary drafts created from family-submitted forms.</p></div></header>
    <section className="workflow-card"><h2>Newspaper obituaries</h2><p>These are working drafts. Verify names, dates, service details, and family wording before sending copy to a newspaper. Nothing here is published automatically.</p>
      {contentResult.error && <p className="formerror">Content could not be loaded. Please try again.</p>}
      {formsResult.error && <p className="formerror">Submitted obituary forms could not be checked. Please try again.</p>}
      {generalResult.error && <p className="formerror">General Information updates could not be checked. Please try again.</p>}
      {!contentResult.error && !records.length && <p>No content records yet. A newspaper draft will appear after a family submits an obituary form.</p>}
    </section>
    {missing.length > 0 && <section className="workflow-card"><h2>Submitted forms awaiting a draft</h2><p>Prepare drafts from forms submitted before this feature was added, or retry a draft that could not be created.</p>
      {missing.map(form => <div className="workflow-row" key={form.id}><div><strong>{caseLabels.get(form.case_id) || 'Family case'}</strong><small>Obituary form submitted</small></div><ActionForm action={prepareNewspaperDraft} submit="Prepare newspaper draft"><input type="hidden" name="case_id" value={form.case_id}/><input type="hidden" name="document_id" value={form.id}/></ActionForm></div>)}
    </section>}
    {records.map(row => <section className="workflow-card" key={row.id}><p className="eyebrow">{row.channel.replaceAll('_', ' ')} · {row.status.replaceAll('_', ' ')}</p><h2>{row.title}</h2>
      {row.case_id && <p><Link className="link" href={`/cases/${row.case_id}`}>Open family case</Link></p>}
      {row.document_id && Math.max(new Date(formDates.get(row.document_id) || 0).getTime(), new Date(generalDates.get(row.case_id || '') || 0).getTime()) > new Date(row.updated_at).getTime() && <p className="form-note">The family forms changed after this draft. Review the latest answers in the case before sending it.</p>}
      {row.channel === 'newspaper' && (row.status === 'draft' || row.status === 'in_review')
        ? <ActionForm action={saveNewspaperDraft} submit="Save newspaper draft"><input type="hidden" name="id" value={row.id}/><label>Headline<input name="title" defaultValue={row.title} maxLength={200} required/></label><label>Newspaper write-up<textarea name="body" defaultValue={row.body || ''} rows={14} maxLength={20000} required/></label><p className="form-note">Edit the copy here, then save it. A later family submission will not overwrite staff edits.</p></ActionForm>
        : <label>Content<textarea readOnly value={row.body || ''} rows={12}/></label>}
    </section>)}
  </div></AppShell>;
}
