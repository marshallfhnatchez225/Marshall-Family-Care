import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';
import { arrangementGroups } from '@/lib/arrangement-fields';
import { fields, labels, legacyFieldLabels, type SectionKey } from '@/lib/packet-fields';
import { caseName, dateLabel, label, type CaseRecord, type DocumentRecord, type ServiceRecord } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

const letter:[number,number]=[612,792];
const margin=46;
const usableWidth=letter[0]-2*margin;
const wine=rgb(.46,.11,.22);
const gray=rgb(.38,.36,.37);
const pale=rgb(.85,.82,.83);
const sections=Object.keys(labels) as SectionKey[];

function safe(value:unknown) {
 return String(value??'').replaceAll('’',"'").replaceAll('‘',"'").replaceAll('“','"').replaceAll('”','"').replace(/[–—]/g,'-').replaceAll('•','-').replace(/[^\x20-\x7E\n\xA0-\xFF]/g,'?');
}

function linesFor(value:string,font:PDFFont,size:number,width:number) {
 const lines:string[]=[];
 for(const paragraph of safe(value).split('\n')) {
  let line='';
  for(const word of paragraph.split(/\s+/)) {
   if(!word)continue;
   const candidate=line?`${line} ${word}`:word;
   if(font.widthOfTextAtSize(candidate,size)<=width){line=candidate;continue;}
   if(line){lines.push(line);line='';}
   let remaining=word;
   while(remaining&&font.widthOfTextAtSize(remaining,size)>width){
    let end=1;
    while(end<remaining.length&&font.widthOfTextAtSize(remaining.slice(0,end+1),size)<=width)end++;
    lines.push(remaining.slice(0,end));
    remaining=remaining.slice(end);
   }
   line=remaining;
  }
  lines.push(line);
 }
 return lines;
}

async function makePdf(c:CaseRecord,docs:DocumentRecord[],appointments:ServiceRecord[],scope:string) {
 const pdf=await PDFDocument.create();
 const regular=await pdf.embedFont(StandardFonts.Helvetica);
 const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 let page:PDFPage;
 let y=0;
 let currentTitle='';

 function beginPage(title:string) {
  currentTitle=title;
  page=pdf.addPage(letter);
  y=letter[1]-margin;
  page.drawText('MARSHALL FUNERAL HOME',{x:margin,y,size:9,font:bold,color:wine});
  y-=28;
  page.drawText(safe(title),{x:margin,y,size:19,font:bold,color:wine});
  y-=22;
  page.drawText(safe(`${caseName(c)}  |  Case ${c.case_number}`),{x:margin,y,size:11,font:regular});
  y-=10;
  page.drawLine({start:{x:margin,y},end:{x:letter[0]-margin,y},thickness:1,color:wine});
  y-=27;
 }

 function section(title:string) {
  if(y<95)beginPage(`${currentTitle} (continued)`);
  page.drawText(safe(title),{x:margin,y,size:12,font:bold,color:wine});
  y-=19;
 }

 function pair(title:string,value:string) {
  const textLines=linesFor(value||'Not provided',regular,10.5,usableWidth);
  const height=15+textLines.length*14+10;
  if(y-height<58)beginPage(`${currentTitle} (continued)`);
  page.drawText(safe(title),{x:margin,y,size:9,font:bold,color:gray});
  y-=15;
  for(const textLine of textLines){page.drawText(textLine,{x:margin,y,size:10.5,font:regular});y-=14;}
  page.drawLine({start:{x:margin,y:y+4},end:{x:letter[0]-margin,y:y+4},thickness:.5,color:pale});
  y-=10;
 }

 if(scope==='arrangement') {
  beginPage('Arrangement details');
  section('Arrangement conference');
  if(appointments.length)for(const appointment of appointments)pair(appointment.title||'Appointment',`${dateLabel(appointment.starts_at)}  |  ${label(appointment.status)}`);
  else pair('Appointment','No arrangement appointment saved yet.');
  const sheet=(c.metadata.arrangement_sheet||{}) as Record<string,string>;
  const familyAnswers=(source:string|undefined)=>{
   const [sectionName,key]=source?.split('.')||[];
   return docs.find(doc=>doc.metadata.section===sectionName)?.metadata.responses?.[key];
  };
  for(const group of arrangementGroups){
   const entries=group.fields.map(field=>[field.label,String(sheet[field.name]??familyAnswers(field.auto)??'').trim()] as [string,string]).filter(([,value])=>value);
   if(!entries.length)continue;
   section(group.heading);
   for(const [title,value] of entries)pair(title,value);
  }
 } else {
  const selected=scope==='family'?docs.filter(doc=>Object.values(doc.metadata.responses||{}).some(Boolean)):docs.filter(doc=>doc.metadata.section===scope);
  if(!selected.length){beginPage('Family documents');pair('Saved answers','No family answers have been saved yet.');}
  for(const doc of selected){
   const sectionKey=doc.metadata.section as SectionKey;
   if(!sections.includes(sectionKey))continue;
   beginPage(labels[sectionKey]);
   pair('Review status',label(doc.status));
   const entries=Object.entries(doc.metadata.responses||{}).filter(([key,value])=>Boolean(value)&&!key.toLowerCase().includes('signaturedata'));
   if(!entries.length){pair('Saved answers','No answers saved yet.');continue;}
   for(const [key,value] of entries){
    const title=fields[sectionKey].flatMap(group=>group.fields).find(field=>field.name===key)?.label||legacyFieldLabels[sectionKey]?.[key]||key.replace(/([a-z])([A-Z])/g,'$1 $2');
    pair(title,value);
   }
  }
 }

 const pages=pdf.getPages();
 for(let index=0;index<pages.length;index++){
  const footer=`Marshall OS  |  ${index+1} of ${pages.length}`;
  pages[index].drawText(footer,{x:margin,y:28,size:8,font:regular,color:gray});
 }
 return pdf.save();
}

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return new Response('Invalid case',{status:400});
 const scope=new URL(request.url).searchParams.get('scope')||'family';
 if(scope!=='arrangement'&&scope!=='family'&&!sections.includes(scope as SectionKey))return new Response('Invalid print selection',{status:400});
 const client=await createClient();
 const [caseResult,docsResult,servicesResult]=await Promise.all([
  client.from('cases').select('id,organization_id,family_id,case_number,stage,status,updated_at,metadata').eq('id',id).maybeSingle(),
  client.from('documents').select('id,case_id,title,kind,status,storage_path,metadata,updated_at').eq('case_id',id).not('metadata->>section','is',null).order('created_at').limit(100),
  client.from('services').select('id,title,starts_at,status').eq('case_id',id).eq('kind','arrangement'),
 ]);
 if(caseResult.error||docsResult.error||servicesResult.error)return new Response('Unable to load case',{status:503});
 if(!caseResult.data)return new Response('Case not found',{status:404});
 const c=caseResult.data as CaseRecord;
 const bytes=await makePdf(c,(docsResult.data||[]) as DocumentRecord[],(servicesResult.data||[]) as ServiceRecord[],scope);
 const filename=`marshall-${c.case_number.toLowerCase().replace(/[^a-z0-9-]/g,'')}-${scope}.pdf`;
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
