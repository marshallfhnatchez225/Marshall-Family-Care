import {createClient} from '@/lib/supabase/server';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const client=await createClient();
 const {data,error}=await client.from('services').select('id,title,starts_at').eq('case_id',id).eq('kind','arrangement').maybeSingle();
 if(error||!data?.starts_at)return new Response('No appointment scheduled',{status:404});
 const stamp=(date:string)=>new Date(date).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Marshall OS//Arrangement//EN','BEGIN:VEVENT',`UID:${data.id}@marshall-os`,`DTSTAMP:${stamp(new Date().toISOString())}`,`DTSTART:${stamp(data.starts_at)}`,`SUMMARY:${escape(data.title||'Arrangement conference')}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
 return new Response(body,{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'attachment; filename="arrangement.ics"','Cache-Control':'private, no-store'}});
}
