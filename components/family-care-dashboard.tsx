import { attachPacketAction, createPacketAction, resetDemoAction, reviewSectionAction, saveArrangementSheetAction } from "@/app/actions/family-care";
import type { FamilyCase, SectionKey } from "@/lib/family-care-types";

const sectionLabels: Record<SectionKey, string> = {
  general: "General Information",
  obituary: "Obituary",
  deathCertificate: "Death Certificate",
  embalming: "Permission to Embalm",
};

function valueOrMissing(value?: string) {
  return value?.trim()
    ? <span className="text-white">{value}</span>
    : <span className="rounded-md bg-amber-200/15 px-2 py-1 font-semibold text-amber-200">Missing — follow up</span>;
}

function ServiceSummary({ packet }: { packet: FamilyCase }) {
  const general = packet.sections.general.data;
  const obituary = packet.sections.obituary.data;
  const rows = [
    ["Decedent", general.fullName || obituary.name],
    ["Family contact", general.informantName || obituary.contactName],
    ["Family phone", general.informantTelephone || obituary.contactPhone],
    ["Service date", general.funeralDate || obituary.serviceDate],
    ["Service time", general.funeralTime || obituary.serviceTime],
    ["Service location", general.funeralPlace || obituary.servicePlace],
    ["Officiant / pastor", general.officiant],
    ["Cemetery", general.cemeteryName || obituary.cemetery],
    ["Minister notified", general.ministerNotified],
    ["Viewing date", obituary.viewingDate],
    ["Viewing time", obituary.viewingTime],
    ["Viewing location", obituary.viewingPlace],
  ];
  const missing = rows.filter(([, value]) => !value?.trim()).length;
  return <section className="rounded-3xl border border-cyan-200/20 bg-cyan-100/5 p-5">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.24em] text-cyan-200">Staff only</p><h3 className="mt-2 text-2xl font-semibold">Service Summary</h3></div>
      <p className={`rounded-full px-3 py-2 text-xs font-semibold ${missing ? "bg-amber-200/15 text-amber-100" : "bg-emerald-200/15 text-emerald-100"}`}>{missing ? `${missing} item${missing === 1 ? "" : "s"} need follow-up` : "Ready for service coordination"}</p>
    </div>
    <dl className="mt-5 grid gap-3 md:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4"><dt className="text-xs uppercase tracking-[.16em] text-slate-400">{label}</dt><dd className="mt-2 text-sm">{valueOrMissing(value)}</dd></div>)}</dl>
    <p className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">Staff follow-up: Social Security number is not collected in this family packet. Obtain it only through Marshall’s approved internal process if required for the death certificate.</p>
  </section>;
}

