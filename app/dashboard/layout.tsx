import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const profileRole = (profile as { role?: string | null } | null)?.role;

  return (
    <main className="dashboard-shell">
      <DashboardNav role={profileRole} />
      <section className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Private family workspace</p>
            <h1>Marshall Family Care Portal</h1>
          </div>
          <div className="user-chip">{user.email}</div>
        </header>
        {children}
      </section>
    </main>
  );
}
