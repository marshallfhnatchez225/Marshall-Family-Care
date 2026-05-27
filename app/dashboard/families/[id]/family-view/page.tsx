import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getFamilyRecords } from "@/lib/family-admin";
import { isStaffRole, type StaffRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

const staffRoles = new Set<StaffRole>(["admin", "staff", "service_director"]);

type FamilyViewPageProps = {
  params: Promise<{ id: string }>;
};

function fieldValue(value: string | null | undefined, fallback = "Not added yet") {
  return value?.trim() || fallback;
}

export default async function FamilyViewPage({ params }: FamilyViewPageProps) {
  const { id } = await params;
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

  if (!isStaffRole(profileRole) || !staffRoles.has(profileRole)) {
    redirect("/dashboard");
  }

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
          <h2>Family View</h2>
          <p className="section-note">
            Staff preview for {fieldValue(family.full_name, "this family contact")}.
          </p>
        </div>
        <div className="button-row">
          <Link className="button secondary" href={`/dashboard/families/${family.id}`}>
            Back to details
          </Link>
          <Link className="button secondary" href="/dashboard/families">
            Families
          </Link>
        </div>
      </div>
      <section className="panel accent-panel">
        <h2>What the family sees</h2>
        <p>
          This is a staff-safe preview of the family portal sections without loading the
          interactive family account session.
        </p>
      </section>
      <section className="content-grid">
        <article className="panel">
          <h2>Case home</h2>
          <div className="detail-list">
            <span>Loved one: {fieldValue(family.loved_one_name)}</span>
            <span>Next of kin: {fieldValue(family.full_name)}</span>
            <span>Phone number: {fieldValue(family.preferred_phone)}</span>
            <span>Assigned director: {fieldValue(family.assigned_director, "Not assigned")}</span>
            <span>Status: {fieldValue(family.portal_status, "Not started")}</span>
          </div>
          <div className="staff-progress-bar detail-progress" aria-label="Family portal progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p>{progress}% complete</p>
        </article>
        <article className="panel">
          <h2>Pre-Arrangement</h2>
          <div className="detail-list">
            <span>Death certificate information</span>
            <span>Obituary information</span>
            <span>Permission to embalm</span>
            <span>General family information</span>
            <span>Next of kin information</span>
            <span>Veteran, church, and cemetery details</span>
          </div>
        </article>
      </section>
      <section className="content-grid">
        <article className="panel">
          <h2>Post-Arrangement</h2>
          <div className="detail-list">
            <span>Service details: To be added by staff</span>
            <span>Selections: To be added by staff</span>
            <span>Obituary draft: No draft added yet</span>
            <span>Open requests: {family.open_requests ?? 0}</span>
          </div>
        </article>
        <article className="panel">
          <h2>Aftercare</h2>
          <div className="detail-list">
            <span>Death certificate status: Not started</span>
            <span>Memorial video links: To be added by staff</span>
            <span>Flowers, marker help, grief support, and future assistance requests</span>
          </div>
        </article>
      </section>
    </div>
  );
}
