import type { SessionUser } from "@/src/types";

export function SettingsPanel({
  session,
  supabaseConfigured,
}: {
  session: SessionUser;
  supabaseConfigured: boolean;
}) {
  return (
    <div className="space-y-6">
      <section className="glass-card rounded-[30px] p-6">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-100/65">Settings</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Family Care access</h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          Review your named staff identity and the private data-service configuration
          used by Family Care.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass-card rounded-[30px] p-6">
          <h2 className="text-xl font-semibold text-white">Session</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-slate-400">Name</dt>
              <dd className="mt-1 text-white">{session.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Email</dt>
              <dd className="mt-1 text-white">{session.email}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Role</dt>
              <dd className="mt-1 text-white">{session.role}</dd>
            </div>
          </dl>
        </div>
        <div className="glass-card rounded-[30px] p-6">
          <h2 className="text-xl font-semibold text-white">Private case storage</h2>
          <p className="mt-4 text-sm text-slate-300">
            Status:{" "}
            <span className="font-medium text-white">
              {supabaseConfigured ? "Configured" : "Not configured"}
            </span>
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Local evaluation uses the server-only development repository. Configure
            Supabase Auth, row-level security, and private Storage before production.
          </p>
        </div>
      </section>
    </div>
  );
}
