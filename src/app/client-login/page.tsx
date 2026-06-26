"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, AlertCircle, Dumbbell } from "lucide-react";

function homeFor(role: string) {
  if (role === "member") return "/client";
  if (role === "admin") return "/admin";
  return "/dashboard";
}

function ClientLoginInner() {
  const params = useSearchParams();
  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Incorrect email or password.");

      // Stamp the login time so the notification bell only surfaces activity
      // that happens during this session.
      try { localStorage.setItem("ffkc-login-at", String(Date.now())); } catch { /* ignore */ }

      const role = data.user?.role ?? "member";
      // Members land in their portal; staff who use this page go to their own.
      const dest = next && next.startsWith("/") ? next : homeFor(role);
      window.location.assign(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow">
            <Dumbbell className="h-7 w-7 text-white" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-900">
            Fitness Factory <span className="text-brand-500">KC</span>
          </h1>
          <p className="mt-1 text-sm text-ink-500">Client sign-in — access your training plan</p>
        </div>

        <div className="card p-6 sm:p-7">
          <h2 className="mb-5 text-lg font-semibold text-ink-900">Welcome back 👋</h2>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email" type="email" required autoFocus
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="you@email.com"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password" type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="input" placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-4 space-y-1 text-center text-xs text-ink-400">
            <p>
              No account yet? Ask your coach to send you an invite link.
            </p>
            <Link href="/login" className="inline-block text-brand-400 hover:text-brand-500">
              Coach or admin? Sign in here
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          © {new Date().getFullYear()} Fitness Factory KC
        </p>
      </div>
    </main>
  );
}

export default function ClientLoginPage() {
  return (
    <Suspense fallback={null}>
      <ClientLoginInner />
    </Suspense>
  );
}
