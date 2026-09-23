import Link from 'next/link';
import { AppShell } from './app-shell';
import { createClient } from '@/lib/supabase/server';
import { stages,caseName,label,type CaseRecord } from '@/lib/pipeline';

export async function PipelineBoard({active='cases'}:{active?:string}) {
 const client=await createClient();
 const {data,error}=await client.from('cases').select('id,organization_id,family_id,case_number,stage,status,updated_at,metadata').order('opened_at',{ascending:false}).limit(100);
 const cases=((data||[]) as CaseRecord[]).filter(c=>c.stage!=='intake');
 const caseStages=stages.filter(stage=>stage!=='intake');
 if(active==='cases')return <AppShell active="cases"><div className="content workflow cases-directory-page"><header className="commandhero"><div><p className="eyebrow">Marshall Family Care</p><h1>Cases</h1><p>Select a name to open the family’s case.</p></div><Link className="primary" href="/intake">Start a case in Intake</Link></header>
 {error&&<p className="formerror">Unable to load cases: {error.message}</p>}
 <section className="workflow-card case-directory"><h2>Families</h2>{cases.map(c=><Link href={`/cases/${c.id}`} key={c.id} className="case-directory-row"><strong>{caseName(c)}</strong><span>Open case →</span></Link>)}{!error&&!cases.length&&<p>No cases are available yet.</p>}</section>
 </div></AppShell>;
 return <AppShell active={active}><div className="content workflow"><header className="commandhero"><div><p className="eyebrow">Marshall Family Care</p><h1>{active==='family-care'?'Family care pipeline':'Funeral pipeline'}</h1><p>One case, one shared plan—from the first call through aftercare.</p></div><Link className="primary" href="/intake">Start a case in Intake</Link></header>
 <div className="pipeline-strip graduating">{caseStages.map(stage=><a key={stage} href={`#stage-${stage}`}><span>{label(stage)}</span><strong>{cases.filter(c=>c.stage===stage).length}</strong></a>)}</div>
 {error&&<p className="formerror">Unable to load the pipeline: {error.message}</p>}
 <section className="pipeline-board">{caseStages.map(stage=><section id={`stage-${stage}`} key={stage} className="pipeline-column"><h2>{label(stage)} <small>{cases.filter(c=>c.stage===stage).length}</small></h2>{cases.filter(c=>c.stage===stage).map(c=><Link href={`/cases/${c.id}`} key={c.id} className="pipeline-case"><span className="eyebrow">{c.case_number}</span><h3>{caseName(c)}</h3><p>{String(c.metadata.family_email||c.metadata.family_mobile||'Contact details pending')}</p><span className="link">Open case →</span></Link>)}{!cases.some(c=>c.stage===stage)&&<p className="pipeline-empty">No cases at this stage</p>}</section>)}</section>
 <section className="workflow-card intake-callout"><div><p className="eyebrow">New first call</p><h2>New cases now begin in Intake</h2><p>Add the family, choose the first-call documents, and send the private packet there. The case graduates here automatically.</p></div><Link className="primary" href="/intake">Open Intake</Link></section>
 </div></AppShell>;
}
