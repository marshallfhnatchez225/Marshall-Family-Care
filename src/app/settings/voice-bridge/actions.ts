'use server';
import {revalidatePath} from 'next/cache';
import {createClient} from '@/lib/supabase/server';
export type VoiceState={error?:string;job?:{id:string;recipient:string;body:string;status:string;claim_token?:string;lease_until?:string;evidence?:string}};
export async function voiceAction(previous:VoiceState,form:FormData):Promise<VoiceState>{
 const client=await createClient();
 const {data:auth,error:authError}=await client.auth.getClaims();
 if(authError||!auth?.claims)return {error:'Please sign in again.'};
 const {data,error}=await client.rpc('voice_job_action',{job_id:String(form.get('job_id')||''),command:String(form.get('command')||''),lease_token:String(form.get('lease_token')||'')||null,note:String(form.get('note')||'').slice(0,2000)});
 if(error)return {...previous,error:error.message};
 for(const path of ['/intake','/cases','/communications','/settings/voice-bridge','/'])revalidatePath(path);
 revalidatePath(`/cases/${data.case_id}`);
 return {job:{id:data.id,recipient:data.recipient,body:data.body,status:data.status,claim_token:data.claim_token,lease_until:data.lease_until,evidence:data.evidence}};
}
