import {portalAccess} from '@/lib/portal';
export async function GET(_:Request,{params}:{params:Promise<{token:string;id:string}>}){
 try{const {token,id}=await params;const {client,link}=await portalAccess(token);
 const {data,error}=await client.from('documents').select('storage_path,metadata').eq('id',id).eq('case_id',link.case_id).eq('metadata->>family_visible','true').maybeSingle();
 if(error||!data?.storage_path)return new Response('Document unavailable',{status:404});
 const bucket=data.metadata?.storage_bucket==='family-care-private'?'family-care-private':'marshall-documents';
 const signed=await client.storage.from(bucket).createSignedUrl(data.storage_path,60,{download:true});
 if(signed.error||!signed.data)return new Response('Download unavailable',{status:503});
 return new Response(null,{status:303,headers:{Location:signed.data.signedUrl,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
 }catch{return new Response('Private link unavailable',{status:403});}
}
