import Link from "next/link";

type AuthFormProps = {
  message?: string;
};

export function AuthForm({ message }: AuthFormProps) {
  return (
    <form action="/auth/sign-in" className="auth-form" method="post">
      {message ? <p className="form-message">{message}</p> : null}
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          required
        />
      </label>
      <div className="button-row">
        <button className="button primary" type="submit">
          Sign in
        </button>
        <Link className="button secondary" href="/forgot-password">
          Forgot password?
        </Link>
      </div>
      <p className="helper-text">
        Family portal accounts are created by Marshall Family Care staff.
      </p>
      <p className="helper-text">
        Seeing the wrong account? <Link href="/auth/sign-out">Sign out current user</Link>.
      </p>
    </form>
  );
}
