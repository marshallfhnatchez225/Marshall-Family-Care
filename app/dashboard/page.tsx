const stats = [
  { label: "Active care plans", value: "12" },
  { label: "Upcoming visits", value: "8" },
  { label: "Unread messages", value: "3" },
  { label: "Family updates", value: "15" }
];

export default function DashboardPage() {
  return (
    <div className="page-stack">
      <section className="grid stats-grid">
        {stats.map((stat) => (
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
            <li>Confirm morning medication check-ins.</li>
            <li>Review the care note from yesterday&apos;s home visit.</li>
            <li>Send appointment reminders for Friday transportation.</li>
          </ul>
        </article>
        <article className="panel accent-panel">
          <h2>Care Team Snapshot</h2>
          <p>
            Keep family contacts, caregivers, and clinicians aligned around each
            patient&apos;s care plan.
          </p>
        </article>
      </section>
    </div>
  );
}
