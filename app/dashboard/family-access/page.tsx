import { createFamilyAccount } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type StaffRole = "admin" | "staff" | "service_director";

const staffRoles = new Set<StaffRole>(["admin", "staff", "service_director"]);

function isStaffRole(role: string | null | undefined): role is StaffRole {
  return role === "admin" || role === "staff" || role === "service_director";
}

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
