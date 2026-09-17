import {AppShell} from '@/components/app-shell';
export default function Loading(){return <AppShell><div className="content workflow" role="status" aria-live="polite"><p className="eyebrow">Marshall OS</p><h1>Opening your workspace…</h1><div className="workflow-grid">{[1,2,3,4].map(i=><div className="workflow-card loading-card" key={i}><div/><div/><div/></div>)}</div></div></AppShell>;}
