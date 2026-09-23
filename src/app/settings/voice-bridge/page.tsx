import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {VoiceJobControls} from '@/components/voice-job-controls';
import {createClient} from '@/lib/supabase/server';
export default async function VoiceBridgePage(){
 const client=await createClient();
 const {data,error}=await client.from('voice_deliveries').select('id,case_id,recipient,status,evidence,created_at,lease_until').order('created_at',{ascending:false}).limit(100);
 return <AppShell active="settings"><div className="content workflow">
  <header className="commandhero"><div><p className="eyebrow">Google Voice</p><h1>Text delivery queue</h1><p>Intake messages sent through the signed-in Marshall Google Voice browser.</p></div><Link className="secondary" href="/intake">Back to Intake</Link></header>
  <section className="workflow-card"><h2>Local sending bridge</h2><p>Codex checks this queue on this computer. Keep Codex available and Marshall Google Voice signed in. Queued does not mean sent. Held attempts require review before another send.</p><a className="link" href="https://voice.google.com/" target="_blank" rel="noreferrer">Open Google Voice</a></section>
  {error&&<p className="formerror">Unable to load the delivery queue. Check your access and database setup.</p>}
  {!error&&!data?.length&&<section className="workflow-card"><h2>No queued texts</h2><p>Choose Send documents through Google Voice on an Intake case to authorize a new packet message.</p></section>}
  {data?.map(job=><article className="workflow-card" key={job.id}><h2>Text to {job.recipient}</h2><p>Delivery ID: {job.id}</p><p>Created: {job.created_at}</p><Link className="link" href={`/cases/${job.case_id}`}>Review case</Link>{job.evidence&&<p>{job.evidence}</p>}<VoiceJobControls id={job.id} status={job.status}/></article>)}
 </div></AppShell>;
}
