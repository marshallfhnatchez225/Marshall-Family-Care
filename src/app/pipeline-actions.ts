'use server';
import { randomBytes, randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { processEmailQueue } from '@/lib/notification-worker';
import { createClient } from '@/lib/supabase/server';
import { portalAccess, tokenHash } from '@/lib/portal';
import { fields, type SectionKey } from '@/lib/packet-fields';
import { certificateStates, stages } from '@/lib/pipeline';
import type { ActionState } from '@/components/action-form';

const text=(f:FormData,k:string,max=2000)=>String(f.get(k)||'').trim().slice(0,max);
const uuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
function check(error:{message:string}|null) { if(error) throw new Error(error.message); }
function refresh(id:string) { for(const p of ['/','/intake','/cases','/family-care','/documents','/tasks','/services','/communications',`/cases/${id}`]) revalidatePath(p); }

export async function pipelineAction(_:ActionState,form:FormData):Promise<ActionState> {
 try {
  const client=await createClient();
  const {data:auth,error:authError}=await client.auth.getClaims();
  if(authError||!auth?.claims) return {error:'Please sign in again.'};
  const op=text(form,'op');
  if(op==='create') {
   const email=text(form,'email',254); if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
   const decedent=text(form,'name',200)||'Awaiting family packet';const mobile=text(form,'mobile',40);const nextOfKin=text(form,'next_of_kin_name',200);const emailUpdates=form.get('email_updates_enabled')==='on'&&!!email;
   const {data,error}=await client.rpc('create_pipeline_case',{decedent,contact_email:email,contact_mobile:mobile});check(error);
   check((await client.from('cases').update({metadata:{decedent_name:decedent,next_of_kin_name:nextOfKin,family_email:email,family_mobile:mobile,email_updates_enabled:emailUpdates,email_consent_recorded_at:emailUpdates?new Date().toISOString():null,email_consent_recorded_by:emailUpdates?auth.claims.sub:null}}).eq('id',data)).error);
   refresh(data);
   return {message:'Case and family packet created. Open it from the pipeline below.'};
  }
  const id=text(form,'case_id'); if(!uuid(id)) throw new Error('Choose a valid case.');
  const {data:c,error}=await client.from('cases').select('id,organization_id,family_id,metadata').eq('id',id).single();check(error);if(!c) throw new Error('Case unavailable.');
  const base={organization_id:c.organization_id,case_id:id};
  if(op==='contact') {
   const email=text(form,'email',254);if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid email address.');
   const enabled=form.get('email_updates_enabled')==='on';if(enabled&&!email)throw new Error('An email address is needed for email updates.');
   check((await client.from('cases').update({metadata:{...c.metadata,family_email:email,family_mobile:text(form,'mobile',40),email_updates_enabled:enabled,email_consent_recorded_at:enabled?new Date().toISOString():null,email_consent_recorded_by:auth.claims.sub},updated_at:new Date().toISOString()}).eq('id',id).select('id').single()).error);
  } else if(op==='stage') {
   const stage=text(form,'stage');if(!stages.includes(stage as typeof stages[number])) throw new Error('Invalid stage.');
   check((await client.from('cases').update({stage,status:stage==='complete'?'closed':stage==='aftercare'?'aftercare':stage==='service'?'in_service':stage==='intake'?'intake':'arrangement',closed_at:stage==='complete'?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq('id',id).select('id').single()).error);
  } else if(op==='invite') {
   if(!process.env.SUPABASE_SECRET_KEY&&!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Family portal connection is not configured yet.');
   const token=randomBytes(32).toString('base64url');
   const {error}=await client.from('portal_links').insert({...base,token_hash:tokenHash(token),expires_at:new Date(Date.now()+7*86400000).toISOString()});check(error);
   refresh(id);return {message:'Private link created for 7 days. No message has been sent.',link:`${process.env.NEXT_PUBLIC_APP_URL || 'https://marshall-os.vercel.app'}/family/${token}`};
  } else if(op==='send-intake') {
   if(!process.env.SUPABASE_SECRET_KEY&&!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Family portal connection is not configured yet.');
   const selected=['embalming','general','obituary','deathCertificate'].filter(section=>form.get(`document.${section}`)==='on');
   if(!selected.length)throw new Error('Choose at least one first-call document.');
   const token=randomBytes(32).toString('base64url');
   const link=`https://marshall-os.vercel.app/family/${token}`;
   const {data:job,error:queueError}=await client.rpc('queue_voice_intake',{target_case:id,sections:selected,link_hash:tokenHash(token),portal_url:link});check(queueError);
   refresh(id);
   revalidatePath('/settings/voice-bridge');
   return {message:`Google Voice delivery ${job} is in the queue. Codex will send it through the signed-in browser. The case stays in Intake until the outgoing message is verified.`};
  } else if(op==='graduate-intake') {
   const {data:voiceJobs,error:voiceError}=await client.from('voice_deliveries').select('id').eq('case_id',id).neq('status','cancelled').limit(1);check(voiceError);
   if(voiceJobs?.length)throw new Error('Use the Google Voice delivery queue to verify or resolve this send.');
   if(!c.metadata.intake_prepared_at)throw new Error('Prepare the first-call packet before marking it sent.');
   check((await client.from('communications').update({status:'sent',channel:'sms',sent_at:new Date().toISOString()}).eq('case_id',id).eq('subject','Your Marshall Family Care first-call packet').eq('status','draft')).error);
   check((await client.from('cases').update({stage:'arrangement',status:'arrangement',metadata:{...c.metadata,intake_sent_at:new Date().toISOString()},updated_at:new Date().toISOString()}).eq('id',id)).error);
   refresh(id);return {message:'Google Voice delivery recorded. The case is now in Cases at the Arrangement stage.'};
  } else if(op==='revoke') {
   check((await client.from('portal_links').update({revoked_at:new Date().toISOString()}).eq('case_id',id).is('revoked_at',null)).error);
  } else if(op==='arrangement') {
   const starts=text(form,'starts_at'); const time=new Date(starts);if(!starts||!Number.isFinite(time.getTime())) throw new Error('Select a valid appointment time.');
   const {data:existing,error:readError}=await client.from('services').select('id').eq('case_id',id).eq('kind','arrangement').maybeSingle();check(readError);
   const values={...base,kind:'arrangement',title:text(form,'title',200)||'Arrangement conference',starts_at:time.toISOString(),status:'scheduled',updated_at:new Date().toISOString()};
   check((await (existing?client.from('services').update(values).eq('id',existing.id):client.from('services').insert(values)).select('id').single()).error);
  } else if(op==='sheet') {
   const sheet:Record<string,string>={};for(const [k,v]of form.entries()) if(k.startsWith('sheet.')&&typeof v==='string') sheet[k.slice(6)]=v.slice(0,2000);
   check((await client.from('cases').update({metadata:{...c.metadata,arrangement_sheet:sheet},updated_at:new Date().toISOString()}).eq('id',id).select('id').single()).error);
   const taskRules:[string[],string][]=[[['casketName','casketColor'],'Order casket'],[['panel'],'Order panel'],[['overlay'],'Order overlay'],[['boxVault'],'Order vault or box'],[['limousine'],'Book limousine'],[['dvd'],'Design DVD'],[['keyrings'],'Design keyrings']];
   const needed=taskRules.filter(([keys])=>keys.some(key=>sheet[key]?.trim())).map(([,title])=>title);
   if(needed.length){const {data:existing,error}=await client.from('tasks').select('title').eq('case_id',id).in('title',needed);check(error);const titles=new Set((existing||[]).map(row=>row.title));const additions=needed.filter(title=>!titles.has(title)).map(title=>({...base,title,description:'Automatically added from the arrangement sheet.',family_visible:false}));if(additions.length)check((await client.from('tasks').insert(additions)).error);}
  } else if(op==='arrangement-photo') {
   await uploadDocument(client,id,c.organization_id,c.family_id,form,false,false,'arrangement_sheet_photo');
   const {data:photoTask,error:photoTaskError}=await client.from('tasks').select('id').eq('case_id',id).eq('title','Review arrangement sheet photo').maybeSingle();check(photoTaskError);
   if(!photoTask)check((await client.from('tasks').insert({...base,title:'Review arrangement sheet photo',description:'Confirm the photographed sheet details so merchandise and production tasks can be created.',family_visible:false})).error);
  } else if(op==='task') {
   const title=text(form,'title',200);if(!title)throw new Error('Enter a checklist item.');
   check((await client.from('tasks').insert({...base,title,family_visible:form.get('family_visible')==='on'})).error);
  } else if(op==='task-status') {
   const status=text(form,'status');if(!['open','done'].includes(status))throw new Error('Invalid checklist status.');
   check((await client.from('tasks').update({status,completed_at:status==='done'?new Date().toISOString():null}).eq('id',text(form,'record_id')).eq('case_id',id).select('id').single()).error);
  } else if(op==='review') {
   const status=text(form,'status');if(!['incomplete','submitted','needs-follow-up','approved'].includes(status))throw new Error('Invalid review status.');
   check((await client.from('documents').update({status,approved_by:status==='approved'?auth.claims.sub:null,approved_at:status==='approved'?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq('id',text(form,'record_id')).eq('case_id',id).select('id').single()).error);
  } else if(op==='certificate') {
   const status=text(form,'status');if(!certificateStates.includes(status as typeof certificateStates[number]))throw new Error('Invalid certificate status.');
   const quantity=Number(text(form,'quantity'));if(!Number.isInteger(quantity)||quantity<1||quantity>1000)throw new Error('Enter a quantity from 1 to 1,000.');
   const {data:d,error:e}=await client.from('documents').select('id').eq('case_id',id).eq('kind','death_certificate').maybeSingle();check(e);
   const value={...base,family_id:c.family_id,kind:'death_certificate',title:'Death certificates',status,metadata:{family_visible:true,quantity},updated_at:new Date().toISOString()};
   check((await (d?client.from('documents').update(value).eq('id',d.id):client.from('documents').insert(value)).select('id').single()).error);
  } else if(op==='request') {
   const title=text(form,'title',200);if(!title)throw new Error('Enter a document name.');
   check((await client.from('documents').insert({...base,family_id:c.family_id,title,kind:'requested_document',status:'requested',metadata:{family_visible:true}})).error);
  } else if(op==='sent') {
   const channel=text(form,'channel');if(!['email','sms','whatsapp','phone','in_person'].includes(channel))throw new Error('Choose how you delivered this update.');
   check((await client.from('communications').update({status:'sent',channel,sent_at:new Date().toISOString()}).eq('id',text(form,'record_id')).eq('case_id',id).eq('status','draft').select('id').single()).error);
  } else if(op==='upload') {
   await uploadDocument(client,id,c.organization_id,c.family_id,form,false);
  } else throw new Error('Unknown action.');
  refresh(id);
  after(async()=>{try{await processEmailQueue();}catch{console.error('Email queue processing needs review.');}});
  return {message:op==='sent'?'Delivery recorded.':op==='revoke'?'All family links revoked.':'Saved. Related records and activity are updated.'};
 } catch(error) { return {error:error instanceof Error?error.message:'Unable to save. Please try again.'}; }
}

async function uploadDocument(client:Awaited<ReturnType<typeof createClient>>,caseId:string,org:string,familyId:string|null,form:FormData,fromFamily:boolean,familyVisible=true,kind='attachment') {
 const file=form.get('file');if(!(file instanceof File)||!file.size)throw new Error('Choose a file.');
 const allowed=['application/pdf','image/jpeg','image/png','image/webp'];
 if(!allowed.includes(file.type)||file.size>5*1024*1024)throw new Error('Use PDF, JPG, PNG or WebP, up to 5 MB.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 const valid=file.type==='application/pdf'?new TextDecoder().decode(bytes.slice(0,5))==='%PDF-':file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
 if(!valid)throw new Error('The file contents do not match its format.');
 const ext=({ 'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp' } as Record<string,string>)[file.type];
 const path=`${org}/${caseId}/${randomUUID()}.${ext}`;
 check((await client.storage.from('marshall-documents').upload(path,bytes,{contentType:file.type})).error);
 const recordId=text(form,'record_id');
 const values={storage_path:path,status:fromFamily?'received':'shared',updated_at:new Date().toISOString()};
 let error;
 if(recordId) {
  let q=client.from('documents').update(values).eq('id',recordId).eq('case_id',caseId).eq('kind','requested_document').eq('status','requested');
  if(fromFamily)q=q.eq('metadata->>family_visible','true');
  error=(await q.select('id').single()).error;
 }else error=(await client.from('documents').insert({...values,organization_id:org,case_id:caseId,family_id:familyId,title:text(form,'title',200)||file.name.slice(0,200),kind,metadata:{family_visible:familyVisible,original_name:file.name.slice(0,200)}})).error;
 if(error){await client.storage.from('marshall-documents').remove([path]);check(error);}
}

export async function familyAction(_:ActionState,form:FormData):Promise<ActionState> {
 try {
  const token=text(form,'token',100);const {client,link}=await portalAccess(token);const op=text(form,'op');
  if(op==='section') {
   const section=text(form,'section') as SectionKey;if(!Object.hasOwn(fields,section))throw new Error('Invalid section.');
   const {data:d,error:e}=await client.from('documents').select('id,metadata,status').eq('case_id',link.case_id).eq('metadata->>section',section).eq('metadata->>family_visible','true').single();check(e);
   if(!d)throw new Error('Worksheet unavailable.');
   if(d.status==='approved')throw new Error('This section is approved. Contact Marshall staff to request a correction.');
   const existing=(d.metadata.responses||{})as Record<string,string>;
   const responses:Record<string,string>={...existing};
   for(const field of fields[section].flatMap(g=>g.fields).filter(f=>f.name!=='photo')) responses[field.name]=text(form,field.name,5000);
   const submit=form.get('intent')==='submit';
   if(submit)for(const field of fields[section].flatMap(g=>g.fields).filter(f=>!['signatureIntent','attestation'].includes(f.name)))if(field.required&&!responses[field.name])throw new Error(`Complete ${field.label}.`);
   check((await client.from('documents').update({metadata:{...d.metadata,responses},status:submit?'submitted':'incomplete',approved_by:null,approved_at:null,updated_at:new Date().toISOString()}).eq('id',d.id).eq('case_id',link.case_id).eq('metadata->>family_visible','true').neq('status','approved').select('id').single()).error);
   const {error:trackingError}=await client.rpc('record_portal_activity',{target_link:link.id,activity:submit?'form_submitted':'form_saved',section_name:section,record_id:d.id});
   if(trackingError)console.error('Family form activity tracking needs review.');
  } else if(op==='task') {
   check((await client.from('tasks').update({status:'done',completed_at:new Date().toISOString()}).eq('case_id',link.case_id).eq('id',text(form,'record_id')).eq('family_visible',true).select('id').single()).error);
  } else if(op==='upload') {
   const {data:c,error}=await client.from('cases').select('family_id').eq('id',link.case_id).single();check(error);
   await uploadDocument(client,link.case_id,link.organization_id,c?.family_id,form,true);
   const {error:trackingError}=await client.rpc('record_portal_activity',{target_link:link.id,activity:'file_uploaded'});
   if(trackingError)console.error('Family upload activity tracking needs review.');
  } else throw new Error('Unknown action.');
  refresh(link.case_id); revalidatePath(`/family/${token}`); return {message:'Saved. Marshall staff can now see your update.'};
 }catch(error){return {error:error instanceof Error?error.message:'Unable to save. Please try again.'};}
}
