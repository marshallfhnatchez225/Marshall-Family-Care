import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { modules } from "@/lib/modules";

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: slug } = await params;
  const item = modules.find((candidate) => candidate.slug === slug);
  if (!item || slug === "settings") notFound();
  const Icon = item.icon;
  return <AppShell active={slug}><div className="content modulepage">
    <div className="modulehero"><span className="iconbox"><Icon size={23}/></span><div><h1>{item.label}</h1><p>{item.description}</p></div></div>
    <section className="panel"><div className="empty"><div><Icon size={30}/><h2>{item.label} ready for connection</h2><p>This module is inside Marshall OS and shares the same organization, case, people, permissions, and event foundation. Connect its data source to replace this setup state with live records.</p><Link className="primary" href={`/settings?module=${slug}`}>Configure {item.label}</Link></div></div></section>
  </div></AppShell>;
}
