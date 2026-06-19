"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, User, Shield, ArrowRight, Loader2 } from "lucide-react";

type Role = "coach" | "member" | "admin";

const ROLES: { id: Role; label: string; desc: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "coach", label: "Coach", desc: "Manage clients & programs", href: "/dashboard", icon: Dumbbell },
  { id: "member", label: "Member", desc: "Your training & nutrition", href: "/client", icon: User },
  { id: "admin", label: "Admin", desc: "Gym & platform settings", href: "/admin", icon: Shield },
];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("coach");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const dest = ROLES.find((r) => r.id === role)!.href;
    setTimeout(() => router.push(dest), 500);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-orange-500 shadow-glow">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none">
              <path d="M6.5 9v6M9.5 7v10M14.5 7v10M17.5 9v6M4 12h2M18 12h2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-900">
            Fitness Factory <span className="text-brand-500">KC</span>
          </h1>
          <p className="mt-1 text-sm text-ink-500">Sign in to your coaching platform</p>
        </div>

        <div className="card p-6 sm:p-7">
          {/* Role selector */}
          <div className="mb-5 grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                  role === r.id
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-ink-200 hover:border-ink-300"
                }`}
              >
                <r.icon className={`h-5 w-5 ${role === r.id ? "text-brand-400" : "text-ink-500"}`} />
                <span className={`text-xs font-semibold ${role === r.id ? "text-ink-900" : "text-ink-600"}`}>{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="you@fitnessfactorykc.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label" htmlFor="password">Password</label>
                <button type="button" className="text-sm text-brand-400 hover:text-brand-500">Forgot?</button>
              </div>
              <input
                id="password" type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="input" placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in as {ROLES.find((r) => r.id === role)!.label} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-ink-400">
            Demo build — any email/password works. Pick a role above to enter.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          © {new Date().getFullYear()} Fitness Factory KC
        </p>
      </div>
    </main>
  );
}
