import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';
import { arrangementGroups } from '@/lib/arrangement-fields';
import { fields, labels, legacyFieldLabels, type SectionKey } from '@/lib/packet-fields';
import { caseName, dateLabel, label, type CaseRecord, type DocumentRecord, type ServiceRecord } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

const letter:[number,number]=[612,792];
const margin=32;
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

function fieldLabel(section:SectionKey,key:string) {
 if(section==='general'&&key==='funeralTime')return 'Funeral time';
 if(section==='general'&&key==='timeOfDeath')return 'Time of death';
 return fields[section].flatMap(group=>group.fields).find(field=>field.name===key)?.label
  || legacyFieldLabels[section]?.[key]
  || key.replace(/([a-z])([A-Z])/g,'$1 $2');
}

type PrintGroup={heading:string;entries:[string,string][]};
type PrintRow={kind:'heading'|'field';group:string;title:string;value:string};

export async function makePdf(c:CaseRecord,docs:DocumentRecord[],appointments:ServiceRecord[],scope:string) {
 const pdf=await PDFDocument.create();
 const regular=await pdf.embedFont(StandardFonts.Helvetica);
 const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const gutter=18;
 const columnWidth=(usableWidth-gutter)/2;
 const top=letter[1]-113;
 const bottom=47;

 function drawSheet(title:string,groups:PrintGroup[]) {
  const page=pdf.addPage(letter);
  page.drawText('MARSHALL FUNERAL HOME',{x:margin,y:letter[1]-36,size:8.5,font:bold,color:wine});
  page.drawText(safe(title),{x:margin,y:letter[1]-62,size:17,font:bold,color:wine});
  page.drawText(safe(`${caseName(c)}  |  Case ${c.case_number}`),{x:margin,y:letter[1]-80,size:9.5,font:regular,color:gray});
  page.drawLine({start:{x:margin,y:letter[1]-91},end:{x:letter[0]-margin,y:letter[1]-91},thickness:1,color:wine});

  const rows:PrintRow[]=groups.flatMap(group=>group.entries.length?[{kind:'heading' as const,group:group.heading,title:group.heading,value:''},...group.entries.map(([field,value])=>({kind:'field' as const,group:group.heading,title:field,value}))]:[]);
  if(!rows.length)rows.push({kind:'field',group:'',title:'Saved answers',value:'No answers saved yet.'});
  let chosen:{size:number;split:number;left:PrintRow[];right:PrintRow[];height:number}|undefined;
  for(const size of [9,8.5,8,7.5,7,6.5,6,5.5]) {
   let bestAtSize:typeof chosen;
   const labelSize=size*.82;
   const lineHeight=size*1.18;
   const rowHeight=(row:PrintRow)=>row.kind==='heading'?size*2.2:
    labelSize+4+linesFor(row.value||'Not provided',regular,size,columnWidth).length*lineHeight+5;
   const heights=rows.map(rowHeight);
   const prefix=[0];
   for(const height of heights)prefix.push(prefix[prefix.length-1]+height);
   const total=prefix[prefix.length-1];
   for(let split=1;split<=rows.length;split++){
    if(rows[split-1]?.kind==='heading')continue;
    const repeated=split<rows.length&&rows[split]?.kind==='field'&&rows[split-1]?.group===rows[split]?.group?
     [{kind:'heading' as const,group:rows[split].group,title:rows[split].group,value:''}]:[];
    const left=rows.slice(0,split);
    const right=[...repeated,...rows.slice(split)];
    const height=Math.max(prefix[split],total-prefix[split]+repeated.reduce((sum,row)=>sum+rowHeight(row),0));
    if(!bestAtSize||height<bestAtSize.height)bestAtSize={size,split,left,right,height};
   }
   chosen=bestAtSize;
   if(chosen&&chosen.height<=top-bottom)break;
  }
  if(!chosen)throw new Error('Unable to lay out the print form');
  const {size}=chosen;
  for(const [column,items] of [chosen.left,chosen.right].entries()){
   const x=margin+column*(columnWidth+gutter);
   let y=top;
   for(const row of items){
    if(row.kind==='heading'){
     page.drawText(safe(row.title),{x,y,size:size*1.04,font:bold,color:wine});
     y-=size*2.2;
     continue;
    }
    page.drawText(safe(row.title),{x,y,size:size*.82,font:bold,color:gray});
    y-=size*.82+4;
    for(const line of linesFor(row.value||'Not provided',regular,size,columnWidth)){
     page.drawText(line,{x,y,size,font:regular});
     y-=size*1.18;
    }
    page.drawLine({start:{x,y:y+1.5},end:{x:x+columnWidth,y:y+1.5},thickness:.35,color:pale});
    y-=5;
   }
  }
 }

 if(scope==='arrangement') {
  const groups:PrintGroup[]=[{heading:'Arrangement conference',entries:appointments.length?
   appointments.map(appointment=>[appointment.title||'Appointment',`${dateLabel(appointment.starts_at)}  |  ${label(appointment.status)}`] as [string,string]):
   [['Appointment','No arrangement appointment saved yet.'] as [string,string]]}];
  const sheet=(c.metadata.arrangement_sheet||{}) as Record<string,string>;
  const familyAnswers=(source:string|undefined)=>{
   const [sectionName,key]=source?.split('.')||[];
   return docs.find(doc=>doc.metadata.section===sectionName)?.metadata.responses?.[key];
  };
  for(const group of arrangementGroups){
   const entries=group.fields.map(field=>[field.label,String(sheet[field.name]??familyAnswers(field.auto)??'').trim()] as [string,string]).filter(([,value])=>value);
   if(!entries.length)continue;
   groups.push({heading:group.heading,entries});
  }
  drawSheet('Arrangement details',groups);
 } else {
  const selected=scope==='family'?docs.filter(doc=>Object.values(doc.metadata.responses||{}).some(Boolean)):docs.filter(doc=>doc.metadata.section===scope);
  if(!selected.length)drawSheet('Family documents',[{heading:'Saved answers',entries:[['Status','No family answers have been saved yet.']]}]);
  for(const doc of selected){
   const sectionKey=doc.metadata.section as SectionKey;
   if(!sections.includes(sectionKey))continue;
   const entries=Object.entries(doc.metadata.responses||{}).filter(([key,value])=>Boolean(value)&&!key.toLowerCase().includes('signaturedata'));
   const order=fields[sectionKey].flatMap(group=>group.fields).map(field=>field.name);
   entries.sort(([a],[b])=>(order.indexOf(a)<0?Number.MAX_SAFE_INTEGER:order.indexOf(a))-(order.indexOf(b)<0?Number.MAX_SAFE_INTEGER:order.indexOf(b)));
   const used=new Set<string>();
   const groups:PrintGroup[]=[{heading:'Review',entries:[['Status',label(doc.status)]]}];
   for(const group of fields[sectionKey]){
    const groupEntries=entries.filter(([key])=>group.fields.some(field=>field.name===key));
    if(groupEntries.length){groups.push({heading:group.title,entries:groupEntries.map(([key,value])=>[fieldLabel(sectionKey,key),value])});groupEntries.forEach(([key])=>used.add(key));}
   }
   const remaining=entries.filter(([key])=>!used.has(key));
   if(remaining.length)groups.push({heading:'Additional information',entries:remaining.map(([key,value])=>[fieldLabel(sectionKey,key),value])});
   drawSheet(labels[sectionKey],groups);
  }
 }

 const pages=pdf.getPages();
 for(let index=0;index<pages.length;index++){
  const footer=`Marshall OS  |  ${index+1} of ${pages.length}`;
  pages[index].drawText(footer,{x:margin,y:25,size:8,font:regular,color:gray});
 }
 return pdf.save();
}

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return new Response('Invalid case',{status:400});
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
