"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function updatePassword(formData: FormData) { const password = String(formData.get("password") ?? ""); if (password.length < 10) redirect("/reset-password?message=Use at least 10 characters."); const supabase = await createClient(); const { error } = await supabase.auth.updateUser({ password }); if (error) redirect(`/reset-password?message=${encodeURIComponent(error.message)}`); redirect("/?password=updated"); }
