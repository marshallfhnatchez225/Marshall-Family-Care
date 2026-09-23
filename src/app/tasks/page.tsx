import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {ActionForm} from '@/components/action-form';
import {pipelineAction} from '@/app/pipeline-actions';
import {createClient} from '@/lib/supabase/server';
import {caseName,label,type CaseRecord,type TaskRecord} from '@/lib/pipeline';

export default async function TasksPage(){
 const client=await createClient();
 const [taskResult,caseResult]=await Promise.all([
  client.from('tasks').select('id,case_id,title,status,family_visible,due_at').order('created_at',{ascending:false}).limit(200),
  client.from('cases').select('id,organization_id,family_id,case_number,stage,status,updated_at,metadata').limit(200),
 ]);
 const tasks=(taskResult.data||[]) as TaskRecord[];
 const cases=(caseResult.data||[]) as CaseRecord[];
 const open=tasks.filter(task=>task.status!=='done');
 return <AppShell active="tasks"><div className="content workflow"><header className="commandhero"><div><p className="eyebrow">Production queue</p><h1>Tasks</h1><p>Orders and design work created from each family’s arrangement.</p></div><span className="badge green">{open.length} open</span></header>
  <div className="task-summary"><article><span>Open work</span><strong>{open.length}</strong></article><article><span>Completed</span><strong>{tasks.length-open.length}</strong></article><article><span>Cases represented</span><strong>{new Set(tasks.map(task=>task.case_id)).size}</strong></article></div>
  <section className="workflow-card"><h2>Case production work</h2><p>When casket, panel, overlay, vault or box, limousine, DVD, or keyring details are entered on an arrangement sheet, the matching task appears here automatically.</p>{taskResult.error&&<p className="formerror">Unable to load tasks.</p>}{!tasks.length&&<p>No arrangement tasks yet.</p>}{tasks.map(task=>{const c=cases.find(item=>item.id===task.case_id);return <div className="workflow-row task-row" key={task.id}><div><strong>{task.title}</strong><small>{c?`${c.case_number} · ${caseName(c)}`:'Case'} · {label(task.status)}</small></div>{c&&<Link className="link" href={`/cases/${c.id}#arrangement`}>Open arrangement</Link>}<ActionForm action={pipelineAction} submit={task.status==='done'?'Reopen':'Complete'}><input type="hidden" name="op" value="task-status"/><input type="hidden" name="case_id" value={task.case_id}/><input type="hidden" name="record_id" value={task.id}/><input type="hidden" name="status" value={task.status==='done'?'open':'done'}/></ActionForm></div>})}</section>
 </div></AppShell>;
}
