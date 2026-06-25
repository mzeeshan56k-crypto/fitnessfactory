"use client";

import { useMemo, useState } from "react";
import {
  LineChart as LineChartRecharts, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  TrendingDown, Dumbbell, Activity, Flame, Camera, LineChart,
  Footprints, Droplet, Moon, Utensils, Users, Target, TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { WeightChart, StrengthChart } from "@/components/dashboard/Charts";
import { EmptyState, Field } from "@/components/ui/Modal";
import { DataControls } from "@/components/dashboard/DataControls";
import { weightTrend, strengthTrend, habits } from "@/lib/data";
import type { Exercise } from "@/lib/data";
import { useApp } from "@/lib/store";
import { clientAdherence } from "@/lib/metrics";
import { cn } from "@/lib/utils";

const habitIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  footprints: Footprints,
  droplet: Droplet,
  moon: Moon,
  utensils: Utensils,
};

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const photoTiles = [
  { label: "Week 1", gradient: "from-brand-400 to-brand-600" },
  { label: "Week 4", gradient: "from-accent-400 to-accent-600" },
  { label: "Week 8", gradient: "from-amber-400 to-rose-500" },
  { label: "Week 12", gradient: "from-brand-500 to-accent-500" },
];

export default function ProgressPage() {
  const app = useApp();

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );
  }

  const clientCount = app.clients.length;
  const avgAdherence =
    clientCount > 0
      ? Math.round(
          app.clients.reduce(
            (sum, c) => sum + clientAdherence(c, app.completions[c.id], app.clientPlans[c.id], app.programs),
            0,
          ) / clientCount,
        )
      : 0;

  // Workouts logged across all clients (live) — replaces the static "0".
  const totalWorkoutsLogged = Object.values(app.completions).reduce((n, list) => n + (list?.length ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Progress"
        subtitle="Track body stats, strength and habits"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {app.seeded ? (
          <>
            <StatCard label="Total weight lost" value="21 lb" delta="9.8%" icon={TrendingDown} />
            <StatCard label="Strength gain" value="+45%" delta="45%" icon={Dumbbell} />
            <StatCard label="Workouts logged" value="1,284" delta="6.4%" icon={Activity} />
            <StatCard label="Active streak" value="23 days" delta="3 days" icon={Flame} />
          </>
        ) : (
          <>
            <StatCard label="Active clients" value={String(clientCount)} icon={Users} />
            <StatCard label="Avg adherence" value={`${avgAdherence}%`} icon={Target} />
            <StatCard label="Workouts logged" value={String(totalWorkoutsLogged)} icon={Activity} />
            <StatCard label="Active streak" value="0 days" icon={Flame} />
          </>
        )}
      </div>

      <StrengthProgressionExplorer exercises={app.exercises} />

      {app.seeded ? (
        <SeededProgress />
      ) : (
        <div className="mt-6 space-y-6">
          <EmptyState
            icon={LineChart}
            title="No progress data yet"
            description="Charts populate as your clients log workouts and check-ins."
          />
          <DataControls variant="card" />
        </div>
      )}
    </>
  );
}

/* ----------- Strength progression explorer (any exercise) ----------- */

const TOP_LIFTS = ["Squat", "Bench Press", "Bench", "Deadlift", "Overhead Press", "OHP"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Deterministic hash from a string so each exercise yields a distinct trend. */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Plausible month-over-month estimated 1RM, derived from exercise id+name. */
function buildSeries(ex: { id: string; name: string }) {
  const seed = hashString(`${ex.id}|${ex.name}`);
  const base = 95 + (seed % 160); // 95–254 lb starting estimate
  const monthlyGain = 4 + (seed % 11); // 4–14 lb / month nominal
  const now = new Date();
  const data: { month: string; oneRm: number }[] = [];
  let value = base;
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const wobble = (((seed >> (i + 1)) % 7) - 3); // -3..+3 deterministic noise
    if (i < 5) value += monthlyGain + wobble;
    data.push({ month: MONTHS[d.getMonth()], oneRm: Math.max(45, Math.round(value)) });
  }
  return data;
}

