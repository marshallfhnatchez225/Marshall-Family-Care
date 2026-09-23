import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { allowedModulesFromClaims, canAccessPath } from "@/lib/access";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  // This endpoint independently verifies its worker bearer secret.
  if(request.nextUrl.pathname==='/api/notifications/process')return response;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const publicAsset = request.nextUrl.pathname === '/manifest.webmanifest' || request.nextUrl.pathname === '/apple-touch-icon.png' || request.nextUrl.pathname.startsWith('/icon-');
  if(publicAsset)return response;
  const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll(values) { values.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  // Family links are validated independently on every read and write.
  if (request.nextUrl.pathname.startsWith('/family/')) {
    response.headers.set('Cache-Control','private, no-store');
    response.headers.set('Referrer-Policy','no-referrer');
    return response;
  }
  const { data, error } = await supabase.auth.getClaims();
  const signedIn = !error && !!data?.claims;
  const publicPath = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/forgot-password" || request.nextUrl.pathname === "/account-recovery" || request.nextUrl.pathname.startsWith("/auth/");
  const redirectTo = (!signedIn && !publicPath) ? '/login' : (signedIn && request.nextUrl.pathname === '/login') ? '/' : null;
  if (redirectTo) {
    const target=request.nextUrl.clone(); target.pathname=redirectTo; target.search='';
    const redirected=NextResponse.redirect(target);
    response.cookies.getAll().forEach(cookie=>redirected.cookies.set(cookie));
    redirected.headers.set('Cache-Control','private, no-store');
    return redirected;
  }
  if (signedIn && !publicPath && request.nextUrl.pathname !== "/reset-password") {
    const allowedModules = allowedModulesFromClaims(data.claims as Record<string, unknown>);
    if (!canAccessPath(request.nextUrl.pathname, allowedModules)) {
      const target=request.nextUrl.clone(); target.pathname='/'; target.search='';
      const redirected=NextResponse.redirect(target);
      response.cookies.getAll().forEach(cookie=>redirected.cookies.set(cookie));
      redirected.headers.set('Cache-Control','private, no-store');
      return redirected;
    }
  }
  response.headers.set('Cache-Control','private, no-store');
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
