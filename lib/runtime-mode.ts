import "server-only";

export function hasSupabasePublicConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function hasSupabaseServerConfig() {
  return Boolean(hasSupabasePublicConfig() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isSafeLocalDemo() {
  if (process.env.MARSHALL_DEMO_MODE !== "true") return false;
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  try {
    const host = new URL(base).hostname;
    return host === "127.0.0.1" || host === "localhost" || host === "::1";
  } catch {
    return false;
  }
}

export function getRuntimeMode(): "supabase" | "local-demo" | "unconfigured" {
  if (hasSupabaseServerConfig() && process.env.MARSHALL_LINK_SECRET && process.env.NEXT_PUBLIC_APP_URL) return "supabase";
  if (isSafeLocalDemo()) return "local-demo";
  return "unconfigured";
}

export function assertRuntimeConfigured() {
  const mode = getRuntimeMode();
  if (mode === "unconfigured") throw new Error("Marshall Family Care is not configured. Production requires the app URL, link secret, Supabase URL, publishable key, and server-only service role key.");
  return mode;
}
