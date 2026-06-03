"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendFamilyInviteEmail } from "@/lib/email";
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

  const familyMetadata = {
    full_name: fullName,
    loved_one_name: lovedOneName,
    preferred_phone: preferredPhone,
    assigned_director: assignedDirector,
    role: "family"
  };

  const createResult = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: familyMetadata
  });

  let familyUser = createResult.data.user;
  let repairedExisting = false;

  if (createResult.error || !familyUser) {
    const message = createResult.error?.message ?? "Could not create family account.";
    const mayAlreadyExist = message.toLowerCase().includes("already") || message.toLowerCase().includes("registered") || message.toLowerCase().includes("exists");

    if (!mayAlreadyExist) {
      redirect(`/dashboard/family-access?message=${encodeURIComponent(message)}`);
    }

    const { data: users, error: listError } = await admin.auth.admin.listUsers();

    if (listError) {
      redirect(`/dashboard/family-access?message=${encodeURIComponent(listError.message)}`);
    }

    const existingUser = users.users.find((candidate) => candidate.email?.toLowerCase() === email);

    if (!existingUser) {
      redirect(`/dashboard/family-access?message=${encodeURIComponent(message)}`);
    }

    const { data: updateData, error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
      email_confirm: true,
      password,
      user_metadata: familyMetadata
    });

    if (updateError || !updateData.user) {
      redirect(
        `/dashboard/family-access?message=${encodeURIComponent(
          updateError?.message ?? "Could not repair existing family account."
        )}`
      );
    }

    familyUser = updateData.user;
    repairedExisting = true;
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: familyUser.id,
    full_name: fullName,
    loved_one_name: lovedOneName,
    last_portal_activity: null,
    open_requests: 0,
    portal_progress: 0,
    portal_status: repairedExisting ? "Repaired by staff" : "Not started",
    preferred_phone: preferredPhone || null,
    assigned_director: assignedDirector || null,
    role: "family"
  });

  if (profileError) {
    redirect(`/dashboard/family-access?message=${encodeURIComponent(profileError.message)}`);
  }

  const emailResult = await sendFamilyInviteEmail({
    email,
    fullName,
    lovedOneName,
    password
  });

  if (!emailResult.sent) {
    redirect(
      `/dashboard/family-access?message=${encodeURIComponent(
        `${repairedExisting ? "Family account repaired" : "Family account created"} for ${fullName}. Email was not sent automatically, so provide the temporary password manually.`
      )}`
    );
  }

  redirect(
    `/dashboard/family-access?message=${encodeURIComponent(
      `${repairedExisting ? "Family account repaired" : "Family account created"} for ${fullName}. Login details were emailed to ${email}.`
    )}`
  );
}

export async function updateFamilyAccount(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const lovedOneName = String(formData.get("lovedOneName") ?? "").trim();
  const preferredPhone = String(formData.get("preferredPhone") ?? "").trim();
  const assignedDirector = String(formData.get("assignedDirector") ?? "").trim();

  if (!userId || !fullName || !lovedOneName) {
    redirect("/dashboard/family-access?message=Family name and loved one name are required.");
  }

  const admin = await requireStaffAdminClient();

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      full_name: fullName,
      loved_one_name: lovedOneName,
      preferred_phone: preferredPhone,
      assigned_director: assignedDirector,
      role: "family"
    }
  });

  if (authError) {
    redirect(`/dashboard/family-access?message=${encodeURIComponent(authError.message)}`);
  }

  const { error } = await admin.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    loved_one_name: lovedOneName,
    portal_status: "Updated by staff",
    preferred_phone: preferredPhone || null,
    assigned_director: assignedDirector || null,
    role: "family"
  });

  if (error) {
    redirect(`/dashboard/family-access?message=${encodeURIComponent(error.message)}`);
  }

  redirect(`/dashboard/family-access?message=${encodeURIComponent(`Family account updated for ${fullName}.`)}`);
}

export async function repairFamilyAccountByEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const lovedOneName = String(formData.get("lovedOneName") ?? "").trim();
  const preferredPhone = String(formData.get("preferredPhone") ?? "").trim();
  const assignedDirector = String(formData.get("assignedDirector") ?? "").trim();

  if (!email || !fullName || !lovedOneName) {
    redirect("/dashboard/family-access?message=Enter email, family name, and loved one name to repair access.");
  }

  const admin = await requireStaffAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();

  if (error) {
    redirect(`/dashboard/family-access?message=${encodeURIComponent(error.message)}`);
  }

  const authUser = data.users.find((candidate) => candidate.email?.toLowerCase() === email);

  if (!authUser) {
    redirect(`/dashboard/family-access?message=${encodeURIComponent(`No login found for ${email}. Create a new family account instead.`)}`);
  }

  const { error: authError } = await admin.auth.admin.updateUserById(authUser.id, {
    user_metadata: {
      full_name: fullName,
      loved_one_name: lovedOneName,
      preferred_phone: preferredPhone,
      assigned_director: assignedDirector,
      role: "family"
    }
  });

  if (authError) {
    redirect(`/dashboard/family-access?message=${encodeURIComponent(authError.message)}`);
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: authUser.id,
    full_name: fullName,
    loved_one_name: lovedOneName,
    last_portal_activity: null,
    open_requests: 0,
    portal_progress: 0,
    portal_status: "Repaired by staff",
    preferred_phone: preferredPhone || null,
    assigned_director: assignedDirector || null,
    role: "family"
  });

  if (profileError) {
    redirect(`/dashboard/family-access?message=${encodeURIComponent(profileError.message)}`);
  }

  redirect(`/dashboard/family-access?message=${encodeURIComponent(`Repaired family portal access for ${fullName}.`)}`);
}

export async function deleteFamilyAccount(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const fullName = String(formData.get("fullName") ?? "family account");

  if (!userId) {
    redirect("/dashboard/family-access?message=Missing family account ID.");
  }

  const admin = await requireStaffAdminClient();

  await admin.from("profiles").delete().eq("id", userId).eq("role", "family");
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    redirect(`/dashboard/family-access?message=${encodeURIComponent(error.message)}`);
  }

  redirect(`/dashboard/family-access?message=${encodeURIComponent(`Deleted ${fullName}.`)}`);
}

async function requireStaffAdminClient() {
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
    redirect("/dashboard/family-access?message=Only staff can manage family accounts.");
  }

  try {
    return createAdminClient();
  } catch {
    redirect(
      "/dashboard/family-access?message=Missing Supabase service role key in Vercel environment variables."
    );
  }
}
