import { notFound } from "next/navigation";
import { FamilyPacket } from "@/components/family-packet";
import { getCaseByToken } from "@/lib/family-care-repository";
import type { SectionKey } from "@/lib/family-care-types";
import { isSafeLocalDemo } from "@/lib/runtime-mode";
export const dynamic = "force-dynamic";
const valid = new Set(["general", "obituary", "deathCertificate", "embalming"]);
export default async function FamilyPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ section?: string }> }) {
  const { token } = await params; const query = await searchParams; const result = await getCaseByToken(token);
  if (result.state === "invalid") notFound();
  if (result.state !== "active") return <main className="grid min-h-screen place-items-center bg-[#f6f2e9] px-5 text-slate-900"><div className="max-w-lg rounded-3xl border border-stone-300 bg-white p-8 text-center"><p className="text-sm uppercase tracking-[.25em] text-teal-800">Marshall Family Care</p><h1 className="mt-3 text-3xl font-semibold">This link is {result.state}.</h1><p className="mt-4 text-slate-600">Please contact Marshall Funeral Home for a new private access link.</p></div></main>;
  const section = valid.has(query.section || "") ? query.section as SectionKey : "general";
  return <FamilyPacket item={result.item} token={token} active={section} typedSignatureEnabled={isSafeLocalDemo()} />;
}
