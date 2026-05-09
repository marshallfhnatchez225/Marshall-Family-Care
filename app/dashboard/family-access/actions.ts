"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffRole, type StaffRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const staffRoles = new Set<StaffRole>(["admin", "staff", "service_director"]);

export async function createFamilyAccount(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const lovedOneName = String(formData.get("lovedOneName") ?? "").trim();
  const preferredPhone = String(formData.get("preferredPhone") ?? "").trim();
  const assignedDirector = String(formData.get("assignedDirector") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !lovedOneName || !email || password.length < 8) {
    redirect(
      "/dashboard/family-access?message=Enter family name, loved one name, email, and a temporary password with at least 8 characters."
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
      loved_one_name: lovedOneName,
      preferred_phone: preferredPhone,
      assigned_director: assignedDirector,
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
    loved_one_name: lovedOneName,
    preferred_phone: preferredPhone || null,
    assigned_director: assignedDirector || null,
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
