'use client';
import {useActionState} from 'react';
import {voiceAction,type VoiceState} from '@/app/settings/voice-bridge/actions';
export function VoiceJobControls({id,status}:{id:string;status:string}){
 const [state,action,pending]=useActionState<VoiceState,FormData>(voiceAction,{});
 const current=state.job?.status||status;
 const claimed=Boolean(state.job?.claim_token)&&['claimed','sending'].includes(current);
 return <form action={action} className="workflow-form">
  <input type="hidden" name="job_id" value={id}/><input type="hidden" name="lease_token" value={state.job?.claim_token||''}/>
  <p role="status">Delivery status: <strong>{current}</strong></p>
  {claimed&&<><label>Claimed recipient<input readOnly value={state.job!.recipient}/></label><label>Exact queued message<textarea readOnly rows={7} value={state.job!.body}/></label><p>Claim expires: {state.job?.lease_until}. Verify the Marshall Google Voice account and recipient before sending.</p></>}
  {(claimed||['uncertain','failed'].includes(current))&&<label>Verification evidence or failure reason<textarea name="note" minLength={10} maxLength={2000} placeholder="Describe the matching outgoing message, recipient, and timestamp, or why sending stopped."/></label>}
  <div className="workflow-actions">
   {current==='queued'&&<><button className="primary" name="command" value="claim" disabled={pending}>Claim for browser send</button><button className="secondary" name="command" value="cancel" disabled={pending}>Cancel queued text</button></>}
   {claimed&&current==='claimed'&&<><button className="primary" name="command" value="begin" disabled={pending}>Begin send attempt</button><button className="secondary" name="command" value="failed" disabled={pending}>Blocked before sending</button></>}
   {claimed&&current==='sending'&&<button className="primary" name="command" value="sent" disabled={pending}>Confirm visible in Google Voice</button>}
   {claimed&&<button className="secondary" name="command" value="uncertain" disabled={pending}>Hold for review</button>}
   {!claimed&&['claimed','sending'].includes(current)&&<button className="secondary" name="command" value="claim" disabled={pending}>Check interrupted attempt</button>}
   {['uncertain','failed'].includes(current)&&<><button className="primary" name="command" value="resolve-sent" disabled={pending}>Verified already sent</button><button className="secondary" name="command" value="resolve-unsent" disabled={pending}>Verified not sent · allow new packet</button></>}
  </div>
  {state.error&&<p className="formerror" role="alert">{state.error}</p>}{state.job?.evidence&&<p>{state.job.evidence}</p>}
 </form>;
}
