import Link from "next/link";
import { CheckCircle2, CircleDashed, Database, GitBranch, Workflow } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { modules } from "@/lib/modules";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ module?: string }> }) {
  const { module: slug } = await searchParams;
  const selected = modules.find((item) => item.slug === slug && item.slug !== "settings");
  return <AppShell active="settings"><div className="content modulepage">
    <div className="modulehero"><span className="iconbox"><Database size={23}/></span><div><h1>Settings</h1><p>Organizations, roles, integrations, and workflow rules</p></div></div>
    {selected && <section className="setupnotice"><div><p className="eyebrow">Module setup</p><h2>Configure {selected.label}</h2><p>{selected.description}. This module will use the shared Marshall organization and permissions.</p></div><Link className="secondary" href={`/${selected.slug}`}>Back to {selected.label}</Link></section>}
    <section className="settingsgrid">
      <article className="panel settingcard"><span className="settingicon ready"><CheckCircle2 size={20}/></span><div><h2>Vercel</h2><p>Production application and deployment pipeline.</p><span className="badge green">Connected</span></div></article>
      <article className="panel settingcard"><span className="settingicon ready"><Database size={20}/></span><div><h2>Supabase</h2><p>PostgreSQL, authentication, files, and organization-scoped access.</p><span className="badge green"><CheckCircle2 size={12}/> Connected</span></div></article>
      <article className="panel settingcard"><span className="settingicon"><GitBranch size={20}/></span><div><h2>GitHub</h2><p>Source history and automatic preview deployments.</p><span className="badge"><CircleDashed size={12}/> Repository required</span></div></article>
      <article className="panel settingcard"><span className="settingicon"><Workflow size={20}/></span><div><h2>n8n workflows</h2><p>Routes approved events to Gmail, Calendar, WhatsApp, and Buffer.</p><span className="badge"><CircleDashed size={12}/> Connection required</span></div></article>
    </section>
    <section className="panel nextstep"><div><p className="eyebrow">System status</p><h2>Core platform configured</h2><p>Marshall OS and Supabase now share the Marshall organization, administrator role, secured records, and event foundation.</p></div><Link className="primary" href="/">Open command center</Link></section>
  </div></AppShell>;
}
