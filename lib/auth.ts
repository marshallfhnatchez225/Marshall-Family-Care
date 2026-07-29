import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SessionUser } from "@/src/types";
import { getSupabaseServerClient } from "./supabase-server";
import { getRuntimeMode } from "./runtime-mode";

const SESSION_COOKIE = "marshall-staff-session";

export async function createSession(user: SessionUser) {
  if (getRuntimeMode() !== "local-demo") throw new Error("Local sessions are disabled.");
  const store = await cookies();
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const signature = createHmac("sha256", process.env.MARSHALL_SESSION_SECRET || "").update(payload).digest("base64url");
  store.set(SESSION_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getCurrentSession(): Promise<SessionUser | null> {
  const mode = getRuntimeMode();
  if (mode === "supabase") {
    const supabase = await getSupabaseServerClient(); if (!supabase) return null;
    const { data: { user }, error } = await supabase.auth.getUser(); if (error || !user) return null;
    const { data: profile, error: profileError } = await supabase.from("staff_profiles").select("full_name,role,is_active").eq("user_id", user.id).single();
    if (profileError || !profile?.is_active) return null;
    return { email: user.email || "", name: profile.full_name, role: profile.role };
  }
  if (mode !== "local-demo") return null;
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;

  if (!value) {
    return null;
  }

  try {
    const secret = process.env.MARSHALL_SESSION_SECRET;
    if (!secret) return null;
    const [payload, provided] = value.split(".");
    if (!payload || !provided) return null;
    const expected = createHmac("sha256", secret).update(payload).digest("base64url");
    if (expected.length !== provided.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
  } catch {
    return null;
  }
}

export async function clearSession() {
  if (getRuntimeMode() === "supabase") {
    const supabase = await getSupabaseServerClient();
    if (supabase) await supabase.auth.signOut();
    return;
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
