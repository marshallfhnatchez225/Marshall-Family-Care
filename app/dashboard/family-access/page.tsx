import { createFamilyAccount } from "./actions";
import { isStaffRole, type StaffRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const staffRoles = new Set<StaffRole>(["admin", "staff", "service_director"]);

type FamilyAccessPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function FamilyAccessPage({
  searchParams
}: FamilyAccessPageProps) {
  const { message } = await searchParams;
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

  const canManageFamilyAccess = Boolean(
    isStaffRole(profileRole) && staffRoles.has(profileRole)
  );

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div>
          <h2>Family Access</h2>
          <p className="section-note">
            Create sign-in credentials for approved family contacts.
          </p>
        </div>
      </div>
      <section className="panel">
        {message ? <p className="form-message">{message}</p> : null}
        {canManageFamilyAccess ? (
          <form action={createFamilyAccount} className="settings-form">
            <label>
              Family member name
              <input name="fullName" placeholder="Full name" required />
            </label>
            <label>
              Loved one name
              <input name="lovedOneName" placeholder="Decedent full name" required />
            </label>
            <label>
              Family phone
              <input name="preferredPhone" placeholder="(555) 555-5555" />
            </label>
            <label>
              Assigned director
              <input name="assignedDirector" placeholder="Staff name" />
            </label>
            <label>
              Family member email
              <input name="email" type="email" placeholder="name@example.com" required />
            </label>
            <label>
              Temporary password
              <input name="password" type="password" minLength={8} required />
            </label>
            <button className="button primary" type="submit">
              Create family account
            </button>
          </form>
        ) : (
          <p className="empty-state">
            Your account does not have permission to create family credentials.
          </p>
        )}
      </section>
    </div>
  );
}
