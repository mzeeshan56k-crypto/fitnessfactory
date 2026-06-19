"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  HeartPulse, Moon, Droplets, StretchHorizontal, BedDouble,
  UserPlus, Sparkles, CalendarOff, Activity,
} from "lucide-react";
import { EmptyState } from "@/components/ui/Modal";
import { FatigueHeatMap } from "@/components/FatigueHeatMap";
import { useApp, useCurrentClient } from "@/lib/store";
import { recoveryHeatmap, sleepData } from "@/lib/platform";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function avgSleepHours() {
  const total = sleepData.reduce(
    (a, n) => a + n.rem + n.deep + n.light + n.awake,
    0,
  );
  return total / sleepData.length;
}

function dayFatigue() {
  return DAYS.map((_, c) =>
    recoveryHeatmap.reduce((acc, row) => acc + (row[c] ?? 0), 0),
  );
}

export default function ClientRecoveryPage() {
  const app = useApp();
  const client = useCurrentClient();

  // Appointment-free days ranked by highest accumulated fatigue.
  const recommended = useMemo(() => {
    if (!client) return [];
    const booked = new Set(
      app.appointments.filter((a) => a.clientId === client.id).map((a) => a.day),
    );
    const free = DAYS.map((_, i) => i).filter((i) => !booked.has(i));
    const fatigue = dayFatigue();
    return free.sort((a, b) => fatigue[b] - fatigue[a]).slice(0, 2);
  }, [app.appointments, client]);

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <EmptyState
        icon={UserPlus}
        title="No client selected"
        description="Add a client in the Trainer portal, then preview their recovery here."
        action={<Link href="/dashboard/clients" className="btn-primary">Go to Clients</Link>}
      />
    );
  }

  const sleepAvg = avgSleepHours();
  // Readiness 0–100: sleep-weighted with a deterministic adherence component.
  const sleepScore = Math.min(100, Math.round((sleepAvg / 8.5) * 100));
  const readiness = Math.max(
    0,
    Math.min(100, Math.round(sleepScore * 0.6 + (client.adherence || 50) * 0.4)),
  );
  const band =
    readiness >= 80 ? "OPTIMAL" : readiness >= 60 ? "MODERATE" : "LOW";
  const bandTint =
    band === "OPTIMAL"
      ? "text-accent-300"
      : band === "MODERATE"
        ? "text-amber-300"
        : "text-brand-200";

  const recLabels = recommended.map((d) => DAYS[d]);

  return (
    <div className="space-y-6">
      {/* Readiness hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <div className="flex items-center gap-2 text-sm text-brand-100">
          <HeartPulse className="h-4 w-4" /> Recovery & readiness
        </div>
        <h1 className="mt-1 text-2xl font-bold">Today you&apos;re ready to train</h1>
        <div className="mt-5 flex items-center gap-5 rounded-2xl bg-white/15 p-5 backdrop-blur">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/15">
            <span className="text-3xl font-bold">{readiness}</span>
          </div>
          <div>
            <div className={cn("text-lg font-bold", bandTint)}>{band}</div>
            <p className="text-sm text-brand-100">
              Readiness from {sleepAvg.toFixed(1)} h avg sleep and {client.adherence}% adherence.
            </p>
          </div>
        </div>
      </section>

      {/* Fatigue heat map */}
      <section className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-semibold text-ink-900">Your fatigue map</h2>
            <p className="text-xs text-ink-400">Where your body has worked hardest</p>
          </div>
        </div>
        <FatigueHeatMap />
      </section>

      {/* Suggested rest days */}
      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
            <CalendarOff className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-semibold text-ink-900">Suggested rest & non-training days</h2>
            <p className="text-xs text-ink-400">Built around your schedule & fatigue</p>
          </div>
        </div>

        {recLabels.length ? (
          <>
            <div className="flex flex-wrap gap-2">
              {recLabels.map((d) => (
                <span
                  key={d}
                  className="flex items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1.5 text-sm font-semibold text-brand-400"
                >
                  <BedDouble className="h-4 w-4" /> {d}
                </span>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 text-sm text-ink-700">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <span>
                You have nothing booked on {recLabels.join(" and ")}, and that&apos;s exactly when your
                fatigue is highest. Take those as full rest days — sleep in, hydrate, and let your
                muscles rebuild. You&apos;ll come back stronger. 💪
              </span>
            </p>
          </>
        ) : (
          <p className="rounded-2xl border border-ink-100 bg-ink-50 p-4 text-sm text-ink-500">
            Your week is fully scheduled. Try to keep one session light and prioritize sleep so you
            recover between training days.
          </p>
        )}
      </section>

      {/* Recovery protocol tips */}
      <section className="card p-5">
        <h2 className="font-semibold text-ink-900">Recovery tips</h2>
        <div className="mt-4 divide-y divide-ink-100">
          <Tip icon={BedDouble} title="Aim for 8–9 hours" detail="Consistent sleep is your #1 recovery tool." tint="text-accent-400" />
          <Tip icon={Moon} title="Wind down early" detail="Dim screens 45 min before bed for deeper sleep." tint="text-brand-400" />
          <Tip icon={Droplets} title="Hydrate well" detail="2.5–3 L water plus electrolytes on training days." tint="text-brand-400" />
          <Tip icon={StretchHorizontal} title="Move on rest days" detail="10–15 min of light mobility keeps you loose." tint="text-amber-400" />
        </div>
      </section>
    </div>
  );
}

function Tip({
  icon: Icon, title, detail, tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  tint: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-50", tint)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <div className="text-sm font-medium text-ink-900">{title}</div>
        <div className="text-xs text-ink-500">{detail}</div>
      </div>
    </div>
  );
}
