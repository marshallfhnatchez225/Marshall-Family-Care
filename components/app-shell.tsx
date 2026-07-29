import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/src/types";

export function AppShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: SessionUser;
}) {
  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 bg-slate-950/45 px-6 py-8 lg:border-b-0 lg:border-r">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.38em] text-cyan-100/60">
              Marshall
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              Family Care
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Private intake, family communication, and care coordination.
            </p>
          </div>
          <nav className="space-y-2">
            <Link href="/dashboard/family-care" className="block rounded-2xl border border-cyan-200/25 bg-cyan-100/5 px-4 py-3 text-sm text-cyan-50 transition hover:bg-cyan-100/10">
              <span className="block font-medium">Cases</span>
              <span className="mt-1 block text-xs text-cyan-100/60">Packets, reviews & follow-up</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className="block rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-100 transition hover:border-cyan-200/30 hover:bg-cyan-100/5"
            >
              Settings
            </Link>
          </nav>
          <ol className="mt-8 space-y-3 border-t border-white/10 pt-6 text-xs text-slate-400">
            {["Create Case", "Send Family Packet", "Review Forms", "Follow Up", "Complete Case / Aftercare"].map((step, index) => (
              <li key={step} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/5 text-cyan-100">{index + 1}</span><span className="pt-1">{step}</span></li>
            ))}
          </ol>
        </aside>
        <main className="px-5 py-5 sm:px-8 lg:px-10">
          <header className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-slate-950/35 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">Signed in as {session.email}</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                {session.name}
              </h2>
            </div>
            <form action={logoutAction}>
              <button className="rounded-full border border-cyan-200/25 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-200/10">
                Log out
              </button>
            </form>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
