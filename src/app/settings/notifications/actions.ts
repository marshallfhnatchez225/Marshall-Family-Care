'use server';
import {createClient} from '@/lib/supabase/server';
import {gmailReady} from '@/lib/gmail-delivery';
import {revalidatePath} from 'next/cache';
import type {ActionState} from '@/components/action-form';
export async function saveDeliverySettings(_:ActionState,form:FormData):Promise<ActionState>{
 const client=await createClient();const {data,error}=await client.auth.getClaims();
 if(error||!data?.claims)return {error:'Sign in to manage delivery.'};
 const org=data.claims.app_metadata?.organization_id;const enabled=form.get('enabled')==='on';
 if(enabled&&(!gmailReady()||process.env.MAIL_DELIVERY_ORGANIZATION_ID!==org||!process.env.CRON_SECRET))return {error:'Complete the Gmail connection and worker setup before enabling automatic email.'};
 const result=await client.from('delivery_settings').upsert({organization_id:org,email_enabled:enabled,updated_at:new Date().toISOString()});
 if(result.error)return {error:'Administrator permission is required to change delivery settings.'};
 revalidatePath('/settings/notifications');return {message:enabled?'Automatic email enabled for future updates to families who have opted in.':'Automatic email paused.'};
}
