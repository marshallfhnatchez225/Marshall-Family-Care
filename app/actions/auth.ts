"use server";

import { redirect } from "next/navigation";
import { clearSession, createSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getRuntimeMode } from "@/lib/runtime-mode";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const mode = getRuntimeMode();
  if (mode === "supabase") {
    const supabase = await getSupabaseServerClient(); if (!supabase) redirect("/login?error=config");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) redirect("/login?error=invalid");
    const { data: profile } = await supabase.from("staff_profiles").select("is_active").eq("user_id", data.user.id).single();
    if (!profile?.is_active) { await supabase.auth.signOut(); redirect("/login?error=unauthorized"); }
    redirect("/dashboard/family-care");
  }
  if (mode !== "local-demo" || !process.env.MARSHALL_SESSION_SECRET || !process.env.MARSHALL_DEV_STAFF_PASSWORD) redirect("/login?error=config");
  if (email.toLowerCase() !== "director@marshall.local" || password !== process.env.MARSHALL_DEV_STAFF_PASSWORD) redirect("/login?error=invalid");

  await createSession({
    email: "director@marshall.local",
    name: "Marshall Care Director",
    role: "Care Director",
  });

  redirect("/dashboard/family-care");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
