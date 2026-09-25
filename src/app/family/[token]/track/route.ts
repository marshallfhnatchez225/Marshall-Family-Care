import { portalAccess } from '@/lib/portal';
import { fields,type SectionKey } from '@/lib/packet-fields';

export async function POST(request:Request,{params}:{params:Promise<{token:string}>}) {
 try {
  const {token}=await params;
  const body=await request.json() as {section?:unknown};
  const section=typeof body.section==='string'&&Object.hasOwn(fields,body.section)?body.section as SectionKey:null;
  if(!section)return Response.json({error:'Invalid section.'},{status:400});
  const {client,link}=await portalAccess(token);
  const [portalEvent,formEvent]=await Promise.all([
   client.rpc('record_portal_activity',{target_link:link.id,activity:'portal_opened'}),
   client.rpc('record_portal_activity',{target_link:link.id,activity:'form_opened',section_name:section}),
  ]);
  if(portalEvent.error||formEvent.error)throw portalEvent.error||formEvent.error;
  return Response.json({ok:true});
 } catch {
  return Response.json({error:'Unable to record portal activity.'},{status:400});
 }
}
