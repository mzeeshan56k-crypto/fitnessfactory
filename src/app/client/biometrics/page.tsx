"use client";

import Link from "next/link";
import { Activity, HeartPulse, Moon, FlaskConical, Zap, UserPlus } from "lucide-react";
import { SleepChart } from "@/components/dashboard/Charts";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useLocalState } from "@/lib/useLocalState";
import { useApp, useCurrentClient } from "@/lib/store";
import { EmptyState } from "@/components/ui/Modal";
import { sleepData, recoveryMuscles, recoveryHeatmap, bloodwork } from "@/lib/platform";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const intensityClass = [
  "bg-ink-100 text-ink-400",
  "bg-brand-500/20 text-brand-400",
  "bg-brand-200 text-brand-400",
  "bg-brand-400 text-white",
  "bg-gradient-to-br from-brand-600 to-accent-500 text-white",
];

const statusBadge: Record<string, string> = {
  optimal: "bg-accent-500/15 text-accent-400",
  normal: "bg-brand-500/15 text-brand-400",
  watch: "bg-amber-500/15 text-amber-400",
};

export default function BiometricsPage() {
  const app = useApp();
  const client = useCurrentClient();
  const [labReport, setLabReport, labReportHydrated] = useLocalState<string | undefined>(
    "ffkc-labs",
    undefined,
  );

  if (!app.hydrated)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );

  if (!client)
    return (
      <EmptyState
        icon={UserPlus}
        title="No client selected"
        description="Add a client in the Trainer portal, then preview their experience here."
        action={<Link href="/dashboard/clients" className="btn-primary">Go to Clients</Link>}
      />
    );

  const last = sleepData[sleepData.length - 1];
  const total = last.rem + last.deep + last.light + last.awake;
  const remPct = Math.round((last.rem / total) * 100);
  const deepPct = Math.round((last.deep / total) * 100);

  const readiness = 82;
  const readinessInputs = [
    { icon: HeartPulse, label: "HRV", value: "68 ms", tint: "text-accent-400 bg-accent-500/15" },
    { icon: Activity, label: "Resting HR", value: "54 bpm", tint: "text-brand-400 bg-brand-500/15" },
    { icon: Zap, label: "Soreness", value: "Low", tint: "text-amber-400 bg-amber-500/15" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <p className="text-sm text-brand-100">Your body, decoded</p>
        <h1 className="text-2xl font-bold">Progress &amp; Biometrics</h1>
        <p className="mt-1 text-sm text-brand-100">
          Sleep, recovery load, readiness and lab markers — all in one place.
        </p>
      </section>

      {!app.seeded && (
        <EmptyState
          icon={Activity}
          title="No biometric data yet"
          description="Connect a wearable or log biometrics to see sleep, recovery and lab markers here."
        />
      )}

      {app.seeded && (
      <>
      {/* Sleep architecture */}
      <section className="card p-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
            <Moon className="h-4 w-4" />
          </span>
          <h2 className="font-semibold text-ink-900">Sleep architecture</h2>
        </div>
        <p className="mb-3 text-sm text-ink-500">Stacked stages over the last 7 nights.</p>

        <SleepChart data={sleepData} />

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-500">
          <LegendDot color="bg-[#194b8f]" label="Deep" />
          <LegendDot color="bg-[#1b82f5]" label="REM" />
          <LegendDot color="bg-[#8ed8ff]" label="Light" />
          <LegendDot color="bg-ink-200" label="Awake" />
        </div>

        {/* Last-night summary */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <SummaryStat label="Total sleep" value={`${total.toFixed(1)}h`} />
          <SummaryStat label="REM" value={`${remPct}%`} />
          <SummaryStat label="Deep" value={`${deepPct}%`} />
        </div>
      </section>

      {/* Muscle recovery / volume heatmap */}
      <section className="card p-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
            <Activity className="h-4 w-4" />
          </span>
          <h2 className="font-semibold text-ink-900">Muscle recovery &amp; volume</h2>
        </div>
        <p className="mb-4 text-sm text-ink-500">Training load by muscle group over the last 7 days.</p>

        <div className="overflow-x-auto scroll-thin">
          <div className="min-w-[420px]">
            {/* Day header */}
            <div className="mb-1.5 flex items-center gap-1.5 pl-[88px]">
              {days.map((d) => (
                <div key={d} className="flex-1 text-center text-[11px] font-medium text-ink-400">
                  {d}
                </div>
              ))}
            </div>
            {/* Rows */}
            <div className="space-y-1.5">
              {recoveryMuscles.map((muscle, r) => (
                <div key={muscle} className="flex items-center gap-1.5">
                  <div className="w-[82px] shrink-0 text-xs font-medium text-ink-700">{muscle}</div>
                  {recoveryHeatmap[r].map((v, c) => (
                    <div
                      key={c}
                      title={`${muscle} · ${days[c]} · load ${v}`}
                      className={`flex aspect-square flex-1 items-center justify-center rounded-md text-[10px] font-semibold ${intensityClass[v]}`}
                    >
                      {v > 0 ? v : ""}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-2 text-xs text-ink-400">
          <span>Less</span>
          {intensityClass.map((c, i) => (
            <span key={i} className={`h-4 w-4 rounded ${c.split(" ")[0]}`} />
          ))}
          <span>More</span>
        </div>
      </section>

      {/* Recovery readiness */}
      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-ink-900">Recovery readiness</h2>
        <div className="flex items-center gap-5">
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
            <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#eceef2" strokeWidth="3.5" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={`${(readiness / 100) * 2 * Math.PI * 15.5} ${2 * Math.PI * 15.5}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-ink-900">{readiness}</span>
              <span className="text-[10px] uppercase tracking-wide text-ink-400">/ 100</span>
            </div>
          </div>
          <div className="flex-1 space-y-2.5">
            {readinessInputs.map((m) => {
              const [text, bg] = m.tint.split(" ");
              return (
                <div key={m.label} className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${text}`}>
                    <m.icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm text-ink-600">{m.label}</span>
                  <span className="text-sm font-semibold text-ink-900">{m.value}</span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-4 rounded-xl bg-accent-500/15 p-3 text-sm text-accent-400">
          You&apos;re primed for a hard session today — push your top sets.
        </p>
      </section>

      {/* Lab portal — bloodwork */}
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
              <FlaskConical className="h-4 w-4" />
            </span>
            <h2 className="font-semibold text-ink-900">Lab portal — bloodwork</h2>
          </div>
        </div>

        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="pb-2 font-medium">Marker</th>
                <th className="pb-2 font-medium">Value</th>
                <th className="pb-2 font-medium">Range</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bloodwork.map((m) => (
                <tr key={m.name} className="border-b border-ink-50 last:border-0">
                  <td className="py-2.5 font-medium text-ink-900">{m.name}</td>
                  <td className="py-2.5 text-ink-700">{m.value}</td>
                  <td className="py-2.5 text-ink-500">{m.range}</td>
                  <td className="py-2.5">
                    <span className={`badge ${statusBadge[m.status]}`}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </>
      )}

      {/* Lab report upload — always available */}
      <section className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
              <FlaskConical className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold text-ink-900">Your lab reports</h3>
          </div>
          {labReportHydrated && labReport && (
            <span className="badge bg-accent-500/15 text-accent-400">Attached</span>
          )}
        </div>
        <p className="mb-3 text-xs text-ink-400">
          Attach a photo or screenshot of your latest bloodwork for your coach to review.
        </p>
        {labReportHydrated && (
          <ImageUpload
            value={labReport}
            aspect="video"
            label="Upload lab report"
            onChange={setLabReport}
          />
        )}
      </section>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 p-3 text-center">
      <div className="text-lg font-bold text-ink-900">{value}</div>
      <div className="text-[11px] text-ink-400">{label}</div>
    </div>
  );
}
