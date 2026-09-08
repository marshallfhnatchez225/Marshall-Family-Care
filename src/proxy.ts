import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll(values) { values.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { data: { user } } = await supabase.auth.getUser();
  const publicPath = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/forgot-password" || request.nextUrl.pathname === "/account-recovery" || request.nextUrl.pathname.startsWith("/auth/");
  if (!user && !publicPath) { const target = request.nextUrl.clone(); target.pathname = "/login"; target.search = ""; return NextResponse.redirect(target); }
  if (user && request.nextUrl.pathname === "/login") { const target = request.nextUrl.clone(); target.pathname = "/"; target.search = ""; return NextResponse.redirect(target); }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
