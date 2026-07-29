import { redirect } from "next/navigation";
import { LoginCard } from "@/components/login-card";
import { getCurrentSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard/family-care");
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="grid-bg absolute inset-0 opacity-40" />
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[32px] glass-card">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="border-b border-white/10 px-8 py-10 lg:border-b-0 lg:border-r">
            <p className="mb-4 text-sm uppercase tracking-[0.35em] text-cyan-100/70">
              Marshall Family Care
            </p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              One clear place to guide every family through intake.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">
              Create a private case, send the family packet, review each form, keep
              promised updates, and prepare the case for aftercare.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                "One private family case",
                "Named staff access",
                "Secure packet links",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-cyan-100/10 bg-slate-950/35 px-4 py-4 text-sm text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
          <section className="px-8 py-10">
            <LoginCard supabaseConfigured={isSupabaseConfigured()} error={error} />
          </section>
        </div>
      </div>
    </main>
  );
}
