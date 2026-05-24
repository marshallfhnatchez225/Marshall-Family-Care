"use client";

import { createClient } from "@/lib/supabase/browser";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState(searchParams.get("message") ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function updatePassword(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/login?message=Password updated. Please sign in with your new password.");
  }

  return (
    <form action={updatePassword} className="auth-form">
      {message ? <p className="form-message">{message}</p> : null}
      <label>
        New password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <label>
        Confirm new password
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <button className="button primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Marshall Family Care</p>
          <h1>Reset Password</h1>
          <p className="lede">
            Enter a new password for your family portal account. Use at least 8 characters.
          </p>
        </div>
        <Suspense fallback={<p className="helper-text">Loading password reset...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
