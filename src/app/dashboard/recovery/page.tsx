"use client";

import { useMemo, useState } from "react";
import {
  HeartPulse, Activity, Moon, Apple, CalendarCheck2, Sparkles,
  Droplets, Dumbbell, StretchHorizontal, BedDouble, AlertTriangle, Users,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Modal";
import { FatigueHeatMap } from "@/components/FatigueHeatMap";
import { useApp } from "@/lib/store";
import { askAI, aiConfigured } from "@/lib/ai";
import { recoveryMuscles, recoveryHeatmap, sleepData } from "@/lib/platform";
import type { Client } from "@/lib/data";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Average nightly sleep hours from the biometric feed.
function avgSleepHours() {
  const total = sleepData.reduce(
    (a, n) => a + n.rem + n.deep + n.light + n.awake,
    0,
  );
  return total / sleepData.length;
}

// Deterministic weekly training volume derived from the client persona.
function weeklyVolume(client: Client) {
  const base = 28000;
  const adherenceFactor = (client.adherence || 50) / 100;
  const weightFactor = (client.currentWeight || 160) * 90;
  return Math.round((base + weightFactor) * (0.6 + adherenceFactor * 0.6));
}

// Per-day total fatigue across all muscles (column sums of the heatmap).
function dayFatigue() {
  return DAYS.map((_, c) =>
    recoveryHeatmap.reduce((acc, row) => acc + (row[c] ?? 0), 0),
  );
}

export default function CoachRecoveryPage() {
  const app = useApp();
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const client =
    app.clients.find((c) => c.id === clientId) ?? app.clients[0] ?? null;

  // Recovery note persists in the shared workspace, keyed by client.
  const note = client ? app.recoveryNotes[client.id] ?? "" : "";
  const setNote = (text: string) => {
    if (client) app.setRecoveryNote(client.id, text);
  };

  // Days (Mon–Sun) with NO appointment for this client.
  const freeDays = useMemo(() => {
    if (!client) return [];
    const booked = new Set(
      app.appointments
        .filter((a) => a.clientId === client.id)
        .map((a) => a.day),
    );
    return DAYS.map((_, i) => i).filter((i) => !booked.has(i));
  }, [app.appointments, client]);

  const sessionsThisWeek = useMemo(
    () =>
      client
        ? app.appointments.filter((a) => a.clientId === client.id).length
        : 0,
    [app.appointments, client],
  );

  const volume = client ? weeklyVolume(client) : 0;
  const sleepAvg = avgSleepHours();

  // Recommended off-days: free days ranked by highest accumulated fatigue.
  const recommended = useMemo(() => {
    const fatigue = dayFatigue();
    return [...freeDays]
      .sort((a, b) => fatigue[b] - fatigue[a])
      .slice(0, 2);
  }, [freeDays]);

  async function generate() {
    if (!client) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const recDays = recommended.map((d) => DAYS[d]);
    const freeLabels = freeDays.map((d) => DAYS[d]);
    const dataSummary =
      `Client: ${client.name} (goal: ${client.goal}).\n` +
      `Weekly training volume: ${volume.toLocaleString()} lb.\n` +
      `Average sleep: ${sleepAvg.toFixed(1)} h/night.\n` +
      `Nutrition adherence: ${client.adherence}%.\n` +
      `Scheduled sessions this week: ${sessionsThisWeek}.\n` +
      `Appointment-free weekdays: ${freeLabels.join(", ") || "none"}.\n` +
      `Highest-fatigue free days (candidate off-days): ${recDays.join(", ") || "none"}.`;

    try {
      if (aiConfigured(app.settings)) {
        const system =
          "You are a strength & conditioning coach. Recommend recovery and off-day scheduling. " +
          "Only suggest rest on days that have NO scheduled appointment. Be concise and specific.";
        const text = await askAI(
          app.settings,
          [
            {
              role: "user",
              content:
                `Using this recorded data, recommend 1–2 specific rest/off-days and a short recovery plan ` +
                `(sleep, hydration, deload, mobility). Do not put rest on days with appointments.\n\n${dataSummary}`,
            },
          ],
          system,
        );
        setResult(text);
      } else {
        setResult(localSuggestion(client.name, recDays, sleepAvg, volume, client.adherence));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate suggestions.");
    } finally {
      setLoading(false);
    }
  }

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );
  }

  if (app.clients.length === 0 || !client) {
    return (
      <>
        <PageHeader
          title="Recovery & Readiness"
          subtitle="Plan deloads and off-days from recorded client data"
        />
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add a client to plan their recovery, fatigue and off-days."
        />
      </>
    );
  }

  const recDayLabels = recommended.map((d) => DAYS[d]);

  return (
    <>
      <PageHeader
        title="Recovery & Readiness"
        subtitle="Plan deloads and off-days from recorded client data"
      />

      {/* Client picker */}
      <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
        <Avatar initials={client.avatar} size="md" />
        <div className="mr-auto">
          <div className="font-semibold text-ink-900">{client.name}</div>
          <div className="text-xs text-ink-500">{client.goal} · {client.program}</div>
        </div>
        <label className="label sr-only" htmlFor="rec-client">Client</label>
        <select
          id="rec-client"
          className="input w-full sm:w-56"
          value={client.id}
          onChange={(e) => { setClientId(e.target.value); setResult(null); setError(null); }}
        >
          {app.clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Recorded data summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Weekly volume"
          value={`${volume.toLocaleString()} lb`}
          tint="text-brand-400 bg-brand-500/15"
        />
        <StatCard
          icon={Moon}
          label="Avg sleep"
          value={`${sleepAvg.toFixed(1)} h`}
          tint="text-accent-400 bg-accent-500/15"
        />
        <StatCard
          icon={Apple}
          label="Nutrition adherence"
          value={`${client.adherence}%`}
          tint="text-amber-400 bg-amber-500/15"
        />
        <StatCard
          icon={CalendarCheck2}
          label="Sessions this week"
          value={`${sessionsThisWeek}`}
          tint="text-brand-400 bg-brand-500/15"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Heat map */}
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-semibold text-ink-900">Fatigue heat map</h2>
              <p className="text-xs text-ink-400">Muscle load over the last 7 days</p>
            </div>
          </div>
          <FatigueHeatMap muscles={recoveryMuscles} data={recoveryHeatmap} />
        </section>

        {/* Recovery protocol */}
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
              <HeartPulse className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-semibold text-ink-900">Recovery protocol</h2>
              <p className="text-xs text-ink-400">Baseline guidance for this client</p>
            </div>
          </div>
          <div className="divide-y divide-ink-100">
            <ProtocolRow icon={BedDouble} title="Sleep target" detail="8–9 h/night · consistent wake time" tint="text-accent-400" />
            <ProtocolRow icon={Droplets} title="Hydration" detail={`${Math.max(2.5, Math.round((client.currentWeight || 160) / 50 * 10) / 10)} L/day + electrolytes`} tint="text-brand-400" />
            <ProtocolRow icon={Dumbbell} title="Deload" detail={client.adherence > 85 ? "Cut volume 40% every 4th week" : "Insert deload now — adherence trending low"} tint="text-amber-400" />
            <ProtocolRow icon={StretchHorizontal} title="Mobility" detail="2× 15-min mobility flows on off-days" tint="text-brand-400" />
          </div>
        </section>
      </div>

      {/* AI recovery & off-day suggestions */}
      <section className="card mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-semibold text-ink-900">AI recovery & off-day suggestions</h2>
              <p className="text-xs text-ink-400">
                Suggests rest only on appointment-free days
              </p>
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={generate} disabled={loading}>
            <Sparkles className="h-4 w-4" />
            {loading ? "Generating…" : "Generate suggestions"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
          <span className="font-medium text-ink-600">Appointment-free days:</span>
          {freeDays.length ? (
            freeDays.map((d) => (
              <span key={d} className="badge bg-ink-50 text-ink-600">{DAYS[d]}</span>
            ))
          ) : (
            <span className="text-ink-400">none — fully booked this week</span>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-400">
              <HeartPulse className="h-4 w-4" />
              Recommended off-days: {recDayLabels.join(" & ") || "—"}
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink-700">{result}</p>
          </div>
        )}

        <div className="mt-5">
          <label className="label" htmlFor="rec-note">Coach note (saved locally)</label>
          <textarea
            id="rec-note"
            className="input min-h-[72px] resize-y"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Pin a recovery note for this client…"
          />
        </div>
      </section>
    </>
  );
}

function localSuggestion(
  name: string,
  recDays: string[],
  sleepAvg: number,
  volume: number,
  adherence: number,
) {
  const days = recDays.length
    ? recDays.join(" and ")
    : "the lightest scheduled day";
  const sleepNote =
    sleepAvg < 7
      ? `Sleep is averaging ${sleepAvg.toFixed(1)} h — prioritize an earlier bedtime to hit 8 h.`
      : `Sleep looks solid at ${sleepAvg.toFixed(1)} h/night — maintain the routine.`;
  const deloadNote =
    volume > 45000 || adherence < 70
      ? "Weekly volume is high relative to recovery markers — schedule a deload (−40% volume) next block."
      : "Volume is well within recovery capacity — keep progressing.";
  return (
    `Recommended off-days for ${name}: ${days}. These weekdays have no scheduled appointments and ` +
    `carry the highest accumulated fatigue, so full rest there maximizes recovery without moving sessions.\n\n` +
    `• ${sleepNote}\n` +
    `• Hydration: 2.5–3 L water + electrolytes on training days.\n` +
    `• ${deloadNote}\n` +
    `• Add 10–15 min of mobility/foam-rolling on each off-day to aid tissue recovery.`
  );
}

function StatCard({
  icon: Icon, label, value, tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tint: string;
}) {
  const [text, bg] = tint.split(" ");
  return (
    <div className="card p-4">
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", text, bg)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="mt-3 text-xl font-bold text-ink-900">{value}</div>
      <div className="text-xs text-ink-400">{label}</div>
    </div>
  );
}

function ProtocolRow({
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
