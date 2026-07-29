import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="glass-card max-w-lg rounded-[28px] p-10 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-100/60">404</p>
        <h1 className="mt-4 text-3xl font-semibold">Module not found</h1>
        <p className="mt-4 text-slate-300">
          This Family Care page does not exist or is no longer available.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-full bg-cyan-300 px-5 py-3 font-medium text-slate-950"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
