import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?message=Enter your email and password.");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      redirect(`/login?message=${encodeURIComponent(error.message)}`);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown connection error";
    redirect(
      `/login?message=${encodeURIComponent(
        `Could not connect to Supabase. Check the Vercel Supabase environment variables. Details: ${detail}`
      )}`
    );
  }

  redirect("/dashboard");
}
