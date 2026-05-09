import { isStaffRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function StaffOnlyLayout({
  children
}: {
  children: ReactNode;
}) {
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

  if (!isStaffRole(profileRole)) {
    redirect("/dashboard");
  }

  return children;
}
