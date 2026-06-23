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
import { useApp, useMyClients } from "@/lib/store";
import { askAI, aiConfigured } from "@/lib/ai";
import type { Workout } from "@/lib/data";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];

// Map a specific muscle to one of the broad heatmap groups.
function muscleGroup(m: string): number {
  const s = m.toLowerCase();
  if (/(chest|pec)/.test(s)) return 0;
  if (/(back|lat|trap|row|spine|posterior)/.test(s)) return 1;
  if (/(quad|glute|hamstring|calf|calves|leg|hip)/.test(s)) return 2;
  if (/(shoulder|delt)/.test(s)) return 3;
  if (/(bicep|tricep|arm|forearm)/.test(s)) return 4;
  if (/(core|ab|oblique)/.test(s)) return 5;
  return -1;
}

// Build a muscle × day fatigue matrix from the client's logged sessions
// (last 7 days), using the workout library to know which muscles were trained.
function buildHeatmap(
  sessions: { workoutId: string; date: string }[],
  byId: Record<string, Workout>,
) {
  const counts = GROUPS.map(() => Array(7).fill(0));
  const cutoff = Date.now() - 7 * 864e5;
  sessions.forEach((s) => {
    const t = new Date(s.date).getTime();
    if (t < cutoff) return;
    const col = (new Date(s.date).getDay() + 6) % 7;
    const w = byId[s.workoutId];
    if (!w) return;
    w.exercises.forEach((ex) => {
      const g = muscleGroup(ex.muscle);
      if (g >= 0) counts[g][col] += ex.sets.length;
    });
  });
  // Normalise set counts to 0–4 intensity.
  const data = counts.map((row) => row.map((v) => (v === 0 ? 0 : Math.min(4, Math.ceil(v / 3)))));
  return data;
}

