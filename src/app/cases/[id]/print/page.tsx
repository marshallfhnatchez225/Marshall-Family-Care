import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/print-button';
import { createClient } from '@/lib/supabase/server';
import { arrangementGroups } from '@/lib/arrangement-fields';
import { fields, labels, legacyFieldLabels, type SectionKey } from '@/lib/packet-fields';
import { caseName, dateLabel, label, type CaseRecord, type DocumentRecord, type ServiceRecord } from '@/lib/pipeline';
import styles from './print.module.css';

export const dynamic = 'force-dynamic';

type PrintScope = 'arrangement' | 'family' | SectionKey;
const sections = Object.keys(labels) as SectionKey[];

function isSection(value: string): value is SectionKey {
 return sections.includes(value as SectionKey);
}

function answerLabel(section: SectionKey, key: string) {
 return fields[section].flatMap(group => group.fields).find(field => field.name === key)?.label
  || legacyFieldLabels[section]?.[key]
  || key.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function Answers({entries}:{entries:[string,string][]}) {
 if (!entries.length) return <p className={styles.empty}>No answers saved yet.</p>;
 return <dl className={styles.answers}>{entries.map(([title,value],index) => <div key={`${title}-${index}`}><dt>{title}</dt><dd>{value}</dd></div>)}</dl>;
}

export default async function PrintCasePage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{scope?:string}>}) {
 const [{id},{scope:requestedScope}]=await Promise.all([params,searchParams]);
 if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
 const scope:PrintScope=requestedScope==='arrangement'||requestedScope==='family'||(requestedScope&&isSection(requestedScope))?requestedScope:'family';
 const client=await createClient();
 const [caseResult,docsResult,servicesResult]=await Promise.all([
  client.from('cases').select('id,organization_id,family_id,case_number,stage,status,updated_at,metadata').eq('id',id).maybeSingle(),
  client.from('documents').select('id,case_id,title,kind,status,storage_path,metadata,updated_at').eq('case_id',id).not('metadata->>section','is',null).order('created_at').limit(100),
  client.from('services').select('id,title,starts_at,status').eq('case_id',id).eq('kind','arrangement'),
 ]);
 if (caseResult.error || docsResult.error || servicesResult.error) throw new Error('Unable to load the print view.');
 if (!caseResult.data) notFound();
 const c=caseResult.data as CaseRecord;
 const docs=(docsResult.data||[]) as DocumentRecord[];
 const appointments=(servicesResult.data||[]) as ServiceRecord[];
 const sheet=(c.metadata.arrangement_sheet||{}) as Record<string,string>;
 const selectedDocs=scope==='family'?docs.filter(doc=>Object.values(doc.metadata.responses||{}).some(Boolean)):scope==='arrangement'?[]:docs.filter(doc=>doc.metadata.section===scope);
 const title=scope==='arrangement'?'Arrangement details':scope==='family'?'Family documents':labels[scope];

 return <main className={styles.page}>
  <nav className={styles.controls}><Link href={`/cases/${id}`}>← Back to case</Link><PrintButton href={`/cases/${id}/print/pdf?scope=${scope}`}/></nav>
  <p className={styles.printHelp}>Open the downloaded PDF to print it or save a copy.</p>
  <header className={styles.header}><p>Marshall Funeral Home · Case {c.case_number}</p><h1>{title}</h1><h2>{caseName(c)}</h2>{Boolean(c.metadata.next_of_kin_name)&&<p>Next of kin: {String(c.metadata.next_of_kin_name)}</p>}</header>
  {scope==='arrangement'?<section className={`${styles.document} ${styles.arrangementDocument}`}>
   <div className={styles.group}><h3>Arrangement conference</h3>{appointments.length?appointments.map(appointment=><p key={appointment.id}><strong>{appointment.title}</strong><br/>{dateLabel(appointment.starts_at)} · {label(appointment.status)}</p>):<p className={styles.empty}>No arrangement appointment saved yet.</p>}</div>
   {arrangementGroups.map(group=>{
    const entries=group.fields.map(field=>{
     const [section,key]=field.auto?.split('.')||[];
     const familyValue=docs.find(doc=>doc.metadata.section===section)?.metadata.responses?.[key];
     return [field.label,String(sheet[field.name]??familyValue??'').trim()] as [string,string];
    }).filter(([,value])=>value);
    return <div className={styles.group} key={group.heading}><h3>{group.heading}</h3><Answers entries={entries}/></div>;
   })}</section>:selectedDocs.length?selectedDocs.map(doc=>{
   const section=doc.metadata.section as SectionKey;
   if (!isSection(section)) return null;
   const entries=Object.entries(doc.metadata.responses||{}).filter(([key,value])=>Boolean(value)&&!key.toLowerCase().includes('signaturedata')).map(([key,value])=>[answerLabel(section,key),String(value)] as [string,string]);
   return <section className={`${styles.document} ${styles.familyDocument}`} key={doc.id}><div className={styles.documentHead}><h2>{labels[section]}</h2><span>{label(doc.status)}</span></div><Answers entries={entries}/></section>;
  }):<p className={styles.empty}>No family answers have been saved yet.</p>}
 </main>;
}
