import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const staffStats = [
  { label: "Active arrangements", value: "12" },
  { label: "Upcoming services", value: "8" },
  { label: "Unread messages", value: "3" },
  { label: "Family updates", value: "15" }
];

export default async function DashboardPage() {
  let effectiveRole: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser }
    } = await supabase.auth.getUser();

    if (authUser) {
      effectiveRole = authUser.user_metadata?.role;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authUser.id)
        .single();

      const profileRole = (profile as { role?: string | null } | null)?.role;
      effectiveRole = profileRole ?? effectiveRole;
    }
  } catch {
    effectiveRole = undefined;
  }

  if (effectiveRole === "family") {
    redirect("/family-preview");
  }

  return (
    <div className="page-stack">
      <section className="grid stats-grid">
        {staffStats.map((stat) => (
          <article className="metric-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>
      <section className="content-grid">
        <article className="panel">
          <h2>Today&apos;s Priorities</h2>
          <ul className="task-list">
            <li>Confirm service details with the coordinating family contact.</li>
            <li>Review obituary and remembrance updates awaiting approval.</li>
            <li>Send visitation and transportation reminders for Friday.</li>
          </ul>
        </article>
        <article className="panel accent-panel">
          <h2>Family Support Snapshot</h2>
          <p>
            Keep staff, family contacts, and service coordinators aligned around
            each family&apos;s arrangements.
          </p>
        </article>
      </section>
    </div>
  );
}
