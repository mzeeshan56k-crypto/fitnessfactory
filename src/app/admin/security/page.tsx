"use client";

import {
  ShieldCheck, Lock, KeyRound, EyeOff, Filter, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useLocalState } from "@/lib/useLocalState";
import { securityControls, auditLog } from "@/lib/platform";
import { cn } from "@/lib/utils";

type SecurityControl = {
  id: string;
  name: string;
  desc: string;
  on: boolean;
};

const layers = [
  {
    name: "Multi-Factor Authentication",
    desc: "Second-factor verification required for all privileged logins.",
    icon: KeyRound,
    status: "Enforced",
  },
  {
    name: "End-to-end encryption",
    desc: "Health metrics and PII encrypted at rest and in transit.",
    icon: Lock,
    status: "Active",
  },
  {
    name: "Zero-knowledge storage",
    desc: "Biometric data sealed with client-held keys — staff cannot decrypt.",
    icon: EyeOff,
    status: "Sealed",
  },
];

const rawFields = ["full_name", "email", "phone", "dob", "weight", "rpe", "sleep_hours"];
const redactedFields = ["[REDACTED]", "[REDACTED]", "[REDACTED]", "[REDACTED]", "weight", "rpe", "sleep_hours"];

export default function SecurityPage() {
  const [controls, setControls] = useLocalState<SecurityControl[]>(
    "ffkc-security",
    securityControls,
  );

  function toggle(id: string) {
    setControls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, on: !c.on } : c)),
    );
  }

  return (
    <>
      <PageHeader
        title="Security & PII governance"
        subtitle="Three-layer protection and compliance controls for sensitive data"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent-400" />
            <h2 className="font-semibold text-ink-900">Security controls</h2>
          </div>
          <p className="mt-1 text-sm text-ink-500">Toggle platform-wide protections</p>
          <div className="mt-5 space-y-3">
            {controls.map((c) => (
              <div key={c.id} className="flex items-start gap-3 rounded-xl border border-ink-100 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                  <Lock className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink-900">{c.name}</div>
                  <div className="text-xs text-ink-500">{c.desc}</div>
                </div>
                <button
                  role="switch"
                  aria-checked={c.on}
                  onClick={() => toggle(c.id)}
                  className={cn(
                    "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                    c.on ? "bg-accent-500" : "bg-ink-200",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-ink-100 shadow transition-transform",
                      c.on ? "translate-x-5" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-ink-900">3-layer protection</h2>
          {layers.map((l) => (
            <div key={l.name} className="card flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                <l.icon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="font-semibold text-ink-900">{l.name}</div>
                <div className="text-xs text-ink-500">{l.desc}</div>
              </div>
              <span className="badge bg-accent-500/15 text-accent-400">{l.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 card p-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-brand-400" />
          <h2 className="font-semibold text-ink-900">PII compliance filter</h2>
        </div>
        <p className="mt-1 text-sm text-ink-500">
          Strips sensitive identifiers from every payload before it leaves the platform
          for an external AI or third-party API call.
        </p>
        <div className="mt-5 grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-400">
              Raw record
            </div>
            <div className="flex flex-wrap gap-1.5">
              {rawFields.map((f) => (
                <code key={f} className="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-700 ring-1 ring-rose-100">
                  {f}
                </code>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-ink-400" />
          </div>
          <div className="rounded-xl border border-accent-100 bg-accent-50/50 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-400">
              Sent to AI
            </div>
            <div className="flex flex-wrap gap-1.5">
              {redactedFields.map((f, i) => (
                <code
                  key={i}
                  className={cn(
                    "rounded px-2 py-0.5 text-xs ring-1",
                    f === "[REDACTED]"
                      ? "bg-ink-100 text-ink-400 ring-ink-200"
                      : "bg-ink-100 text-ink-700 ring-accent-100",
                  )}
                >
                  {f}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6">
        <h2 className="font-semibold text-ink-900">Audit log</h2>
        <p className="text-sm text-ink-500">Immutable record of privileged actions</p>
        <div className="mt-4 overflow-x-auto scroll-thin">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="pb-3 font-medium">Actor</th>
                <th className="pb-3 font-medium">Action</th>
                <th className="pb-3 font-medium">Target</th>
                <th className="pb-3 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((a) => (
                <tr key={a.id} className="border-b border-ink-50 last:border-0">
                  <td className="py-3 font-medium text-ink-900">{a.actor}</td>
                  <td className="py-3 text-ink-700">{a.action}</td>
                  <td className="py-3">
                    <code className="rounded bg-ink-50 px-2 py-0.5 text-xs text-ink-600">{a.target}</code>
                  </td>
                  <td className="py-3 text-right text-ink-400">{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
