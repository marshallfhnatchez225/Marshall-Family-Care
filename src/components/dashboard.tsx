import Link from "next/link";
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, FileCheck2, FolderKanban, ListChecks, Megaphone, Plus, Users } from "lucide-react";
import { AppShell } from "./app-shell";

const metrics = [
  { label: "Active cases", value: "12", detail: "4 services this week", icon: FolderKanban, tone: "wine" },
  { label: "Due today", value: "7", detail: "3 require attention", icon: ListChecks, tone: "amber" },
  { label: "Family packets", value: "5", detail: "2 awaiting review", icon: Users, tone: "blue" },
  { label: "Content drafts", value: "3", detail: "1 ready to approve", icon: Megaphone, tone: "green" },
];
const actions = [
  { icon: AlertCircle, title: "Three family updates are due", detail: "Oldest promised update is overdue", tag: "Urgent" },
  { icon: FileCheck2, title: "Two packets need staff review", detail: "Submitted by families this morning", tag: "Review" },
  { icon: Megaphone, title: "One obituary draft is ready", detail: "Human approval is required before publishing", tag: "Approve" },
];
const events = [
  ["CASE.OBITUARY_APPROVED", "Green family obituary", "Content workflow"],
  ["DEATH_CERTIFICATES.READY", "Williams family · 6 copies", "Family notification"],
  ["SERVICE.SCHEDULE_CHANGED", "Davis service · Sep 12", "Calendar sync"],
];

export function Dashboard() {
  return <AppShell><div className="content dashboard">
    <section className="intro"><div><p className="eyebrow">Command center · Tuesday, September 8</p><h1>Good afternoon, Jonte.</h1><p>Here’s what deserves your attention across Marshall today.</p></div><Link className="primary" href="/cases"><Plus size={17}/> Add new case</Link></section>
    <section className="metrics">{metrics.map(({ icon: Icon, ...metric }) => <article className="card metric" key={metric.label}><div className={`metricicon ${metric.tone}`}><Icon size={19}/></div><div><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></div></article>)}</section>
    <div className="grid"><section className="panel"><div className="panelhead"><div><p className="eyebrow">Action center</p><h2>Needs attention</h2></div><Link className="link" href="/tasks">View all <ArrowRight size={14}/></Link></div><div className="attention">{actions.map(({ icon: Icon, ...item }) => <article key={item.title}><span className="iconbox"><Icon size={18}/></span><div><h3>{item.title}</h3><p>{item.detail}</p></div><span className="badge">{item.tag}</span><ArrowRight className="rowarrow" size={16}/></article>)}</div></section>
    <aside className="panel briefing"><div className="briefingtop"><span className="briefingicon"><CalendarDays size={18}/></span><span className="badge inverse">Daily briefing</span></div><h2>Three things to know</h2><ul><li><span>01</span><p><b>Saturday staffing</b>One service still needs a second attendant.</p></li><li><span>02</span><p><b>Family care</b>Certificates are ready for the Williams family.</p></li><li><span>03</span><p><b>Content</b>The Green obituary is approved for review.</p></li></ul></aside></div>
    <section className="panel events"><div className="panelhead"><div><p className="eyebrow">Automation</p><h2>Recent workflow activity</h2></div><span className="badge green"><span className="livepulse"/> Event engine live</span></div>{events.map((event, index) => <div className="eventrow" key={event[0]}><span className="eventstatus"><CheckCircle2 size={17}/></span><b className="eventcode">{event[0]}</b><strong>{event[1]}</strong><span>{event[2]}</span><time>{index === 0 ? "Just now" : `${index * 8}m ago`}</time></div>)}</section>
  </div></AppShell>;
}
