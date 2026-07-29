import { FamilyCareDashboard } from "@/components/family-care-dashboard";
import { listFamilyCases } from "@/lib/family-care-repository";
import { isSafeLocalDemo } from "@/lib/runtime-mode";
export const dynamic = "force-dynamic";
export default async function FamilyCarePage({ searchParams }: { searchParams: Promise<{ new?: string; token?: string; selected?: string }> }) {
  const params = await searchParams; return <FamilyCareDashboard cases={await listFamilyCases()} issued={params.new && params.token ? { id: params.new, token: params.token } : undefined} demoEnabled={isSafeLocalDemo()} selectedId={params.selected} />;
}
