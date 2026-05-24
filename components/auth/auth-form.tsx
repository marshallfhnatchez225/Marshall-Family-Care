import { requestPasswordReset, signIn } from "@/app/(auth)/login/actions";

type AuthFormProps = {
  message?: string;
};

export function AuthForm({ message }: AuthFormProps) {
  return (
    <form className="auth-form">
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
        <button formAction={signIn} className="button primary">
          Sign in
        </button>
        <button formAction={requestPasswordReset} className="button secondary" formNoValidate>
          Forgot password?
        </button>
      </div>
      <p className="helper-text">
        Family portal accounts are created by Marshall Family Care staff.
      </p>
    </form>
  );
}
