import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, CircleDashed, Database, GitBranch, KeyRound, Settings2, ShieldCheck, Users, Workflow } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { modules } from "@/lib/modules";

const integrations=[
  {name:"Vercel",detail:"Production application and deployment pipeline",icon:CheckCircle2,ready:true},
  {name:"Supabase",detail:"Database, authentication, files, and secured records",icon:Database,ready:true},
  {name:"GitHub",detail:"Source history and repository access",icon:GitBranch,ready:true},
  {name:"n8n workflows",detail:"Gmail, Calendar, WhatsApp, and Buffer automations",icon:Workflow,ready:false},
];

export default async function SettingsPage({searchParams}:{searchParams:Promise<{module?:string}>}){
  const{module:slug}=await searchParams;
  const selected=modules.find(item=>item.slug===slug&&item.slug!=="settings");
  const SelectedIcon=selected?.icon;
  return <AppShell active="settings"><div className="content modulemodern settingsmodern">
    <header className="modulecommand">
      <div><div className="modulecrumb"><span>Marshall OS</span><b>/</b>System</div>
      <div className="moduletitle"><span className="moduleglyph"><Settings2 size={21}/></span><div><h1>Settings</h1><p>Control your organization, team, security, and connected systems.</p></div></div></div>
      <span className="systemhealth"><i/> Core systems operational</span>
    </header>
    <div className="moduleviews"><span className="active"><Settings2 size={14}/> General</span><span><Users size={14}/> Team & roles</span><span><Workflow size={14}/> Integrations</span><span><ShieldCheck size={14}/> Security</span></div>
    {selected&&SelectedIcon?<section className="settingscallout"><div className="callouticon"><SelectedIcon size={21}/></div><div><p className="eyebrow">Module configuration</p><h2>{selected.label}</h2><p>{selected.description}. This workspace inherits Marshall’s roles, security, and event rules.</p></div><Link href={`/${selected.slug}`}>Return to module <ArrowRight size={14}/></Link></section>:null}
    <section className="settingscallout"><div><h2>Email & Google Voice</h2><p>Configure automatic email, keep Google Voice for staff-sent texts, and review delivery status.</p></div><Link href="/settings/notifications">Manage delivery <ArrowRight size={14}/></Link></section>
    <section className="settingssummary">
      <article><span><ShieldCheck size={18}/></span><div><small>Security</small><b>Organization scoped</b><p>Role-based access is active</p></div></article>
      <article><span><KeyRound size={18}/></span><div><small>Authentication</small><b>Supabase Auth</b><p>Secure sessions enabled</p></div></article>
      <article><span><Workflow size={18}/></span><div><small>Event engine</small><b>Foundation ready</b><p>Workflow routing prepared</p></div></article>
    </section>
    <section className="integrationsurface"><div className="sectiontitle"><div><p className="eyebrow">Connected systems</p><h2>Integration health</h2></div><span className="integrationscount">3 of 4 connected</span></div>
      <div className="integrationlist">{integrations.map(({icon:Icon,...item})=><article key={item.name}><span className={`integrationicon ${item.ready?"ready":""}`}><Icon size={18}/></span><div><h3>{item.name}</h3><p>{item.detail}</p></div><span className={`connectstate ${item.ready?"ready":""}`}>{item.ready?<Check size={11}/>:<CircleDashed size={11}/>} {item.ready?"Connected":"Setup needed"}</span></article>)}</div>
    </section>
  </div></AppShell>;
}
