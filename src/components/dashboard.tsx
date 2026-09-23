import Link from "next/link";
import { ArrowUpRight, FolderKanban, ListChecks, Users, Sparkles, Plus } from "lucide-react";
import { AppShell } from "./app-shell";
import { createClient } from "@/lib/supabase/server";
import { stages, label, dateLabel } from "@/lib/pipeline";
import { allowedModulesFromClaims } from "@/lib/access";

export async function Dashboard() {
 const client=await createClient(); const now=new Date();
 const {data:auth}=await client.auth.getClaims();
 const allowedModules=allowedModulesFromClaims((auth?.claims??{}) as Record<string,unknown>);
 const restricted=allowedModules!==null;
 const [cases,tasks,documents,messages,services,events]=await Promise.all([
  client.from("cases").select("id,stage").neq("status","closed"),
  client.from("tasks").select("id",{count:"exact",head:true}).not("status","in","(done,cancelled)"),
  client.from("documents").select("id",{count:"exact",head:true}).in("status",["submitted","received"]),
  client.from("communications").select("id",{count:"exact",head:true}).eq("status","draft"),
  client.from("services").select("id,case_id,title,starts_at,kind").gte("starts_at",now.toISOString()).neq("status","cancelled").order("starts_at").limit(5),
  client.from("events").select("id,name,payload,occurred_at").order("occurred_at",{ascending:false}).limit(6)
 ]);
 const failed=[cases,tasks,documents,messages,services,events].some(r=>r.error);
 const active=cases.data?.length||0;
 const pulse=[{label:"Active cases",value:active,icon:FolderKanban,tone:"wine"},{label:"Open tasks",value:tasks.count||0,icon:ListChecks,tone:"amber"},{label:"Awaiting review",value:documents.count||0,icon:Users,tone:"blue"}];
 return <AppShell><div className="content commandcenter">
 <section className="commandhero"><div><div className="herokicker"><span className="livepulse"/> Marshall command center</div><h1>Your day at Marshall.</h1><p>{new Intl.DateTimeFormat("en-US",{dateStyle:"full",timeZone:"America/Chicago"}).format(now)}</p></div><Link className="primary" href="/intake#new-case"><Plus size={17}/> New case</Link></section>
 {failed&&<p className="formerror">Some live information is unavailable. Refresh to try again.</p>}
 <section className="commandgrid">
 <article className="commandbrief"><div className="briefglow"/><div className="commandbriefhead"><span><Sparkles size={15}/> {restricted?'Staff briefing':'Executive briefing'}</span><small>Current case records</small></div><h2>{documents.count||0} documents need review.</h2><p className="brieflead">{tasks.count||0} checklist items remain open. {messages.count||0} family notification drafts are waiting for staff. {active} cases are moving through the funeral pipeline.</p><div className="briefactions"><Link href={restricted?'/cases':'/family-care'}>{restricted?'Open cases':'Open family care'} <ArrowUpRight size={14}/></Link></div></article>
 <article className="todaycard card"><div><p className="eyebrow">Next appointment or service</p><h3>{services.data?.[0]?.title||"Nothing scheduled yet"}</h3><p>{services.data?.[0]?dateLabel(services.data[0].starts_at):"Schedule arrangements from a case."}</p><Link className="link" href={services.data?.[0]?`/cases/${services.data[0].case_id}`:"/cases"}>Open case pipeline →</Link></div></article>
 <section className="pulsepanel panel"><div className="sectiontitle"><h2>Operations pulse</h2><Link className="link" href="/cases">View pipeline →</Link></div><div className="pulsecards">{pulse.map(({icon:Icon,...p})=><article key={p.label}><span className={`metricicon ${p.tone}`}><Icon size={18}/></span><div><small>{p.label}</small><strong>{p.value}</strong></div></article>)}</div><div className="caseflow">{stages.filter(s=>s!=="complete").map(stage=>{const count=cases.data?.filter(c=>c.stage===stage).length||0;return <div className="flowrow" key={stage}><span>{label(stage)}</span><div><i style={{width:`${active?100*count/active:0}%`}}/></div><b>{count}</b></div>;})}</div></section>
 <section className="activitypanel panel"><div className="sectiontitle"><h2>Across Marshall</h2></div><div className="activityfeed">{events.data?.map(e=><article key={e.id}><span className="feedmark info">•</span><div><h3>{label(e.name.toLowerCase().replaceAll("."," · "))}</h3><p>{dateLabel(e.occurred_at)}</p>{e.payload?.case_id&&<Link className="link" href={`/cases/${e.payload.case_id}`}>Open case</Link>}</div></article>)}{!events.data?.length&&<p>New case activity will appear here.</p>}</div></section>
 <section className="schedulepanel panel"><div className="sectiontitle"><h2>Coming up</h2>{!restricted&&<Link className="link" href="/services">All services</Link>}</div>{services.data?.map(s=><div className="workflow-row" key={s.id}><div><strong>{s.title||label(s.kind)}</strong><small>{dateLabel(s.starts_at)}</small></div><Link className="link" href={`/cases/${s.case_id}`}>Open case</Link></div>)}{!services.data?.length&&<p>No upcoming appointments or services.</p>}</section>
 <section className="carepanel panel"><p className="eyebrow">Family care</p><h2>Every family, clearly supported.</h2><p>Packets, arrangements, documents and certificates share one case timeline.</p><Link className="link" href={restricted?'/intake':'/family-care'}>{restricted?'Open Intake':'Open family care'} <ArrowUpRight size={14}/></Link></section>
 </section></div></AppShell>;
}
