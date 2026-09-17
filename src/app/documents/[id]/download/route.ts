import {createClient} from '@/lib/supabase/server';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const client=await createClient();
 const {data,error}=await client.from('documents').select('storage_path,metadata').eq('id',id).maybeSingle();
 if(error||!data?.storage_path)return new Response('Document not available',{status:404});
 const bucket=data.metadata?.storage_bucket==='family-care-private'?'family-care-private':'marshall-documents';
 const signed=await client.storage.from(bucket).createSignedUrl(data.storage_path,60,{download:true});
 if(signed.error||!signed.data)return new Response('Download unavailable',{status:503});
 return new Response(null,{status:303,headers:{Location:signed.data.signedUrl,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}
