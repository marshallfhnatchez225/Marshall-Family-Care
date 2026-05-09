import Link from "next/link";
import { getFamilyRecords, type StaffFamilyRecord } from "@/lib/family-admin";

function formatActivity(value: string | null) {
  if (!value) return "No activity yet";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function FamiliesPage() {
  let families: StaffFamilyRecord[] = [];

  try {
    families = await getFamilyRecords();
  } catch {
    families = [];
  }

  const averageProgress =
    families.length > 0
      ? Math.round(
          families.reduce((total, family) => total + (family.portal_progress ?? 0), 0) /
            families.length
        )
      : 0;
  const activeRequests = families.reduce(
    (total, family) => total + (family.open_requests ?? 0),
    0
  );

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div>
          <h2>Families</h2>
          <p className="section-note">
            Track family portal access, progress, and open requests.
          </p>
        </div>
        <a className="button primary" href="/dashboard/family-access">
          Add family
        </a>
      </div>
      <section className="grid stats-grid">
        <article className="metric-card">
          <span>Family accounts</span>
          <strong>{families.length}</strong>
        </article>
        <article className="metric-card">
          <span>Average progress</span>
          <strong>{averageProgress}%</strong>
        </article>
        <article className="metric-card">
          <span>Open requests</span>
          <strong>{activeRequests}</strong>
        </article>
        <article className="metric-card">
          <span>Need setup</span>
          <strong>{families.filter((family) => !family.loved_one_name).length}</strong>
        </article>
      </section>
      <section className="table-panel">
        {families.length > 0 ? (
          families.map((family) => {
            const progress = family.portal_progress ?? 0;

            return (
              <Link
                className="family-progress-row family-progress-link"
                href={`/dashboard/families/${family.id}`}
                key={family.id}
              >
                <div className="family-progress-main">
                  <strong>{family.loved_one_name || "Loved one not set"}</strong>
                  <span>
                    Contact: {family.full_name || "Family contact not set"}
                    {family.preferred_phone ? ` - ${family.preferred_phone}` : ""}
                  </span>
                  <span>Director: {family.assigned_director || "Not assigned"}</span>
                </div>
                <div className="family-progress-detail">
                  <span className="status-pill">{family.portal_status || "Not started"}</span>
                  <div className="staff-progress-bar" aria-label="Family portal progress">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <span>{progress}% complete</span>
                </div>
                <div className="family-progress-meta">
                  <span>{family.open_requests ?? 0} open requests</span>
                  <span>{formatActivity(family.last_portal_activity)}</span>
                </div>
                <span className="button secondary">Open details</span>
              </Link>
            );
          })
        ) : (
          <p className="empty-state">
            No family accounts yet. Create one from Family Access.
          </p>
        )}
      </section>
    </div>
  );
}
