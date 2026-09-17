import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
const [caseId,token]=process.argv.slice(2);
if(!caseId||!token)throw new Error('Provide the temporary test case ID and token.');
const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const {data:c,error}=await client.from('cases').select('organization_id,family_id,metadata').eq('id',caseId).single();
if(error||c?.metadata.decedent_name!=='WORKFLOW TEST - REMOVE')throw new Error('Only the dedicated temporary test case is allowed.');
const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1cAAAAASUVORK5CYII=','base64');
const path=`${c.organization_id}/${caseId}/${randomUUID()}.png`;
let docId;
try{
 const upload=await client.storage.from('marshall-documents').upload(path,bytes,{contentType:'image/png'});
 if(upload.error)throw upload.error;
 const insert=await client.from('documents').insert({organization_id:c.organization_id,case_id:caseId,family_id:c.family_id,title:'Temporary file verification',kind:'attachment',status:'received',storage_path:path,metadata:{family_visible:true}}).select('id').single();
 if(insert.error)throw insert.error;docId=insert.data.id;
 const download=await fetch(`https://marshall-os.vercel.app/family/${token}/documents/${docId}`);
 if(!download.ok||!Buffer.from(await download.arrayBuffer()).equals(bytes))throw new Error('Private download did not match upload.');
 const hidden=await client.from('documents').update({metadata:{family_visible:false}}).eq('id',docId);if(hidden.error)throw hidden.error;
 const forbidden=await fetch(`https://marshall-os.vercel.app/family/${token}/documents/${docId}`,{redirect:'manual'});
 if(forbidden.status!==404)throw new Error('Staff-only file was accessible to family.');
 const anonymous=await fetch(`https://marshall-os.vercel.app/documents/${docId}/download`,{redirect:'manual'});
 if(![303,307].includes(anonymous.status)||!anonymous.headers.get('location')?.includes('/login'))throw new Error('Staff download did not require sign-in.');
 console.log('PASS: private upload/download bytes, family visibility, unauthenticated staff download protection.');
}finally{
 const removal=await client.storage.from('marshall-documents').remove([path]);if(removal.error)throw removal.error;
 if(docId){const deletion=await client.from('documents').delete().eq('id',docId).eq('case_id',caseId);if(deletion.error)throw deletion.error;}
}
