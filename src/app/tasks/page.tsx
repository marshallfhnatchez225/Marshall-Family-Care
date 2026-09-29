import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { ActionForm } from '@/components/action-form';
import { pipelineAction } from '@/app/pipeline-actions';
import { createClient } from '@/lib/supabase/server';
import { caseName, type CaseRecord, type TaskRecord } from '@/lib/pipeline';

const productionOrder = ['Order casket', 'Order panel', 'Order overlay', 'Order vault or box', 'Book limousine', 'Design DVD', 'Design keyrings'];

export default async function TasksPage() {
  const client = await createClient();
  const [taskResult, caseResult] = await Promise.all([
    client.from('tasks').select('id,case_id,title,status,family_visible,due_at').order('created_at', { ascending: false }).limit(200),
    client.from('cases').select('id,organization_id,family_id,case_number,stage,status,updated_at,metadata').limit(200),
  ]);
  const tasks = (taskResult.data || []) as TaskRecord[];
  const cases = (caseResult.data || []) as CaseRecord[];
  const caseById = new Map(cases.map(item => [item.id, item]));
  const taskTitles = [...new Set(tasks.map(task => task.title))].sort((a, b) => {
    const aIndex = productionOrder.indexOf(a);
    const bIndex = productionOrder.indexOf(b);
    if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
    if (aIndex >= 0) return -1;
    if (bIndex >= 0) return 1;
    return a.localeCompare(b);
  });
  const rows = [...new Set(tasks.map(task => task.case_id))].map(id => {
    const caseRecord = caseById.get(id);
    const caseTasks = tasks.filter(task => task.case_id === id);
    return { id, caseRecord, caseTasks, name: caseRecord ? caseName(caseRecord) : `Case ${id.slice(0, 8)}` };
  }).sort((a, b) => a.name.localeCompare(b.name));
  const openCount = tasks.filter(task => task.status !== 'done').length;

  return <AppShell active="tasks"><div className="content workflow tasks-page">
    <header className="commandhero"><div><p className="eyebrow">Production queue</p><h1>Tasks</h1><p>Track each family’s orders and design work in one view.</p></div><span className="badge green">{openCount} open</span></header>
    <section className="workflow-card task-matrix-card">
      <h2>Case production work</h2>
      <p>Tasks run across the top; family names run down the side. Select a status bar to complete or reopen a task.</p>
      {taskResult.error && <p className="formerror">Unable to load tasks.</p>}
      {caseResult.error && <p className="formerror">Unable to load case names.</p>}
      {!tasks.length && !taskResult.error && <p>No arrangement tasks yet.</p>}
      {!!tasks.length && <div className="task-matrix-scroll" role="region" aria-label="Production task status by family" tabIndex={0}>
        <table className="task-matrix">
          <thead><tr><th scope="col" className="task-case-column">Family</th>{taskTitles.map(title => <th scope="col" key={title}>{title}</th>)}</tr></thead>
          <tbody>{rows.map(row => {
            const completed = row.caseTasks.filter(task => task.status === 'done').length;
            return <tr key={row.id}>
              <th scope="row" className="task-case-column"><div className="task-case-name">{row.caseRecord ? <Link href={`/cases/${row.id}#arrangement`}>{row.name}</Link> : row.name}</div>{row.caseRecord && <small>{row.caseRecord.case_number}</small>}<progress value={completed} max={row.caseTasks.length} aria-label={`${row.name}: ${completed} of ${row.caseTasks.length} tasks complete`}/><small>{completed} of {row.caseTasks.length} complete</small></th>
              {taskTitles.map(title => <td key={title}>{row.caseTasks.filter(task => task.title === title).map(task => <ActionForm key={task.id} action={pipelineAction} className={`task-status-form ${task.status === 'done' ? 'is-done' : 'is-open'}`} submit={task.status === 'done' ? '✓ Done' : '○ Open'}><input type="hidden" name="op" value="task-status"/><input type="hidden" name="case_id" value={task.case_id}/><input type="hidden" name="record_id" value={task.id}/><input type="hidden" name="status" value={task.status === 'done' ? 'open' : 'done'}/></ActionForm>)}{!row.caseTasks.some(task => task.title === title) && <span className="task-not-applicable" aria-label="No task">—</span>}</td>)}
            </tr>;
          })}</tbody>
        </table>
      </div>}
    </section>
  </div></AppShell>;
}
