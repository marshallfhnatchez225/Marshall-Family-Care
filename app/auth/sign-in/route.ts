import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?message=Enter your email and password.");
  }

  let loginError: string | null = null;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      loginError = error.message;
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown connection error";
    loginError = `Could not connect to Supabase. Check the Vercel Supabase environment variables. Details: ${detail}`;
  }

  if (loginError) {
    redirect(`/login?message=${encodeURIComponent(loginError)}`);
  }

  redirect("/dashboard");
}
