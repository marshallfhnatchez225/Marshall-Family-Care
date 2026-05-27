import Link from "next/link";
import { notFound } from "next/navigation";
import { getFamilyRecords } from "@/lib/family-admin";

type FamilyDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatActivity(value: string | null) {
  if (!value) return "No portal activity yet";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function FamilyDetailPage({ params }: FamilyDetailPageProps) {
  const { id } = await params;
  const families = await getFamilyRecords();
  const family = families.find((item) => item.id === id);

  if (!family) {
    notFound();
  }

  const progress = family.portal_progress ?? 0;

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div>
          <h2>{family.loved_one_name || "Family Detail"}</h2>
          <p className="section-note">
            Contact: {family.full_name || "Family contact not set"}
            {family.email ? ` - ${family.email}` : ""}
          </p>
        </div>
        <div className="button-row">
          <Link className="button secondary" href="/dashboard/families">
            Back to families
          </Link>
          <Link className="button secondary" href="/dashboard/family-access">
            Manage access
          </Link>
          <Link className="button primary" href={`/dashboard/families/${family.id}/family-view`}>
            View family portal
          </Link>
        </div>
      </div>
      <section className="grid stats-grid">
        <article className="metric-card">
          <span>Progress</span>
          <strong>{progress}%</strong>
        </article>
        <article className="metric-card">
          <span>Status</span>
          <strong>{family.portal_status || "Not started"}</strong>
        </article>
        <article className="metric-card">
          <span>Open requests</span>
          <strong>{family.open_requests ?? 0}</strong>
        </article>
        <article className="metric-card">
          <span>Last activity</span>
          <strong className="small-metric">{formatActivity(family.last_portal_activity)}</strong>
        </article>
      </section>
      <section className="content-grid">
        <article className="panel">
          <h2>Portal Progress</h2>
          <div className="staff-progress-bar detail-progress" aria-label="Family portal progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p>
            Progress updates when the family logs in, saves forms, submits for staff
            review, sends notes, or creates requests.
          </p>
        </article>
        <article className="panel accent-panel">
          <h2>Family Contact</h2>
          <div className="detail-list">
            <span>Family member: {family.full_name || "Not set"}</span>
            <span>Phone: {family.preferred_phone || "Not set"}</span>
            <span>Director: {family.assigned_director || "Not assigned"}</span>
            <span>Login email: {family.email || "Unavailable"}</span>
          </div>
        </article>
      </section>
    </div>
  );
}
