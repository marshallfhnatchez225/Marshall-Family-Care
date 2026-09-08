"use server";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export async function recoverAccount(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 10) redirect(`/account-recovery?token=${encodeURIComponent(token)}&message=Use at least 10 characters.`);
  if (password !== confirmation) redirect(`/account-recovery?token=${encodeURIComponent(token)}&message=Passwords do not match.`);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) redirect("/login?message=Account recovery is temporarily unavailable.");
  const admin = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: claimed } = await admin.from("account_recovery_tokens").update({ used_at: new Date().toISOString() }).eq("token_hash", tokenHash).is("used_at", null).gt("expires_at", new Date().toISOString()).select("user_id").maybeSingle();
  if (!claimed) redirect("/login?message=That recovery link is invalid or expired.");
  const { error } = await admin.auth.admin.updateUserById(claimed.user_id, { password });
  if (error) redirect("/login?message=Password could not be changed. Please request another recovery link.");
  redirect("/login?message=Password updated. You can sign in now.");
}
