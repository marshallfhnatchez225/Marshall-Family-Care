import 'server-only';
import { createHash } from 'node:crypto';
import { createClient as supabaseClient } from '@supabase/supabase-js';

export function privateClient() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Family portal access is not configured. Please contact Marshall staff.');
  return supabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function tokenHash(token:string) { return createHash('sha256').update(token).digest('hex'); }
export async function portalAccess(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('This family link is invalid or has expired. Please request a new link.');
  const client=privateClient();
  const {data,error}=await client.from('portal_links').select('id,case_id,organization_id').eq('token_hash',tokenHash(token)).is('revoked_at',null).gt('expires_at',new Date().toISOString()).maybeSingle();
  if(error || !data) throw new Error('This family link is invalid or has expired. Please request a new link.');
  return {client,link:data};
}
