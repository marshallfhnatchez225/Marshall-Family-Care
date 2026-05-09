import {
  createFamilyAccount,
  deleteFamilyAccount,
  repairFamilyAccountByEmail,
  updateFamilyAccount
} from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";
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
  let familyProfiles: Array<{
    id: string;
    full_name: string | null;
    loved_one_name: string | null;
    preferred_phone: string | null;
    assigned_director: string | null;
    created_at: string;
    email?: string | null;
  }> = [];

  if (canManageFamilyAccess) {
    try {
      const admin = createAdminClient();
      const { data: profileRows } = await admin
        .from("profiles")
        .select("id, full_name, loved_one_name, preferred_phone, assigned_director, created_at")
        .eq("role", "family")
        .order("created_at", { ascending: false });
      const { data: authRows } = await admin.auth.admin.listUsers();
      const profileMap = new Map((profileRows ?? []).map((family) => [family.id, family]));

      for (const authUser of authRows?.users ?? []) {
        if (authUser.user_metadata?.role === "family" && !profileMap.has(authUser.id)) {
          profileMap.set(authUser.id, {
            id: authUser.id,
            full_name: (authUser.user_metadata?.full_name as string | undefined) ?? authUser.email ?? "",
            loved_one_name: (authUser.user_metadata?.loved_one_name as string | undefined) ?? "",
            preferred_phone: (authUser.user_metadata?.preferred_phone as string | undefined) ?? "",
            assigned_director: (authUser.user_metadata?.assigned_director as string | undefined) ?? "",
            created_at: authUser.created_at ?? ""
          });
        }
      }

      familyProfiles = Array.from(profileMap.values()).map((family) => {
        const authUser = authRows?.users.find((candidate) => candidate.id === family.id);
        return { ...family, email: authUser?.email ?? null };
      });
    } catch {
      familyProfiles = [];
    }
  }

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
      {canManageFamilyAccess ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Repair Existing Family Login</h2>
              <p className="section-note">
                Use this if a family login exists but still opens the staff overview.
              </p>
            </div>
          </div>
          <form action={repairFamilyAccountByEmail} className="family-account-form repair-form">
            <label>
              Login email
              <input name="email" type="email" placeholder="name@example.com" required />
            </label>
            <label>
              Family member
              <input name="fullName" placeholder="Full name" required />
            </label>
            <label>
              Loved one
              <input name="lovedOneName" placeholder="Decedent full name" required />
            </label>
            <label>
              Phone
              <input name="preferredPhone" placeholder="(555) 555-5555" />
            </label>
            <label>
              Director
              <input name="assignedDirector" placeholder="Staff name" />
            </label>
            <button className="button primary" type="submit">
              Repair access
            </button>
          </form>
        </section>
      ) : null}
      {canManageFamilyAccess ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Family Accounts</h2>
              <p className="section-note">
                Review, revise, or delete family portal access.
              </p>
            </div>
          </div>
          {familyProfiles.length > 0 ? (
            <div className="family-account-list">
              {familyProfiles.map((family) => (
                <article className="family-account-card" key={family.id}>
                  <form action={updateFamilyAccount} className="family-account-form">
                    <input name="userId" type="hidden" value={family.id} />
                    <label>
                      Login email
                      <input value={family.email ?? "Email unavailable"} readOnly />
                    </label>
                    <label>
                      Family member
                      <input name="fullName" defaultValue={family.full_name ?? ""} required />
                    </label>
                    <label>
                      Loved one
                      <input name="lovedOneName" defaultValue={family.loved_one_name ?? ""} required />
                    </label>
                    <label>
                      Phone
                      <input name="preferredPhone" defaultValue={family.preferred_phone ?? ""} />
                    </label>
                    <label>
                      Director
                      <input name="assignedDirector" defaultValue={family.assigned_director ?? ""} />
                    </label>
                    <div className="button-row">
                      <button className="button primary" type="submit">
                        Save changes
                      </button>
                    </div>
                  </form>
                  <form action={deleteFamilyAccount}>
                    <input name="userId" type="hidden" value={family.id} />
                    <input name="fullName" type="hidden" value={family.full_name ?? "family account"} />
                    <button className="button danger" type="submit">
                      Delete account
                    </button>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              No family accounts are listed yet. If you created one before this update,
              confirm its row in Supabase has role set to family.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
