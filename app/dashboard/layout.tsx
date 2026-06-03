import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  let userEmail: string | undefined;
  let profileRole: string | null | undefined;
  let loginRedirect: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      loginRedirect = `/login?message=${encodeURIComponent(userError.message)}`;
    } else if (!user) {
      loginRedirect = "/login";
    } else {
      userEmail = user.email;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      profileRole = profileError
        ? user.user_metadata?.role
        : (profile as { role?: string | null } | null)?.role;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dashboard connection error";
    loginRedirect = `/login?message=${encodeURIComponent(message)}`;
  }

  if (loginRedirect) {
    redirect(loginRedirect);
  }

  if (profileRole === "family") {
    return <>{children}</>;
  }

  return (
    <main className="dashboard-shell">
      <DashboardNav role={profileRole} />
      <section className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Private family workspace</p>
            <h1>Marshall Family Care Portal</h1>
          </div>
          <div className="user-chip">{userEmail}</div>
        </header>
        {children}
      </section>
    </main>
  );
}
