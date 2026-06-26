"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";

type Mode = "login" | "signup" | "accept";

function homeFor(role: string) {
  if (role === "member") return "/client";
  if (role === "admin") return "/admin";
  return "/dashboard";
}

function LoginInner() {
  const params = useSearchParams();

  const inviteToken = params.get("invite");
  const inviteEmail = params.get("email");
  const next = params.get("next");

  const [mode, setMode] = useState<Mode>(inviteToken ? "accept" : "login");
  const [ready, setReady] = useState(Boolean(inviteToken));

  const [name, setName] = useState("");
  const [email, setEmail] = useState(inviteEmail ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeRequired, setCodeRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Decide between first-run owner setup and normal sign-in.
  useEffect(() => {
    if (inviteToken) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();
        if (!active) return;
        if (!data.hasOwner) setMode("signup");
        setCodeRequired(Boolean(data.signupCodeRequired));
      } catch {
        /* default to login */
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [inviteToken]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint =
        mode === "signup"
          ? "/api/auth/signup"
          : mode === "accept"
            ? "/api/auth/accept"
            : "/api/auth/login";

      const payload =
        mode === "signup"
          ? { name, email, password, code }
          : mode === "accept"
            ? { name, email: inviteEmail, token: inviteToken, password }
            : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong. Please try again.");

      // Stamp the login time so the notification bell only surfaces activity
      // that happens during this session.
      try { localStorage.setItem("ffkc-login-at", String(Date.now())); } catch { /* ignore */ }

      const dest = next && next.startsWith("/") ? next : homeFor(data.user?.role ?? "coach");
      // Full navigation so the app reloads with the new session cookie.
      window.location.assign(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  const heading =
    mode === "signup" ? "Set up your gym" : mode === "accept" ? "Accept your invitation" : "Welcome back";
  const subheading =
    mode === "signup"
      ? "Create the owner account for your coaching platform."
      : mode === "accept"
        ? "Choose a password to activate your account."
        : "Sign in to your coaching platform";
  const cta = mode === "signup" ? "Create account" : mode === "accept" ? "Activate account" : "Sign in";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-orange-500 shadow-glow">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none">
              <path d="M6.5 9v6M9.5 7v10M14.5 7v10M17.5 9v6M4 12h2M18 12h2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-900">
            Fitness Factory <span className="text-brand-500">KC</span>
          </h1>
          <p className="mt-1 text-sm text-ink-500">{subheading}</p>
        </div>

        <div className="card p-6 sm:p-7">
          <h2 className="mb-5 text-lg font-semibold text-ink-900">{heading}</h2>

          {!ready ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {(mode === "signup" || mode === "accept") && (
                <div>
                  <label className="label" htmlFor="name">Full name</label>
                  <input
                    id="name" required
                    value={name} onChange={(e) => setName(e.target.value)}
                    className="input" placeholder="Your name"
                  />
                </div>
              )}

              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email" type="email" required
                  value={mode === "accept" ? inviteEmail ?? "" : email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={mode === "accept"}
                  className="input disabled:opacity-60"
                  placeholder="you@fitnessfactorykc.com"
                />
              </div>

              <div>
                <label className="label" htmlFor="password">
                  {mode === "login" ? "Password" : "Create a password"}
                </label>
                <input
                  id="password" type="password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input" placeholder="••••••••"
                  minLength={mode === "login" ? undefined : 8}
                />
                {mode !== "login" && (
                  <p className="mt-1 text-xs text-ink-400">At least 8 characters.</p>
                )}
              </div>

              {mode === "signup" && codeRequired && (
                <div>
                  <label className="label" htmlFor="code">Setup code</label>
                  <input
                    id="code" required
                    value={code} onChange={(e) => setCode(e.target.value)}
                    className="input" placeholder="Enter the owner setup code"
                  />
                  <p className="mt-1 text-xs text-ink-400">
                    Required to create the owner account.
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{cta} <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {ready && mode !== "accept" && (
            <div className="mt-4 text-center text-xs text-ink-400">
              {mode === "login" ? (
                <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="text-brand-400 hover:text-brand-500">
                  Owner? Set up your account
                </button>
              ) : (
                <>
                  <p>Owner accounts are limited to authorized emails. Everyone else joins by invitation.</p>
                  <button type="button" onClick={() => { setMode("login"); setError(null); }} className="mt-1 text-brand-400 hover:text-brand-500">
                    Back to sign in
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {ready && mode === "login" && (
          <p className="mt-4 text-center text-xs text-ink-400">
            Are you a client?{" "}
            <Link href="/client-login" className="text-brand-400 hover:text-brand-500">
              Sign in to your client portal
            </Link>
          </p>
        )}

        <p className="mt-6 text-center text-xs text-ink-400">
          © {new Date().getFullYear()} Fitness Factory KC
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
