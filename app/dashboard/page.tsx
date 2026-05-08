import { createClient } from "@/lib/supabase/server";

const staffStats = [
  { label: "Active arrangements", value: "12" },
  { label: "Upcoming services", value: "8" },
  { label: "Unread messages", value: "3" },
  { label: "Family updates", value: "15" }
];

const familyTasks = [
  {
    title: "Pre-Arrangement",
    tasks: [
      { label: "Confirm family contact information", status: "In progress" },
      { label: "Review service preferences", status: "Pending" },
      { label: "Upload or provide obituary details", status: "Pending" }
    ]
  },
  {
    title: "Post-Arrangement",
    tasks: [
      { label: "Approve service date, time, and location", status: "Pending" },
      { label: "Review remembrance items", status: "Pending" },
      { label: "Confirm floral and program details", status: "Pending" }
    ]
  },
  {
    title: "Aftercare",
    tasks: [
      { label: "Receive aftercare resources", status: "Available soon" },
      { label: "Schedule follow-up support call", status: "Optional" },
      { label: "View keepsake and document checklist", status: "Pending" }
    ]
  }
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const profileRole = (profile as { role?: string | null } | null)?.role;

  if (profileRole === "family") {
    return (
      <div className="page-stack">
        <section className="panel accent-panel">
          <h2>Family Task Manager</h2>
          <p>
            Track the items Marshall Family Care needs from your family before,
            during, and after arrangements.
          </p>
        </section>
        <section className="task-board">
          {familyTasks.map((group) => (
            <article className="task-column" key={group.title}>
              <h2>{group.title}</h2>
              <div className="task-card-list">
                {group.tasks.map((task) => (
                  <div className="task-card" key={task.label}>
                    <strong>{task.label}</strong>
                    <span>{task.status}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    );
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
