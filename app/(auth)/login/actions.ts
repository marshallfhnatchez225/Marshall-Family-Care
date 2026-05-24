"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function getOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  return host ? `${protocol}://${host}` : undefined;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/forgot-password?message=Enter your email address to reset your password.");
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const redirectTo = origin ? `${origin}/auth/callback?next=/reset-password` : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });

  if (error) {
    redirect(`/forgot-password?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/forgot-password?message=Password reset email sent. Check your inbox and spam folder.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
