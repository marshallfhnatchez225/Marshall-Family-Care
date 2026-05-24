import Link from "next/link";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <div className="page-stack account-page">
      <section className="panel account-panel">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Change Password</h1>
          <p className="section-note">
            Update the password for {user?.email ?? "your portal account"}. Use at least 8 characters.
          </p>
        </div>
        <ChangePasswordForm />
        <div className="button-row">
          <Link className="button secondary" href="/dashboard">
            Back to portal
          </Link>
        </div>
      </section>
    </div>
  );
}
