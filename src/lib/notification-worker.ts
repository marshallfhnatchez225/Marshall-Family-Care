import 'server-only';
import {privateClient} from './portal';
import {sendGmail,gmailReady,DeliveryError} from './gmail-delivery';

export async function processEmailQueue() {
 const org=process.env.MAIL_DELIVERY_ORGANIZATION_ID;
 if(!gmailReady()||!org)return {state:'not_configured'};
 const client=privateClient();
 const {data,error}=await client.rpc('claim_family_email',{target_org:org});
 if(error)throw new Error('Unable to claim email delivery.');
 const item=data?.[0];if(!item)return {state:'idle'};
 let status='accepted',providerId:string|null=null,lastError:string|null=null,availableAt=new Date().toISOString();
 try { const result=await sendGmail({to:item.recipient,subject:item.subject,body:item.body,messageId:item.id});providerId=result.providerId; }
 catch(error) {
  const failure=error instanceof DeliveryError?error:null;
  status=failure?.uncertain?'uncertain':failure?.retryable&&item.attempts<3?'pending':'failed';
  lastError=failure?.message||'Delivery could not be confirmed. Review before resending.';
  if(!failure)status='uncertain';
  availableAt=new Date(Date.now()+5*60*1000*item.attempts).toISOString();
 }
 const result=await client.from('email_deliveries').update({status,provider_id:providerId,last_error:lastError,available_at:availableAt,updated_at:new Date().toISOString()}).eq('id',item.id).eq('status','sending').select('id').single();
 if(result.error)throw new Error('Delivery result could not be saved; do not retry blindly.');
 const communication=await client.from('communications').update({status:status==='pending'?'queued':status,external_id:providerId,...(status==='accepted'?{sent_at:new Date().toISOString()}: {})}).eq('id',item.communication_id);
 if(communication.error)throw new Error('Email result saved; communication display could not be updated.');
 return {state:status};
}
