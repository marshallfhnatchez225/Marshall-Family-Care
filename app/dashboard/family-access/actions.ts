   "use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type StaffRole = "admin" | "staff" | "service_director";

const staffRoles = new Set<StaffRole>(["admin", "staff", "service_director"]);

function isStaffRole(role: string | null | undefined): role is StaffRole {
  return role === "admin" || role === "staff" || role === "service_director";
}

export async function createFamilyAccount(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || password.length < 8) {
    redirect(
      "/dashboard/family-access?message=Enter a name, email, and temporary password with at least 8 characters."
    );
  }

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
    redirect("/dashboard/family-access?message=Only staff can create family accounts.");
  }

  let admin: ReturnType<typeof createAdminClient>;

  try {
    admin = createAdminClient();
  } catch {
    redirect(
      "/dashboard/family-access?message=Missing Supabase service role key in Vercel environment variables."
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "family"
    }
  });

  if (error || !data.user) {
    redirect(
      `/dashboard/family-access?message=${encodeURIComponent(
        error?.message ?? "Could not create family account."
      )}`
    );
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    full_name: fullName,
    role: "family"
  });

  if (profileError) {
    redirect(
      `/dashboard/family-access?message=${encodeURIComponent(profileError.message)}`
    );
  }

  redirect(
    `/dashboard/family-access?message=${encodeURIComponent(
      `Family account created for ${fullName}. Share the temporary password securely.`
    )}`
  );
}
  
