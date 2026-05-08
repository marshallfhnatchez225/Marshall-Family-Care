import { AuthForm } from "@/components/auth/auth-form";

type LoginPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message } = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Marshall Family Care</p>
          <h1>Care Portal</h1>
          <p className="lede">
            Sign in to coordinate visits, messages, care plans, and family updates.
          </p>
        </div>
        <AuthForm message={message} />
      </section>
    </main>
  );
}
