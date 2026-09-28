import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {VoiceJobControls} from '@/components/voice-job-controls';
import {createClient} from '@/lib/supabase/server';
export default async function VoiceBridgePage(){
 const client=await createClient();
 const {data,error}=await client.from('voice_deliveries').select('id,case_id,recipient,status,evidence,created_at,lease_until').order('created_at',{ascending:false}).limit(100);
 return <AppShell active="settings"><div className="content workflow">
  <header className="commandhero"><div><p className="eyebrow">Google Voice</p><h1>Earlier text deliveries</h1><p>Review packets created by the former browser delivery queue.</p></div><Link className="secondary" href="/intake">Back to Intake</Link></header>
  <section className="workflow-card"><h2>Existing queued packets</h2><p>New Intake packets use the prepared-message handoff. Earlier queued or uncertain deliveries remain here for review. Check Google Voice before confirming a delivery or preparing another link.</p><a className="link" href="https://voice.google.com/" target="_blank" rel="noreferrer">Open Google Voice</a></section>
  {error&&<p className="formerror">Unable to load the delivery queue. Check your access and database setup.</p>}
  {!error&&!data?.length&&<section className="workflow-card"><h2>No earlier queued texts</h2><p>Prepare new packet messages from Intake.</p></section>}
  {data?.map(job=><article className="workflow-card" key={job.id}><h2>Text to {job.recipient}</h2><p>Delivery ID: {job.id}</p><p>Created: {job.created_at}</p><Link className="link" href={`/cases/${job.case_id}`}>Review case</Link>{job.evidence&&<p>{job.evidence}</p>}<VoiceJobControls id={job.id} status={job.status}/></article>)}
 </div></AppShell>;
}
