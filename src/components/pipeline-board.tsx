import Link from 'next/link';
import { AppShell } from './app-shell';
import { ActionForm } from './action-form';
import { pipelineAction } from '@/app/pipeline-actions';
import { createClient } from '@/lib/supabase/server';
import { stages,caseName,label,type CaseRecord } from '@/lib/pipeline';

export async function PipelineBoard({active='cases'}:{active?:string}) {
 const client=await createClient();
 const {data,error}=await client.from('cases').select('id,organization_id,family_id,case_number,stage,status,updated_at,metadata').order('opened_at',{ascending:false}).limit(100);
 const cases=(data||[]) as CaseRecord[];
 return <AppShell active={active}><div className="content workflow"><header className="commandhero"><div><p className="eyebrow">Marshall Family Care</p><h1>{active==='family-care'?'Family care pipeline':'Funeral pipeline'}</h1><p>One case, one shared plan—from the first call through aftercare.</p></div><a className="primary" href="#new-case">Start a case</a></header>
 <div className="pipeline-strip">{stages.map(stage=><a key={stage} href={`#stage-${stage}`}><span>{label(stage)}</span><strong>{cases.filter(c=>c.stage===stage).length}</strong></a>)}</div>
 {error&&<p className="formerror">Unable to load the pipeline: {error.message}</p>}
 <section className="pipeline-board">{stages.map(stage=><section id={`stage-${stage}`} key={stage} className="pipeline-column"><h2>{label(stage)} <small>{cases.filter(c=>c.stage===stage).length}</small></h2>{cases.filter(c=>c.stage===stage).map(c=><Link href={`/cases/${c.id}`} key={c.id} className="pipeline-case"><span className="eyebrow">{c.case_number}</span><h3>{caseName(c)}</h3><p>{String(c.metadata.family_email||c.metadata.family_mobile||'Contact details pending')}</p><span className="link">Open case →</span></Link>)}{!cases.some(c=>c.stage===stage)&&<p className="pipeline-empty">No cases at this stage</p>}</section>)}</section>
 <section className="workflow-card" id="new-case"><p className="eyebrow">First call</p><h2>Start a case and family packet</h2><p>Start with the family contact if the name is not yet known. Their packet answers will fill it in.</p><ActionForm action={pipelineAction} submit="Create case"><input type="hidden" name="op" value="create"/><label>Decedent name (if known)<input name="name" minLength={2} maxLength={200}/></label><label>Family email<input name="email" type="email"/></label><label>Family mobile<input name="mobile" type="tel"/></label></ActionForm></section>
 </div></AppShell>;
}
