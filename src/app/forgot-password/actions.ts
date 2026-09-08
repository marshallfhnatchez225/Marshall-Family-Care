"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createClient();
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "marshall-os.vercel.app";
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `https://${host}/auth/callback?next=/reset-password` });
  redirect("/forgot-password?sent=1");
}
