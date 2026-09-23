import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {ActionForm} from '@/components/action-form';
import {pipelineAction} from '@/app/pipeline-actions';
import {createClient} from '@/lib/supabase/server';
import {caseName,type CaseRecord,type DocumentRecord} from '@/lib/pipeline';

const firstCallDocuments=[
 {section:'embalming',label:'Permission to Embalm',description:'Authorization and representative signature'},
 {section:'general',label:'General Information',description:'Decedent, informant, insurance, and service details'},
 {section:'obituary',label:'Obituary',description:'Life story, family, viewing, and service information'},
 {section:'deathCertificate',label:'Death Certificate Worksheet',description:'Information needed to prepare and order certificates'},
] as const;

export default async function IntakePage(){
 const client=await createClient();
 const [caseResult,documentResult]=await Promise.all([
  client.from('cases').select('id,organization_id,family_id,case_number,stage,status,updated_at,metadata').eq('stage','intake').order('opened_at',{ascending:false}).limit(100),
  client.from('documents').select('id,case_id,title,kind,status,storage_path,metadata,updated_at').not('metadata->>section','is',null).limit(400),
 ]);
 const cases=(caseResult.data||[]) as CaseRecord[];
 const documents=(documentResult.data||[]) as DocumentRecord[];
 return <AppShell active="intake"><div className="content workflow intake-page">
  <header className="commandhero"><div><p className="eyebrow">First call workspace</p><h1>Intake</h1><p>Add the case, choose the first-call forms, and send one secure family packet.</p></div><span className="badge green">{cases.length} awaiting intake</span></header>
  <div className="graduation-guide"><span><b>1</b> Add first call</span><i>→</i><span><b>2</b> Send documents</span><i>→</i><span><b>3</b> Case appears in Cases</span><i>→</i><span><b>4</b> Arrangement creates Tasks</span></div>
  <section className="workflow-card" id="new-case"><p className="eyebrow">Step 1</p><h2>Add the first call</h2><p>Create the private intake record. It stays here until the first-call packet is prepared.</p><ActionForm action={pipelineAction} submit="Add to intake"><input type="hidden" name="op" value="create"/><label>Decedent name (if known)<input name="name" minLength={2} maxLength={200} placeholder="Awaiting family information"/></label><label>Family email<input name="email" type="email"/></label><label>Family mobile / Google Voice number<input name="mobile" type="tel"/></label><label className="check-label"><input name="email_updates_enabled" type="checkbox"/>The family agrees to receive case updates by email</label></ActionForm></section>
  <section><div className="section-heading"><div><p className="eyebrow">Step 2</p><h2>Send first-call documents</h2></div><p>Each packet uses a private link that expires after seven days.</p></div>
   {caseResult.error&&<p className="formerror">Unable to load intake cases.</p>}
   {!cases.length&&<div className="workflow-card intake-empty"><h2>No first calls waiting</h2><p>Add a case above. After its packet is sent, it will graduate out of Intake automatically.</p></div>}
   <div className="intake-list">{cases.map(c=>{const caseDocs=documents.filter(d=>d.case_id===c.id);return <article className="workflow-card intake-case" key={c.id}><div className="intake-case-head"><div><span className="eyebrow">{c.case_number}</span><h2>{caseName(c)}</h2><p>{String(c.metadata.family_email||'Email not recorded')} · {String(c.metadata.family_mobile||'Mobile not recorded')}</p></div><Link className="secondary" href={`/cases/${c.id}`}>Review case</Link></div><ActionForm action={pipelineAction} submit="Prepare packet & move to Cases"><input type="hidden" name="op" value="send-intake"/><input type="hidden" name="case_id" value={c.id}/><div className="document-picker">{firstCallDocuments.map(document=>{const record=caseDocs.find(d=>d.metadata.section===document.section);return <label className="document-choice" key={document.section}><input type="checkbox" name={`document.${document.section}`} defaultChecked/><span><strong>{document.label}</strong><small>{document.description}</small></span><em>{record?.status||'ready'}</em></label>})}</div><p className="form-note">This prepares the family link and moves the case to Arrangement. If automatic Gmail is paused, copy the link into Google Voice or email.</p></ActionForm></article>})}</div>
  </section>
 </div></AppShell>;
}
