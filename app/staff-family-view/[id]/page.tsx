import { notFound, redirect } from "next/navigation";
import { ViewAsFamilyPortal } from "@/components/dashboard/view-as-family-portal";
import { getFamilyRecords } from "@/lib/family-admin";
import { isStaffRole, type StaffRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

const staffRoles = new Set<StaffRole>(["admin", "staff", "service_director"]);

type StaffFamilyViewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffFamilyViewPage({ params }: StaffFamilyViewPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const profileRole = (profile as { role?: string | null } | null)?.role;

  if (!isStaffRole(profileRole) || !staffRoles.has(profileRole)) {
    redirect("/dashboard");
  }

  const families = await getFamilyRecords();
  const family = families.find((item) => item.id === id);

  if (!family) {
    notFound();
  }

  return <ViewAsFamilyPortal family={family} />;
}
