import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { modules } from "@/lib/modules";
import { createClient } from "@/lib/supabase/server";

type Config = { table: string; columns: { key: string; label: string }[]; filter?: [string, string] };
const configs: Record<string, Config> = {
  cases: { table: "cases", columns: [{ key: "case_number", label: "Case" }, { key: "status", label: "Status" }, { key: "opened_at", label: "Opened" }] },
  families: { table: "families", columns: [{ key: "name", label: "Family" }, { key: "care_status", label: "Care status" }, { key: "portal_enabled", label: "Portal" }] },
  services: { table: "services", columns: [{ key: "title", label: "Service" }, { key: "kind", label: "Type" }, { key: "starts_at", label: "Date" }, { key: "status", label: "Status" }] },
  tasks: { table: "tasks", columns: [{ key: "title", label: "Task" }, { key: "status", label: "Status" }, { key: "priority", label: "Priority" }, { key: "due_at", label: "Due" }] },
  "family-care": { table: "families", columns: [{ key: "name", label: "Family" }, { key: "care_status", label: "Care status" }, { key: "portal_enabled", label: "Portal" }, { key: "updated_at", label: "Updated" }] },
  documents: { table: "documents", columns: [{ key: "title", label: "Document" }, { key: "kind", label: "Type" }, { key: "status", label: "Status" }, { key: "updated_at", label: "Updated" }] },
  communications: { table: "communications", columns: [{ key: "subject", label: "Subject" }, { key: "channel", label: "Channel" }, { key: "direction", label: "Direction" }, { key: "sent_at", label: "Sent" }] },
  content: { table: "content", columns: [{ key: "title", label: "Content" }, { key: "channel", label: "Channel" }, { key: "status", label: "Status" }, { key: "scheduled_for", label: "Scheduled" }] },
  community: { table: "locations", columns: [{ key: "name", label: "Organization" }, { key: "kind", label: "Type" }, { key: "updated_at", label: "Updated" }] },
  knowledge: { table: "knowledge", columns: [{ key: "title", label: "Article" }, { key: "kind", label: "Type" }, { key: "status", label: "Status" }, { key: "updated_at", label: "Updated" }] },
};

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Enabled" : "Not enabled";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  return String(value).replaceAll("_", " ");
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
    return <AppShell active={slug}><div className="content modulepage"><div className="modulehero"><span className="iconbox"><Icon size={23}/></span><div><h1>{item.label}</h1><p>{item.description}</p></div></div><section className="metrics">{names.map((name, index) => <article className="card metric" key={name}><span>{name}</span><strong>{results[index].count ?? 0}</strong><small>Live Supabase records</small></article>)}</section></div></AppShell>;
  }

  const config = configs[slug];
  if (!config) notFound();
  let query = supabase.from(config.table).select("*").limit(50);
  if (config.filter) query = query.eq(config.filter[0], config.filter[1]);
  const { data, error } = await query;
  const rows = (data ?? []) as Record<string, unknown>[];

  return <AppShell active={slug}><div className="content modulepage"><div className="modulehero"><span className="iconbox"><Icon size={23}/></span><div><h1>{item.label}</h1><p>{item.description}</p></div></div><section className="panel records"><div className="panelhead"><div><p className="eyebrow">Live workspace</p><h2>{rows.length} {rows.length === 1 ? "record" : "records"}</h2></div><span className="badge green">Supabase connected</span></div>{error ? <p className="formerror">{error.message}</p> : rows.length ? <div className="tablewrap"><table><thead><tr>{config.columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)}>{config.columns.map((column) => <td key={column.key}>{display(row[column.key])}</td>)}</tr>)}</tbody></table></div> : <div className="empty"><div><Icon size={30}/><h2>No {item.label.toLowerCase()} records yet</h2><p>This section is connected to the live Marshall database and ready for its first operational record.</p></div></div>}</section></div></AppShell>;
}
