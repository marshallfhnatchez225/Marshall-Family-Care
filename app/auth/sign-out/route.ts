import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?message=Signed out. You can sign in with a different account now.");
}

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?message=Signed out. You can sign in with a different account now.");
}
