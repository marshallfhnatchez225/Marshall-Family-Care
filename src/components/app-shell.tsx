import Link from "next/link";
import { Bell, ChevronDown, Search, ShieldCheck } from "lucide-react";
import { modules } from "@/lib/modules";
import { createClient } from "@/lib/supabase/server";
import { allowedModulesFromClaims } from "@/lib/access";

export async function AppShell({ active = "", children }: { active?: string; children: React.ReactNode }) {
  const client=await createClient();
  const {data}=await client.auth.getClaims();
  const claims=(data?.claims??{}) as Record<string,unknown>;
  const appMetadata=(claims.app_metadata??{}) as Record<string,unknown>;
  const userMetadata=(claims.user_metadata??{}) as Record<string,unknown>;
  const allowedModules=allowedModulesFromClaims(claims);
  const visibleModules=allowedModules?modules.filter(module=>allowedModules.includes(module.slug)):modules;
  const email=typeof claims.email==='string'?claims.email:'';
  const fullName=typeof userMetadata.full_name==='string'&&userMetadata.full_name.trim()?userMetadata.full_name.trim():(email.split('@')[0]||'Marshall staff');
  const initials=fullName.split(/\s+/).map(part=>part[0]).join('').slice(0,2).toUpperCase();
  const role=typeof appMetadata.role_name==='string'?appMetadata.role_name:appMetadata.role==='intake_staff'?'Intake Staff':'Administrator';
  return <div className="shell"><aside className="sidebar">
    <Link className="brand" href="/" aria-label="Marshall OS home"><span className="brandmark">M</span><span className="brandcopy"><strong>Marshall</strong><small>Operating System</small></span></Link>
    <div className="workspace"><span className="workspaceicon">MF</span><span><b>Marshall Funeral Home</b><small>Primary workspace</small></span><ChevronDown size={14}/></div>
    <p className="navlabel">Workspace</p>
    <nav className="nav" aria-label="Main navigation">{visibleModules.map(({ slug, label, icon: Icon }) => <Link key={label} href={slug ? `/${slug}` : "/"} className={active === slug ? "active" : ""}><Icon size={18}/><span>{label}</span>{active === slug ? <i/> : null}</Link>)}</nav>
    <div className="sidefoot"><ShieldCheck size={16}/><span><b>Secure workspace</b><small>Supabase connected</small></span></div>
  </aside><main className="main"><header className="topbar"><label className="search"><Search size={17}/><input aria-label="Search Marshall OS" placeholder="Search across Marshall OS"/><kbd>⌘ K</kbd></label><div className="topactions"><button className="iconbutton" aria-label="Notifications"><Bell size={18}/><span/></button><div className="profile"><span className="avatar">{initials}</span><span><b>{fullName}</b><small>{String(role)}</small></span><ChevronDown size={14}/></div></div></header>{children}</main></div>;
}
