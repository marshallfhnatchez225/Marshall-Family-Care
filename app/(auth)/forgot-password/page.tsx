import { requestPasswordReset } from "@/app/(auth)/login/actions";
import Link from "next/link";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const { message } = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Marshall Family Care</p>
          <h1>Reset Access</h1>
          <p className="lede">
            Enter your portal email and we will send a secure link to create a new password.
          </p>
        </div>
        <form className="auth-form">
          {message ? <p className="form-message">{message}</p> : null}
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <div className="button-row">
            <button formAction={requestPasswordReset} className="button primary">
              Send reset link
            </button>
            <Link className="button secondary" href="/login">
              Back to sign in
            </Link>
          </div>
          <p className="helper-text">
            If you do not receive the email, check your spam folder or contact Marshall Family Care staff.
          </p>
        </form>
      </section>
    </main>
  );
}
