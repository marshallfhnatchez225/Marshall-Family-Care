"use client";

import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="w-full rounded-full bg-cyan-300 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-300/60"
      disabled={pending}
    >
      {pending ? "Signing in..." : "Launch dashboard"}
    </button>
  );
}

export function LoginCard({
  supabaseConfigured,
  error,
}: {
  supabaseConfigured: boolean;
  error?: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/30 p-6">
      <p className="text-sm uppercase tracking-[0.28em] text-cyan-100/60">Access</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">Sign in</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Named Marshall staff only. Access stays disabled until a staff allowlist and
        secure session secret are configured.
      </p>
      <div className="mt-4 rounded-2xl border border-cyan-200/15 bg-cyan-200/5 px-4 py-3 text-sm text-cyan-50">
        Data service: {supabaseConfigured ? "Supabase configured" : "local development repository"}
      </div>
      {error && <p role="alert" className="mt-4 rounded-2xl border border-red-300/25 bg-red-300/10 px-4 py-3 text-sm text-red-100">{error === "config" ? "Staff access is not configured. See .env.example." : error === "unauthorized" ? "This account is not an active Marshall staff profile." : "Email or password was not recognized."}</p>}
      <form action={loginAction} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Email address</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            placeholder="you@marshallfuneralhomems.com"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Password</span>
          <input type="password" name="password" autoComplete="current-password" required className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none" />
        </label>
        <SubmitButton />
      </form>
    </div>
  );
}
