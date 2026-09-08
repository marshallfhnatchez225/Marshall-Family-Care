import Link from "next/link";
import { ArrowUpRight, CalendarDays, Check, ChevronRight, Circle, Clock3, FileCheck2, FolderKanban, HeartHandshake, ListChecks, Megaphone, Plus, Sparkles, Users } from "lucide-react";
import { AppShell } from "./app-shell";

const pulse = [
  { label: "Active cases", value: "12", delta: "+2 this week", icon: FolderKanban, tone: "wine" },
  { label: "Due today", value: "7", delta: "3 high priority", icon: ListChecks, tone: "amber" },
  { label: "Family approvals", value: "5", delta: "2 new today", icon: Users, tone: "blue" },
];
const activity = [
  { title: "Obituary approved", detail: "Green family · Content workflow started", time: "Now", tone: "done" },
  { title: "Certificates ready", detail: "Williams family · Six certified copies", time: "8m", tone: "ready" },
  { title: "Service schedule updated", detail: "Davis service · Calendar synchronized", time: "16m", tone: "info" },
  { title: "Family portal opened", detail: "Thompson family · Primary contact joined", time: "1h", tone: "info" },
];
const flow = [
  { label: "First call", value: 2, width: "28%" }, { label: "Arrangements", value: 4, width: "54%" },
  { label: "Service ready", value: 3, width: "42%" }, { label: "Aftercare", value: 3, width: "42%" },
];

export function Dashboard() {
  return <AppShell><div className="content commandcenter">
    <section className="commandhero"><div><div className="herokicker"><span className="livepulse"/> Live command center</div><h1>Good afternoon, Jonte.</h1><p>Tuesday, September 8 · Marshall Funeral Home</p></div><div className="heroactions"><button className="quietbutton"><Sparkles size={16}/> Ask Marshall OS</button><Link className="primary" href="/cases"><Plus size={17}/> New case</Link></div></section>
    <section className="commandgrid">
      <article className="commandbrief"><div className="briefglow"/><div className="commandbriefhead"><span><Sparkles size={15}/> Executive briefing</span><small>Updated just now</small></div><h2>Three things need your attention.</h2><p className="brieflead">Saturday’s service needs another attendant, two family packets await review, and an approved obituary is ready for publishing.</p><div className="briefactions"><Link href="/tasks">Review priorities <ArrowUpRight size={14}/></Link><span>Generated from live operations</span></div></article>
      <article className="todaycard card"><div className="todaydate"><small>SEP</small><strong>08</strong></div><div><p className="eyebrow">Today</p><h3>2 services · 4 family updates</h3><p>Your next scheduled service begins at 11:00 AM.</p></div><Link href="/services" aria-label="Open services"><ChevronRight size={18}/></Link></article>
      <section className="pulsepanel panel"><div className="sectiontitle"><div><p className="eyebrow">Operations pulse</p><h2>What’s moving today</h2></div><Link className="link" href="/analytics">Full analytics <ArrowUpRight size={13}/></Link></div><div className="pulsecards">{pulse.map(({icon:Icon,...item})=><article key={item.label}><span className={`metricicon ${item.tone}`}><Icon size={18}/></span><div><small>{item.label}</small><strong>{item.value}</strong><p>{item.delta}</p></div></article>)}</div><div className="caseflow"><div className="flowhead"><span>Case flow</span><small>12 active cases</small></div>{flow.map(item=><div className="flowrow" key={item.label}><span>{item.label}</span><div><i style={{width:item.width}}/></div><b>{item.value}</b></div>)}</div></section>
      <section className="activitypanel panel"><div className="sectiontitle"><div><p className="eyebrow">Live activity</p><h2>Across Marshall</h2></div><span className="activitylive"><i/> Live</span></div><div className="activityfeed">{activity.map((item,index)=><article key={item.title}><span className={`feedmark ${item.tone}`}>{item.tone==="done"?<Check size={12}/>:<Circle size={8}/>}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div><time>{item.time}</time>{index<activity.length-1?<i className="feedline"/>:null}</article>)}</div><Link className="feedlink" href="/communications">Open complete activity <ChevronRight size={14}/></Link></section>
      <section className="schedulepanel panel"><div className="sectiontitle"><div><p className="eyebrow">Service schedule</p><h2>Coming up</h2></div><Link className="link" href="/services">View calendar</Link></div><div className="serviceagenda"><article><time><b>11:00</b><small>AM</small></time><span className="agendabar wine"/><div><h3>Green Family Service</h3><p><CalendarDays size={12}/> Marshall Chapel · 90 min</p></div><span className="badge green">Ready</span></article><article><time><b>2:30</b><small>PM</small></time><span className="agendabar amber"/><div><h3>Davis Family Visitation</h3><p><Clock3 size={12}/> Main visitation room · 2 hrs</p></div><span className="badge">Staffing</span></article></div></section>
      <section className="carepanel panel"><div className="careicon"><HeartHandshake size={20}/></div><p className="eyebrow">Family care</p><h2>Every family, clearly supported.</h2><p>Two updates are due and five document packets are moving through review.</p><div className="carestats"><span><FileCheck2 size={14}/><b>5</b> packets</span><span><Megaphone size={14}/><b>3</b> updates</span></div><Link href="/family-care">Open family care <ArrowUpRight size={14}/></Link></section>
    </section>
  </div></AppShell>;
}
