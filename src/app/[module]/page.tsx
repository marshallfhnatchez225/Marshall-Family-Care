import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, CheckCircle2, ChevronDown, Database, Filter, LayoutGrid, List, MoreHorizontal, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { modules } from "@/lib/modules";
import { createClient } from "@/lib/supabase/server";

type Config = { table: string; columns: { key: string; label: string }[]; insight: string };
const configs: Record<string, Config> = {
  cases: { table: "cases", insight: "From first call through aftercare", columns: [{ key: "case_number", label: "Case" }, { key: "status", label: "Status" }, { key: "opened_at", label: "Opened" }] },
  families: { table: "families", insight: "Relationships, contacts, and care history", columns: [{ key: "name", label: "Family" }, { key: "care_status", label: "Care status" }, { key: "portal_enabled", label: "Portal" }] },
  services: { table: "services", insight: "Upcoming services and production readiness", columns: [{ key: "title", label: "Service" }, { key: "kind", label: "Type" }, { key: "starts_at", label: "Date" }, { key: "status", label: "Status" }] },
  tasks: { table: "tasks", insight: "Priorities and team accountability", columns: [{ key: "title", label: "Task" }, { key: "status", label: "Status" }, { key: "priority", label: "Priority" }, { key: "due_at", label: "Due" }] },
  "family-care": { table: "families", insight: "A calm, coordinated family experience", columns: [{ key: "name", label: "Family" }, { key: "care_status", label: "Care status" }, { key: "portal_enabled", label: "Portal" }, { key: "updated_at", label: "Updated" }] },
  documents: { table: "documents", insight: "Approvals, certificates, and case files", columns: [{ key: "title", label: "Document" }, { key: "kind", label: "Type" }, { key: "status", label: "Status" }, { key: "updated_at", label: "Updated" }] },
  communications: { table: "communications", insight: "Every family and partner conversation", columns: [{ key: "subject", label: "Subject" }, { key: "channel", label: "Channel" }, { key: "direction", label: "Direction" }, { key: "sent_at", label: "Sent" }] },
  content: { table: "content", insight: "Obituaries and social publishing", columns: [{ key: "title", label: "Content" }, { key: "channel", label: "Channel" }, { key: "status", label: "Status" }, { key: "scheduled_for", label: "Scheduled" }] },
  community: { table: "locations", insight: "Churches, cemeteries, pastors, and vendors", columns: [{ key: "name", label: "Organization" }, { key: "kind", label: "Type" }, { key: "updated_at", label: "Updated" }] },
  knowledge: { table: "knowledge", insight: "The way Marshall works, captured", columns: [{ key: "title", label: "Article" }, { key: "kind", label: "Type" }, { key: "status", label: "Status" }, { key: "updated_at", label: "Updated" }] },
};

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Enabled" : "Not enabled";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  return String(value).replaceAll("_", " ");
}

function PageHeader({ slug, label, description, Icon }: { slug: string; label: string; description: string; Icon: React.ComponentType<{size?:number}> }) {
  return <><header className="modulecommand"><div><div className="modulecrumb"><span>Marshall OS</span><b>/</b>{label}</div><div className="moduletitle"><span className="moduleglyph"><Icon size={21}/></span><div><h1>{label}</h1><p>{description}</p></div></div></div><Link className="moduleaction" href={`/settings?module=${slug}`}>Configure workflow <ArrowUpRight size={14}/></Link></header><div className="moduleviews"><span className="active"><LayoutGrid size={14}/> Overview</span><span><List size={14}/> All records</span><span><CheckCircle2 size={14}/> Activity</span></div></>;
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: slug } = await params;
  const item = modules.find((candidate) => candidate.slug === slug);
  if (!item || slug === "settings") notFound();
  const Icon = item.icon;
  const supabase = await createClient();

  if (slug === "analytics") {
    const names = ["cases", "families", "services", "tasks", "documents", "content"];
    const results = await Promise.all(names.map((name) => supabase.from(name).select("id", { count: "exact", head: true })));
    const max = Math.max(...results.map(r => r.count ?? 0), 1);
    return <AppShell active={slug}><div className="content modulemodern"><PageHeader slug={slug} label={item.label} description={item.description} Icon={Icon}/><section className="analyticshero"><div><p className="eyebrow">Operational intelligence</p><h2>Your organization at a glance</h2><p>Live volume across Marshall’s connected system of record.</p></div><span className="badge green"><span className="livepulse"/> Live data</span></section><section className="analyticsgrid">{names.map((name,index)=><article className="analyticscard" key={name}><div><span>{name}</span><Database size={15}/></div><strong>{results[index].count ?? 0}</strong><div className="sparkbar"><i style={{width:`${Math.max(((results[index].count??0)/max)*100,8)}%`}}/></div><small>Live records</small></article>)}</section></div></AppShell>;
  }

  const config = configs[slug];
  if (!config) notFound();
  const selected = [...new Set(['id', ...config.columns.map(column=>column.key), ...(['documents','tasks','services','communications'].includes(slug)?['case_id']:[])])].join(',');
  const { data, error } = await supabase.from(config.table).select(selected).limit(50);
  const rows = (data ?? []) as unknown as Record<string, unknown>[];

  return <AppShell active={slug}><div className="content modulemodern"><PageHeader slug={slug} label={item.label} description={config.insight} Icon={Icon}/><section className="moduleoverview"><article><small>Total records</small><strong>{rows.length}</strong><span>Live in Marshall OS</span></article><article><small>Workspace status</small><strong className="statustext"><span className="livepulse"/> Connected</strong><span>Organization secured</span></article><article className="moduleinsight"><small>Module focus</small><p>{item.description}</p></article></section><section className="recordsurface"><div className="recordtoolbar"><div><h2>{item.label}</h2><span>{rows.length} {rows.length === 1 ? "record" : "records"}</span></div><div className="tabletools"><label><Search size={14}/><input aria-label={`Search ${item.label}`} placeholder="Search records"/></label><button aria-label="Filter records"><Filter size={14}/> Filter</button><button aria-label="View options"><SlidersHorizontal size={14}/></button></div></div>{error ? <p className="formerror">{error.message}</p> : rows.length ? <div className="moderntable"><table><thead><tr><th className="checkcell"><span/></th>{config.columns.map(column=><th key={column.key}>{column.label}<ChevronDown size={11}/></th>)}<th/></tr></thead><tbody>{rows.map((row,index)=><tr key={String(row.id??index)}><td className="checkcell"><span/></td>{config.columns.map((column,columnIndex)=><td key={column.key}>{columnIndex===0?<div className="primarycell"><span>{String(display(row[column.key])).slice(0,2).toUpperCase()}</span><b>{display(row[column.key])}</b></div>:column.key.includes("status")?<span className="statuspill"><i/>{display(row[column.key])}</span>:display(row[column.key])}</td>)}<td>{row.case_id ? <Link className="link" href={`/cases/${row.case_id}`}>Open case <ArrowUpRight size={14}/></Link> : <MoreHorizontal size={16}/>}</td></tr>)}</tbody></table></div> : <div className="modernempty"><span className="emptyglow"><Icon size={27}/></span><p className="eyebrow">Ready for operations</p><h2>Your {item.label.toLowerCase()} workspace is connected.</h2><p>Add the first record when this module enters active use. It will share Marshall’s organization, permissions, and event engine.</p><Link href={`/settings?module=${slug}`}>Review module setup <ArrowUpRight size={14}/></Link></div>}</section></div></AppShell>;
}