export default function CoachRecoveryPage() {
  const app = useApp();
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const myClients = useMyClients();
  const client = myClients.find((c) => c.id === clientId) ?? myClients[0] ?? null;

  const byId = useMemo(
    () => Object.fromEntries(app.workouts.map((w) => [w.id, w])),
    [app.workouts],
  );

  const recentSessions = useMemo(() => {
    if (!client) return [];
    const cutoff = Date.now() - 7 * 864e5;
    return (app.completions[client.id] ?? []).filter((s) => new Date(s.date).getTime() >= cutoff);
  }, [app.completions, client]);

  const heatmap = useMemo(() => buildHeatmap(recentSessions, byId), [recentSessions, byId]);

  const volume = recentSessions.reduce((a, s) => a + (s.volume || 0), 0);
  const checkins = client ? app.checkins.filter((c) => c.clientId === client.id) : [];
  const latestSleep = checkins.map((c) => c.answers.sleep).find((v) => v !== undefined && v !== "");
  const nutrition = client ? app.nutritionLogs[client.id] : undefined;

  const freeDays = useMemo(() => {
    if (!client) return [];
    const booked = new Set(app.appointments.filter((a) => a.clientId === client.id).map((a) => a.day));
    // Also treat days they trained this week as "used".
    recentSessions.forEach((s) => booked.add((new Date(s.date).getDay() + 6) % 7));
    return DAYS.map((_, i) => i).filter((i) => !booked.has(i));
  }, [app.appointments, client, recentSessions]);

  const dayLoad = DAYS.map((_, c) => heatmap.reduce((acc, row) => acc + (row[c] ?? 0), 0));
  const recommended = useMemo(
    () => [...freeDays].sort((a, b) => dayLoad[b] - dayLoad[a]).slice(0, 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [freeDays, heatmap],
  );

  async function generate() {
    if (!client) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const recDays = recommended.map((d) => DAYS[d]);
    const summary =
      `Client: ${client.name} (goal: ${client.goal}).\n` +
      `Sessions logged in the last 7 days: ${recentSessions.length}.\n` +
      `Total training volume: ${volume.toLocaleString()} lb.\n` +
      `Latest sleep quality: ${latestSleep ? `${latestSleep}/5` : "not reported"}.\n` +
      `Appointment-free days: ${freeDays.map((d) => DAYS[d]).join(", ") || "none"}.\n` +
      `Suggested off-days: ${recDays.join(", ") || "none"}.`;
    try {
      if (aiConfigured(app.settings)) {
        const text = await askAI(
          app.settings,
          [{ role: "user", content: `Using this recorded data, recommend 1–2 rest/off-days and a short recovery plan (sleep, hydration, deload, mobility). Don't put rest on days with appointments.\n\n${summary}` }],
          "You are a strength & conditioning coach. Be concise and specific.",
        );
        setResult(text);
      } else {
        setResult(localSuggestion(client.name, recDays, latestSleep, volume, recentSessions.length));
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

  if (myClients.length === 0 || !client) {
    return (
      <>
        <PageHeader title="Recovery & Readiness" subtitle="Plan deloads and off-days from recorded client data" />
        <EmptyState icon={Users} title="No clients yet" description="Add a client to plan their recovery, fatigue and off-days." />
      </>
    );
  }

  const recDayLabels = recommended.map((d) => DAYS[d]);
  const hasData = recentSessions.length > 0;

  return (
    <>
      <PageHeader title="Recovery & Readiness" subtitle="Plan deloads and off-days from recorded client data" />

      {/* Client picker */}
      <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
        <Avatar initials={client.avatar} size="md" />
        <div className="mr-auto">
          <div className="font-semibold text-ink-900">{client.name}</div>
          <div className="text-xs text-ink-500">{client.goal} · {client.program}</div>
        </div>
        <select
          className="input w-full sm:w-56"
          value={client.id}
          onChange={(e) => { setClientId(e.target.value); setResult(null); setError(null); }}
        >
          {myClients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
      </div>

      {/* Recorded data summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Activity} label="Weekly volume" value={volume ? `${volume.toLocaleString()} lb` : "—"} tint="text-brand-400 bg-brand-500/15" />
        <StatCard icon={CalendarCheck2} label="Sessions (7d)" value={`${recentSessions.length}`} tint="text-brand-400 bg-brand-500/15" />
        <StatCard icon={Moon} label="Sleep quality" value={latestSleep ? `${latestSleep}/5` : "—"} tint="text-accent-400 bg-accent-500/15" />
        <StatCard icon={Apple} label="Water today" value={nutrition ? `${nutrition.water} glasses` : "—"} tint="text-amber-400 bg-amber-500/15" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Heat map */}
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400"><Activity className="h-4 w-4" /></span>
            <div>
              <h2 className="font-semibold text-ink-900">Fatigue heat map</h2>
              <p className="text-xs text-ink-400">{client.name.split(" ")[0]}&rsquo;s muscle load over the last 7 days</p>
            </div>
          </div>
          {hasData ? (
            <FatigueHeatMap muscles={GROUPS} data={heatmap} />
          ) : (
            <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm text-ink-400">
              No sessions logged this week yet — the heat map fills in as {client.name.split(" ")[0]} completes workouts.
            </p>
          )}
        </section>

        {/* Recovery protocol */}
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400"><HeartPulse className="h-4 w-4" /></span>
            <div>
              <h2 className="font-semibold text-ink-900">Recovery protocol</h2>
              <p className="text-xs text-ink-400">Baseline guidance for this client</p>
            </div>
          </div>
          <div className="divide-y divide-ink-100">
            <ProtocolRow icon={BedDouble} title="Sleep target" detail="8–9 h/night · consistent wake time" tint="text-accent-400" />
            <ProtocolRow icon={Droplets} title="Hydration" detail={`${Math.max(2.5, Math.round((client.currentWeight || 160) / 50 * 10) / 10)} L/day + electrolytes`} tint="text-brand-400" />
            <ProtocolRow icon={Dumbbell} title="Deload" detail={recentSessions.length >= 5 ? "High weekly frequency — consider a deload soon" : "Volume within recovery capacity — keep progressing"} tint="text-amber-400" />
            <ProtocolRow icon={StretchHorizontal} title="Mobility" detail="2× 15-min mobility flows on off-days" tint="text-brand-400" />
          </div>
        </section>
      </div>

      {/* AI recovery & off-day suggestions */}
      <section className="card mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400"><Sparkles className="h-4 w-4" /></span>
            <div>
              <h2 className="font-semibold text-ink-900">AI recovery & off-day suggestions</h2>
              <p className="text-xs text-ink-400">Suggests rest only on appointment-free days</p>
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={generate} disabled={loading}>
            <Sparkles className="h-4 w-4" />{loading ? "Generating…" : "Generate suggestions"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
          <span className="font-medium text-ink-600">Appointment-free days:</span>
          {freeDays.length ? (
            freeDays.map((d) => (<span key={d} className="badge bg-ink-50 text-ink-600">{DAYS[d]}</span>))
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
              <HeartPulse className="h-4 w-4" /> Recommended off-days: {recDayLabels.join(" & ") || "—"}
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink-700">{result}</p>
          </div>
        )}
      </section>
    </>
  );
}

function localSuggestion(
  name: string, recDays: string[], sleep: string | number | undefined, volume: number, count: number,
) {
  const days = recDays.length ? recDays.join(" and ") : "the lightest day";
  const sleepNote = sleep
    ? `Reported sleep quality is ${sleep}/5 — ${Number(sleep) < 3 ? "prioritise earlier nights and wind-down routine." : "keep the routine consistent."}`
    : "No sleep data logged — ask them to report sleep in their check-in.";
  const deloadNote = count >= 5
    ? "Training frequency is high this week — schedule a deload (−40% volume) next block."
    : "Volume is within recovery capacity — keep progressing.";
  return (
    `Recommended off-days for ${name}: ${days}. These days have no scheduled appointments and the lowest accumulated load.\n\n` +
    `• ${sleepNote}\n` +
    `• Hydration: 2.5–3 L water + electrolytes on training days.\n` +
    `• ${deloadNote}\n` +
    `• Add 10–15 min of mobility/foam-rolling on each off-day.` +
    (volume ? `\n• Logged ${volume.toLocaleString()} lb of volume in the last 7 days.` : "")
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
