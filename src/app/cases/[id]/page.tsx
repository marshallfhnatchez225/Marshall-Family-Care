import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { ActionForm } from '@/components/action-form';
import { AppointmentFields } from '@/components/appointment-fields';
import { createClient } from '@/lib/supabase/server';
import { pipelineAction } from '@/app/pipeline-actions';
import { caseName, label, dateLabel, type CaseRecord, type DocumentRecord, type ServiceRecord } from '@/lib/pipeline';
import { fields, labels, legacyFieldLabels, type SectionKey } from '@/lib/packet-fields';
import { arrangementGroups } from '@/lib/arrangement-fields';

function Hidden({id,op,record}:{id:string;op:string;record?:string}) {
 return <><input type="hidden" name="case_id" value={id}/><input type="hidden" name="op" value={op}/>{record&&<input type="hidden" name="record_id" value={record}/>}</>;
}

export default async function CasePage({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const client=await createClient();
 const [caseResult,docsResult,servicesResult,eventsResult]=await Promise.all([
  client.from('cases').select('id,organization_id,family_id,case_number,stage,status,updated_at,metadata').eq('id',id).maybeSingle(),
  client.from('documents').select('id,case_id,title,kind,status,storage_path,metadata,updated_at').eq('case_id',id).order('created_at').limit(100),
  client.from('services').select('id,title,starts_at,status').eq('case_id',id).eq('kind','arrangement'),
  client.from('events').select('id,name,occurred_at').eq('payload->>case_id',id).order('occurred_at',{ascending:false}).limit(20),
 ]);
 if(caseResult.error)throw new Error('Unable to load this case.');
 if(!caseResult.data)notFound();
 const c=caseResult.data as CaseRecord;
 const docs=(docsResult.data||[])as DocumentRecord[];
 const appointments=(servicesResult.data||[])as ServiceRecord[];
 const events=eventsResult.data||[];
 const loadErrors=[docsResult,servicesResult,eventsResult].filter(result=>result.error);
 const sheet=(c.metadata.arrangement_sheet||{})as Record<string,string>;
 const sheetFields=arrangementGroups.flatMap(group=>group.fields).map(field=>[field.name,field.label,field.auto||'']);
 const familyForms=docs.filter(document=>document.metadata.section);
 const activityRow=(event:{id:string;name:string;occurred_at:string})=><div className="workflow-row" key={event.id}><strong>{label(event.name.toLowerCase().replaceAll('.',' · '))}</strong><small>{dateLabel(event.occurred_at)}</small></div>;

 return <AppShell active="cases"><div className="content workflow case-detail-page">
  <Link className="link" href="/cases">← Cases</Link>
  <header className="commandhero"><div><p className="eyebrow">Family case</p><h1>{caseName(c)}</h1></div><span className="badge">{label(c.stage)}</span></header>
  {!!loadErrors.length&&<p className="formerror">Some case information could not load. Refresh before making changes.</p>}

  <section className="workflow-card" id="arrangement">
   <p className="eyebrow">Arrangement details</p>
   <h2>Arrangement conference & order details</h2>
   {appointments.map(appointment=><p key={appointment.id}><strong>{appointment.title}</strong> · {dateLabel(appointment.starts_at)} · {appointment.status} <Link className="link" href={`/cases/${id}/calendar`}>Add to calendar</Link></p>)}
   <ActionForm action={pipelineAction} submit="Save appointment"><Hidden id={id} op="arrangement"/><label>Meeting place or instructions<input name="title" required placeholder="Arrangement conference at Marshall Funeral Home"/></label><AppointmentFields/></ActionForm>
   <div className="workflow-grid arrangement-tools">
    <details open><summary>Staff arrangement sheet · prefilled from family answers</summary><p>Entered merchandise automatically creates order and design tasks.</p><ActionForm action={pipelineAction} submit="Save arrangement details"><Hidden id={id} op="sheet"/>{sheetFields.map(([key,title,source])=><label key={key}>{title}<input name={`sheet.${key}`} defaultValue={sheet[key]??docs.find(document=>document.metadata.section===source.split('.')[0])?.metadata.responses?.[source.split('.')[1]]??''}/></label>)}</ActionForm></details>
    <section className="arrangement-photo"><h3>Send a photo of the arrangement sheet</h3><p>Take a picture on your phone or choose an existing image.</p>{docs.filter(document=>document.kind==='arrangement_sheet_photo').map(document=><div className="workflow-row" key={document.id}><strong>{document.title}</strong><a className="link" href={`/documents/${document.id}/download`}>View image</a></div>)}<ActionForm action={pipelineAction} submit="Send arrangement sheet photo"><Hidden id={id} op="arrangement-photo"/><input type="hidden" name="title" value="Arrangement sheet photo"/><label>Take picture or choose image<input name="file" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" required/></label></ActionForm></section>
   </div>
  </section>

  <section className="workflow-card" id="packet">
   <p className="eyebrow">Family documents</p>
   <h2>Forms completed by the family</h2>
   <p>Open a form to view the information the family provided.</p>
   <div className="packet-review-grid">{familyForms.map(document=>{const packetSection=document.metadata.section as SectionKey;return <details key={document.id}><summary><strong>{labels[packetSection]||document.title}</strong><span className="badge">{label(document.status)}</span></summary><dl className="answers">{Object.entries(document.metadata.responses||{}).filter(([,value])=>!!value).map(([key,value])=><div key={key}><dt>{fields[packetSection]?.flatMap(group=>group.fields).find(field=>field.name===key)?.label||legacyFieldLabels[packetSection]?.[key]||key}</dt><dd>{key.toLowerCase().includes('signaturedata')?'Signature retained in original portal record':value}</dd></div>)}</dl><ActionForm action={pipelineAction} submit="Save review"><Hidden id={id} op="review" record={document.id}/><label>Review status<select name="status" defaultValue={document.status}>{['incomplete','submitted','needs-follow-up','approved'].map(status=><option key={status} value={status}>{label(status)}</option>)}</select></label></ActionForm></details>})}</div>
   {!familyForms.length&&<p>No family forms are available yet.</p>}
  </section>

  <section className="workflow-card" id="activity">
   <p className="eyebrow">Case timeline</p>
   <h2>Recent activity</h2>
   {events.slice(0,5).map(activityRow)}
   {events.length>5&&<details className="activity-more"><summary>View more activity</summary>{events.slice(5).map(activityRow)}</details>}
   {!events.length&&<p>No activity has been recorded yet.</p>}
  </section>
 </div></AppShell>;
}
