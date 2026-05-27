import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FamilyPortal } from "@/components/family/family-portal";
import { getFamilyRecords } from "@/lib/family-admin";
import { isStaffRole, type StaffRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

const staffRoles = new Set<StaffRole>(["admin", "staff", "service_director"]);

type FamilyViewPageProps = {
  params: Promise<{ id: string }>;
};

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

  return (
    <div className="page-stack">
      <style>{`
        .staff-family-preview {
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 8px 24px rgba(60, 26, 31, 0.06);
        }

        .staff-family-preview .family-portal {
          min-height: 760px;
        }
      `}</style>
      <div className="section-heading">
        <div>
          <h2>Family View</h2>
          <p className="section-note">
            Previewing the portal for {family.full_name || "this family contact"}.
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
        <h2>Staff preview</h2>
        <p>
          This shows the family-facing portal with this account's loved one, next of kin,
          phone number, and assigned director. Entries typed here are for previewing the
          experience from this browser.
        </p>
      </section>
      <div className="staff-family-preview">
        <FamilyPortal
          assignedDirector={family.assigned_director}
          familyContact={family.full_name}
          lovedOneName={family.loved_one_name}
          preferredPhone={family.preferred_phone}
          userId={`staff-preview-${family.id}`}
        />
      </div>
    </div>
  );
}
