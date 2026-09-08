import Link from "next/link";
import { Bell, ChevronDown, Search, ShieldCheck } from "lucide-react";
import { modules } from "@/lib/modules";

export function AppShell({ active = "", children }: { active?: string; children: React.ReactNode }) {
  return <div className="shell"><aside className="sidebar">
    <Link className="brand" href="/" aria-label="Marshall OS home"><span className="brandmark">M</span><span className="brandcopy"><strong>Marshall</strong><small>Operating System</small></span></Link>
    <div className="workspace"><span className="workspaceicon">MF</span><span><b>Marshall Funeral Home</b><small>Primary workspace</small></span><ChevronDown size={14}/></div>
    <p className="navlabel">Workspace</p>
    <nav className="nav" aria-label="Main navigation">{modules.map(({ slug, label, icon: Icon }) => <Link key={label} href={slug ? `/${slug}` : "/"} className={active === slug ? "active" : ""}><Icon size={18}/><span>{label}</span>{active === slug ? <i/> : null}</Link>)}</nav>
    <div className="sidefoot"><ShieldCheck size={16}/><span><b>Secure workspace</b><small>Supabase connected</small></span></div>
  </aside><main className="main"><header className="topbar"><label className="search"><Search size={17}/><input aria-label="Search Marshall OS" placeholder="Search across Marshall OS"/><kbd>⌘ K</kbd></label><div className="topactions"><button className="iconbutton" aria-label="Notifications"><Bell size={18}/><span/></button><div className="profile"><span className="avatar">JM</span><span><b>Jonte Marshall</b><small>Administrator</small></span><ChevronDown size={14}/></div></div></header>{children}</main></div>;
}