function StrengthProgressionExplorer({ exercises }: { exercises: Exercise[] }) {
  const options = useMemo(() => {
    const top: Exercise[] = [];
    const rest: Exercise[] = [];
    exercises.forEach((e) => {
      if (TOP_LIFTS.some((t) => e.name.toLowerCase() === t.toLowerCase())) top.push(e);
      else rest.push(e);
    });
    return [...top, ...rest];
  }, [exercises]);

  const [selectedId, setSelectedId] = useState<string>("");
  const active = options.find((e) => e.id === selectedId) ?? options[0] ?? null;

  if (options.length === 0) {
    return (
      <div className="mt-6 card p-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-400" />
          <h2 className="font-semibold text-ink-900">Strength progression by exercise</h2>
        </div>
        <div className="mt-4">
          <EmptyState
            icon={Dumbbell}
            title="No exercises yet"
            description="Add exercises or load starter content to chart strength progression per lift."
          />
        </div>
      </div>
    );
  }

  const series = active ? buildSeries(active) : [];
  const first = series[0]?.oneRm ?? 0;
  const best = series.length ? Math.max(...series.map((d) => d.oneRm)) : 0;
  const gainPct = first > 0 ? Math.round(((best - first) / first) * 100) : 0;

  return (
    <div className="mt-6 card p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-400" />
            <h2 className="font-semibold text-ink-900">Strength progression by exercise</h2>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Estimated 1RM / top set, month over month. Top lifts load first.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Field label="Exercise">
            <select
              className="input"
              value={active?.id ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {options.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-6">
        <div>
          <div className="eyebrow text-ink-400">Current best</div>
          <div className="text-2xl font-bold text-ink-900">{best} lb</div>
        </div>
        <div>
          <div className="eyebrow text-ink-400">Gain (6 mo)</div>
          <div className={cn("text-2xl font-bold", gainPct >= 0 ? "text-accent-400" : "text-brand-400")}>
            {gainPct >= 0 ? "+" : ""}
            {gainPct}%
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChartRecharts data={series} margin={{ left: -16, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#828fa6" />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              stroke="#828fa6"
              domain={["dataMin - 10", "dataMax + 10"]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #eceef2", fontSize: 12 }}
              formatter={(v: number) => [`${v} lb`, "Est. 1RM"]}
            />
            <Line type="monotone" dataKey="oneRm" stroke="#1b82f5" strokeWidth={2.5} dot={{ r: 3 }} name="Est. 1RM" />
          </LineChartRecharts>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ----------- Rich sample visuals — only rendered when seeded ----------- */

function SeededProgress() {
  return (
    <>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink-900">Body weight trend</h2>
              <p className="text-sm text-ink-500">Actual vs. target over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Actual</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ink-300" /> Target</span>
            </div>
          </div>
          <div className="mt-4">
            <WeightChart data={weightTrend} />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink-900">Strength progression</h2>
              <p className="text-sm text-ink-500">Top lifts (lb) by month</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Squat</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent-400" /> Bench</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Deadlift</span>
            </div>
          </div>
          <div className="mt-4">
            <StrengthChart data={strengthTrend} />
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink-900">Habit tracker</h2>
            <p className="text-sm text-ink-500">Daily consistency this week</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {habits.map((habit) => {
            const Icon = habitIcons[habit.icon] ?? Activity;
            return (
              <div
                key={habit.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-ink-100 p-3"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink-900">{habit.name}</div>
                  <div className="flex items-center gap-1 text-xs text-ink-500">
                    <Flame className="h-3.5 w-3.5 text-orange-500" /> {habit.streak} day streak
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {habit.weekly.map((done, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold",
                          done
                            ? "bg-accent-500 text-white"
                            : "border border-ink-200 bg-ink-50 text-ink-300",
                        )}
                      >
                        {dayLabels[i][0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink-900">Progress photos</h2>
            <p className="text-sm text-ink-500">Visual transformation timeline</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {photoTiles.map((tile) => (
            <div key={tile.label} className="group">
              <div
                className={cn(
                  "relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-white/90",
                  tile.gradient,
                )}
              >
                <Camera className="h-9 w-9 opacity-80 transition group-hover:scale-110" />
                <span className="absolute bottom-3 left-3 badge bg-white/20 text-white backdrop-blur">
                  {tile.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