type ArrangementField = { name: string; label: string; auto?: string };
function arrangementAnswer(packet: FamilyCase, source?: string) {
  if (!source) return "";
  const [section, field] = source.split(".") as [SectionKey, string];
  return packet.sections[section]?.data[field] || "";
}
function ArrangementSheet({ packet }: { packet: FamilyCase }) {
  const groups: { heading: string; fields: ArrangementField[] }[] = [
    { heading: "Decedent & visitation", fields: [{ name: "name", label: "Name", auto: "general.fullName" }, { name: "nickname", label: "Nickname" }, { name: "age", label: "Age", auto: "general.age" }, { name: "visitation", label: "Visitation" }, { name: "wake", label: "Wake" }, { name: "visitationDayOfService", label: "Visitation day of service" }, { name: "visitationNotes", label: "Visitation notes" }] },
    { heading: "Service", fields: [{ name: "serviceLocation", label: "Service location", auto: "general.funeralPlace" }, { name: "serviceAddress", label: "Service address" }, { name: "serviceNotes", label: "Service notes" }, { name: "serviceDate", label: "Service date", auto: "general.funeralDate" }, { name: "serviceTime", label: "Service time", auto: "general.funeralTime" }, { name: "ministerPastor", label: "Minister / pastor", auto: "general.officiant" }, { name: "eulogistOfficiant", label: "Eulogist / officiant" }] },
    { heading: "Family pickup & viewing", fields: [{ name: "pickupFrom", label: "Picking family up from" }, { name: "pickupAddress", label: "Pickup address" }, { name: "pickupNotes", label: "Pickup notes" }, { name: "pickupTime", label: "Pickup time" }, { name: "contacts", label: "Family contacts", auto: "general.informantTelephone" }, { name: "viewingGoingChurch", label: "Viewing: going to church / before" }, { name: "viewingAfterMinister", label: "Viewing: after minister" }] },
    { heading: "Cemetery, merchandise & reminders", fields: [{ name: "cemetery", label: "Cemetery", auto: "general.cemeteryName" }, { name: "cemeteryNotes", label: "Cemetery notes" }, { name: "casketColor", label: "Casket color" }, { name: "casketName", label: "Casket name" }, { name: "casketSpray", label: "Casket spray" }, { name: "panel", label: "Panel" }, { name: "overlay", label: "Overlay" }, { name: "boxVault", label: "Box / vault" }, { name: "limousine", label: "Limousine" }, { name: "keyrings", label: "Keyrings" }, { name: "dvd", label: "DVD" }, { name: "deathCertificates", label: "Death certificate(s)", auto: "deathCertificate.quantity" }, { name: "nameForPickup", label: "Name for pickup" }, { name: "churchOpen", label: "Church open" }, { name: "pallbearers", label: "Pallbearers" }] },
  ];
  const autoFilled = groups.flatMap((group) => group.fields).filter((field) => field.auto && arrangementAnswer(packet, field.auto)).length;
  return <section className="rounded-3xl border border-[#c6a15b]/40 bg-[#6e172c]/20 p-5">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-[#f2d486]">5 · Staff-only arrangement sheet</p><h3 className="mt-2 text-2xl font-semibold">Arrangement Sheet</h3><p className="mt-2 max-w-3xl text-sm text-slate-200">The same working sheet, made digital. Packet answers land in their matching fields; complete or correct anything else, then save.</p></div><p className="rounded-full bg-[#c6a15b]/20 px-3 py-2 text-xs font-semibold text-[#f2d486]">{autoFilled} details pre-filled</p></div>
    <form action={saveArrangementSheetAction} className="mt-5 space-y-5"><input type="hidden" name="packetId" value={packet.id} />{groups.map((group) => <fieldset key={group.heading} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4"><legend className="px-2 text-sm font-semibold text-[#f2d486]">{group.heading}</legend><div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{group.fields.map((field) => <label key={field.name} className="text-xs font-medium text-slate-300">{field.label}<input name={field.name} defaultValue={packet.arrangementSheet?.[field.name] || arrangementAnswer(packet, field.auto)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white" /></label>)}</div></fieldset>)}<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-400">Only signed-in Marshall staff can open or save this sheet.</p><button className="rounded-full bg-[#c6a15b] px-5 py-3 text-sm font-semibold text-[#40101e]">Save Arrangement Sheet</button></div></form>
  </section>;
}

export function FamilyCareDashboard({ cases, issued, demoEnabled, selectedId }: { cases: FamilyCase[]; issued?: { id: string; token: string }; demoEnabled: boolean; selectedId?: string }) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const issuedPacket = cases.find((item) => item.id === issued?.id);
  const issuedLink = issued ? `${base}/family/${issued.token}` : "";
  const inbox = cases.filter((item) => item.packetState === "submitted" || item.packetState === "attached" || Object.values(item.sections).some((section) => section.status === "submitted" || section.status === "needs-follow-up" || section.status === "approved"));
  const selected = inbox.find((item) => item.id === selectedId) || inbox[0];
  const attachedCases = cases.filter((item) => item.packetState === "attached" || (!item.packetState && item.decedentName !== "Awaiting family packet"));

  return <div className="space-y-7">
    <header><p className="text-sm uppercase tracking-[.3em] text-cyan-200/70">Marshall Family Care</p><h1 className="mt-2 text-4xl font-semibold">Family Packet Inbox</h1><p className="mt-3 max-w-3xl text-slate-300">Send the secure packet first. When a family submits answers, review them here and create or attach the Family Care case without typing the information again.</p></header>

    <section className="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]"><div><p className="text-xs font-semibold uppercase tracking-[.24em] text-cyan-200">1 · Text packet</p><h2 className="mt-2 text-2xl font-semibold">Prepare a secure family packet text</h2><p className="mt-2 text-sm leading-6 text-slate-300">Enter the family mobile number and document consent. No preliminary case number is required. Without a configured SMS provider, the message remains queued-ready and is not sent.</p><form action={createPacketAction} className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm text-slate-300">Family mobile number<input name="familyMobile" type="tel" required inputMode="tel" placeholder="+16625550123" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" /></label><label className="text-sm text-slate-300">Family email (optional)<input name="familyEmail" type="email" placeholder="family@example.com" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" /></label><label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 sm:col-span-2"><input name="smsConsent" value="yes" type="checkbox" required className="mt-1 size-4" /><span>I confirm the family asked for or consented to receive this private packet link by text message.</span></label><button className="rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 sm:col-span-2 sm:justify-self-start">Text packet link</button></form></div>
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[.2em] text-slate-400">Packet includes</p><ul className="mt-3 space-y-2 text-sm text-slate-200"><li>General Information</li><li>Obituary</li><li>Mississippi Death Certificate Worksheet</li><li>Permission to Embalm</li></ul>{demoEnabled && <form action={resetDemoAction} className="mt-5"><button className="text-sm font-semibold text-amber-200 underline">Reset fictional submitted packet</button></form>}</aside></div>
    </section>

    {issuedPacket && issued && <section className="rounded-3xl border border-amber-300/30 bg-amber-300/10 p-5"><p className="text-xs font-semibold uppercase tracking-[.22em] text-amber-200">2 · SMS preview</p><h2 className="mt-2 text-xl font-semibold">Queued-ready preview — no text sent</h2><p className="mt-2 text-sm text-slate-200">Mobile: {issuedPacket.familyMobile}</p><p className="mt-2 text-sm text-slate-300">Consent recorded {issuedPacket.smsConsentAt ? new Date(issuedPacket.smsConsentAt).toLocaleString() : "by staff"}. An SMS provider and sender are not configured, so this message was not transmitted.</p><textarea aria-label="SMS-ready packet message" readOnly rows={5} value={`Marshall Funeral Home: Your private Family Care packet is ready: ${issuedLink}\nExpires ${new Date(issuedPacket.access.expiresAt).toLocaleDateString()}. Save and return with this link. Do not forward it.`} className="mt-4 w-full rounded-xl border border-white/15 bg-slate-950/50 px-4 py-3 text-sm" /><input aria-label="Copyable secure family packet link" readOnly value={issuedLink} className="mt-3 w-full rounded-xl border border-white/15 bg-slate-950/50 px-4 py-3 text-sm" /><a href={issuedLink} className="mt-4 inline-block rounded-full bg-amber-200 px-5 py-3 text-sm font-semibold text-amber-950">Open family packet</a></section>}

    <section className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <aside className="rounded-3xl border border-white/10 bg-slate-950/35 p-5"><p className="text-xs font-semibold uppercase tracking-[.22em] text-cyan-200">3 · Staff Inbox</p><h2 className="mt-2 text-2xl font-semibold">Submitted packets</h2><p className="mt-2 text-sm text-slate-400">{inbox.length} packet{inbox.length === 1 ? "" : "s"} awaiting or completing review</p><div className="mt-4 space-y-3">{inbox.map((packet) => { const name = packet.sections.general.data.fullName || packet.sections.obituary.data.name || "Family packet"; return <a key={packet.id} href={`/dashboard/family-care?selected=${packet.id}`} className={`block rounded-2xl border p-4 ${selected?.id === packet.id ? "border-cyan-300/40 bg-cyan-200/10" : "border-white/10 bg-white/5"}`}><p className="text-sm font-semibold">{packet.isDemo && "DEMO · "}{name}</p><p className="mt-1 text-xs text-slate-400">{packet.familyMobile || packet.familyEmail}</p><p className="mt-2 text-xs font-semibold uppercase text-cyan-200">{packet.packetState === "attached" ? "Attached to case" : "Submitted for review"}</p></a>; })}{!inbox.length && <p className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">Submitted family packets will appear here.</p>}</div></aside>

      <div className="space-y-6">{selected ? <>
        <section className="rounded-3xl border border-white/10 bg-slate-950/35 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-cyan-200">Review submission</p><h2 className="mt-2 text-2xl font-semibold">{selected.sections.general.data.fullName || selected.sections.obituary.data.name || "Submitted family packet"}</h2><p className="mt-1 text-sm text-slate-400">{selected.familyEmail} · Submitted {selected.packetSubmittedAt ? new Date(selected.packetSubmittedAt).toLocaleString() : "section activity received"}</p></div>{selected.packetState === "attached" && <span className="rounded-full bg-emerald-200/15 px-3 py-2 text-xs font-semibold text-emerald-100">Family Care case attached</span>}</div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">{(Object.keys(sectionLabels) as SectionKey[]).map((key) => <details key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4"><summary className="cursor-pointer text-sm font-semibold">{sectionLabels[key]} <span className="ml-2 text-xs uppercase text-cyan-200">{selected.sections[key].status.replace("-", " ")}</span></summary><dl className="mt-4 space-y-2">{Object.entries(selected.sections[key].data).slice(0, 12).map(([field, value]) => <div key={field} className="grid grid-cols-[130px_1fr] gap-3 text-xs"><dt className="text-slate-500">{field}</dt><dd className="break-words text-slate-200">{value || "—"}</dd></div>)}</dl><form action={reviewSectionAction} className="mt-4 flex gap-2"><input type="hidden" name="caseId" value={selected.id} /><input type="hidden" name="section" value={key} /><select aria-label={`${sectionLabels[key]} review state`} name="status" defaultValue={selected.sections[key].status} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-xs"><option value="incomplete">Incomplete</option><option value="submitted">Submitted</option><option value="needs-follow-up">Needs follow-up</option><option value="approved">Approved</option></select><button className="rounded-lg border border-white/15 px-3 text-xs">Update</button></form></details>)}</div>
        </section>
        <ServiceSummary packet={selected} />
        <ArrangementSheet packet={selected} />
        <section className="rounded-3xl border border-violet-300/20 bg-violet-300/5 p-5"><p className="text-xs font-semibold uppercase tracking-[.22em] text-violet-200">4 · Create or attach case</p><h3 className="mt-2 text-xl font-semibold">Use these answers without re-entry</h3><p className="mt-2 text-sm text-slate-300">Create the Family Care case from this packet, or attach the structured answers to an existing case.</p><div className="mt-4 grid gap-4 md:grid-cols-2"><form action={attachPacketAction} className="rounded-2xl border border-white/10 p-4"><input type="hidden" name="packetId" value={selected.id} /><p className="text-sm font-semibold">Create new case from packet</p><p className="mt-2 text-xs text-slate-400">Decedent, contact, service, cemetery, viewing, and all four form responses carry forward.</p><button className="mt-4 rounded-full bg-violet-200 px-4 py-2 text-sm font-semibold text-violet-950">Create Family Care case</button></form><form action={attachPacketAction} className="rounded-2xl border border-white/10 p-4"><input type="hidden" name="packetId" value={selected.id} /><label className="text-sm font-semibold">Attach to existing case<select name="targetCaseId" required className="mt-3 w-full rounded-xl bg-slate-900 px-3 py-3 text-sm"><option value="">Select a case</option>{attachedCases.filter((item) => item.id !== selected.id).map((item) => <option key={item.id} value={item.id}>{item.decedentName}</option>)}</select></label><button className="mt-4 rounded-full border border-violet-200/40 px-4 py-2 text-sm font-semibold text-violet-100">Attach packet</button></form></div></section>
      </> : <section className="rounded-3xl border border-dashed border-white/15 p-10 text-center text-slate-400">Select a submitted packet to review its answers and Service Summary.</section>}</div>
    </section>
  </div>;
}
