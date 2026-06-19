"use client";

import { useMemo, useState } from "react";
import {
  Loader2, Dumbbell, Plus, X, CheckCircle2, CalendarDays, Layers, Target, Palette,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/ui/Modal";
import { useApp } from "@/lib/store";
import { useLocalState } from "@/lib/useLocalState";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const colorOptions: { label: string; value: string; swatch: string }[] = [
  { label: "Brand", value: "from-brand-500 to-brand-700", swatch: "from-brand-500 to-brand-700" },
  { label: "Accent", value: "from-accent-500 to-accent-700", swatch: "from-accent-500 to-accent-700" },
  { label: "Purple", value: "from-purple-500 to-purple-700", swatch: "from-purple-500 to-purple-700" },
  { label: "Amber", value: "from-amber-500 to-amber-700", swatch: "from-amber-500 to-amber-700" },
  { label: "Indigo", value: "from-indigo-500 to-indigo-700", swatch: "from-indigo-500 to-indigo-700" },
  { label: "Rose", value: "from-rose-500 to-rose-700", swatch: "from-rose-500 to-rose-700" },
];

// assignment record: dayKey "w{week}-d{day}" -> array of workout ids
type Assignments = Record<string, string[]>;

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export default function ProgramBuilderPage() {
  const app = useApp();

  const [meta, setMeta] = useLocalState("ffkc-pb-meta", {
    name: "",
    weeks: 8,
    workoutsPerWeek: 3,
    focus: "Strength",
    color: colorOptions[0].value,
  });
  const [assignments, setAssignments] = useLocalState<Assignments>("ffkc-pb-assign", {});
  const [activeWeek, setActiveWeek] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const workoutById = useMemo(
    () => Object.fromEntries(app.workouts.map((w) => [w.id, w])),
    [app.workouts],
  );

  const totalAssigned = useMemo(
    () => Object.values(assignments).reduce((n, arr) => n + arr.length, 0),
    [assignments],
  );

  if (!app.hydrated) return <Loading />;

  const weeks = Math.max(1, Math.min(16, Number(meta.weeks) || 1));

  function dayKey(week: number, day: number) {
    return `w${week}-d${day}`;
  }

  function addWorkout(key: string) {
    const wid = picks[key];
    if (!wid) return;
    setAssignments((a) => {
      const existing = a[key] ?? [];
      if (existing.includes(wid)) return a;
      return { ...a, [key]: [...existing, wid] };
    });
    setPicks((p) => ({ ...p, [key]: "" }));
    setSaved(false);
  }

  function removeWorkout(key: string, wid: string) {
    setAssignments((a) => ({ ...a, [key]: (a[key] ?? []).filter((x) => x !== wid) }));
    setSaved(false);
  }

  function saveProgram(e: React.FormEvent) {
    e.preventDefault();
    app.addProgram({
      name: meta.name.trim() || "Untitled Program",
      weeks,
      workoutsPerWeek: Math.max(1, Number(meta.workoutsPerWeek) || 1),
      focus: meta.focus.trim() || "General",
      color: meta.color,
    });
    setSaved(true);
  }

  return (
    <>
      <PageHeader
        title="Program builder"
        subtitle="Design multi-week training programs day by day"
        action={
          <button type="submit" form="pb-form" className="btn-primary">
            <CheckCircle2 className="h-4 w-4" />
            Save program
          </button>
        }
      />

      {saved && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-accent-500/30 bg-accent-500/15 px-4 py-3 text-sm text-accent-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-medium text-ink-900">
            “{meta.name.trim() || "Untitled Program"}” saved
          </span>
          <span className="text-accent-400">It now appears in your programs list below.</span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        {/* Left: meta form */}
        <form id="pb-form" onSubmit={saveProgram} className="card h-fit space-y-4 p-5">
          <p className="eyebrow">Program details</p>

          <label className="block">
            <span className="label">Program name</span>
            <input
              className="input"
              value={meta.name}
              onChange={(e) => { setMeta((m) => ({ ...m, name: e.target.value })); setSaved(false); }}
              placeholder="Strength Foundations"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Weeks</span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="number"
                  min={1}
                  max={16}
                  className="input pl-9"
                  value={meta.weeks}
                  onChange={(e) => { setMeta((m) => ({ ...m, weeks: Number(e.target.value) })); setSaved(false); }}
                />
              </div>
            </label>
            <label className="block">
              <span className="label">Days / week</span>
              <div className="relative">
                <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="number"
                  min={1}
                  max={7}
                  className="input pl-9"
                  value={meta.workoutsPerWeek}
                  onChange={(e) => { setMeta((m) => ({ ...m, workoutsPerWeek: Number(e.target.value) })); setSaved(false); }}
                />
              </div>
            </label>
          </div>

          <label className="block">
            <span className="label">Focus</span>
            <div className="relative">
              <Target className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <select
                className="input pl-9"
                value={meta.focus}
                onChange={(e) => { setMeta((m) => ({ ...m, focus: e.target.value })); setSaved(false); }}
              >
                {["Strength", "Hypertrophy", "Fat loss", "Endurance", "Mobility", "General"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </label>

          <div className="block">
            <span className="label flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" /> Cover color
            </span>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => { setMeta((m) => ({ ...m, color: c.value })); setSaved(false); }}
                  className={cn(
                    "h-9 rounded-lg bg-gradient-to-br ring-2 transition",
                    c.swatch,
                    meta.color === c.value ? "ring-ink-900" : "ring-transparent hover:ring-ink-300",
                  )}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          <div className={cn("flex h-20 flex-col justify-end rounded-xl bg-gradient-to-br p-3 shadow-soft", meta.color)}>
            <p className="text-sm font-semibold text-white">{meta.name.trim() || "Program preview"}</p>
            <p className="text-xs text-white/80">{weeks} wk · {meta.focus} · {totalAssigned} workouts placed</p>
          </div>
        </form>

        {/* Center: week/day grid */}
        <div className="card p-5">
          {app.workouts.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No workouts to assign"
              description="Create workouts in the Training section first, then come back to drop them into your program schedule."
            />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink-900">Schedule</p>
                  <span className="badge bg-ink-100 text-ink-500">{totalAssigned} placed</span>
                </div>
                <div className="scroll-thin flex max-w-full gap-1.5 overflow-x-auto">
                  {Array.from({ length: weeks }).map((_, w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setActiveWeek(w)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition",
                        activeWeek === w
                          ? "bg-brand-600 text-white shadow-glow"
                          : "border border-ink-200 bg-ink-100 text-ink-600 hover:border-ink-300 hover:bg-ink-50",
                      )}
                    >
                      Week {w + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {DAY_NAMES.map((dn, d) => {
                  const key = dayKey(activeWeek, d);
                  const assigned = assignments[key] ?? [];
                  return (
                    <div key={key} className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink-900">{dn}</span>
                        <span className="text-xs text-ink-400">{assigned.length}</span>
                      </div>

                      <div className="space-y-1.5">
                        {assigned.map((wid) => {
                          const w = workoutById[wid];
                          if (!w) return null;
                          return (
                            <div
                              key={wid}
                              className="flex items-center gap-1.5 rounded-lg bg-brand-500/15 px-2 py-1.5 text-xs text-brand-400"
                            >
                              <Dumbbell className="h-3 w-3 shrink-0" />
                              <span className="min-w-0 flex-1 truncate font-medium text-ink-900">{w.name}</span>
                              <button
                                type="button"
                                onClick={() => removeWorkout(key, wid)}
                                className="shrink-0 rounded p-0.5 text-ink-400 hover:bg-rose-500/15 hover:text-rose-400"
                                aria-label="Remove workout"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                        {assigned.length === 0 && (
                          <p className="py-1 text-xs text-ink-400">Rest / empty</p>
                        )}
                      </div>

                      <div className="mt-2 flex gap-1.5">
                        <select
                          className="input h-8 py-0 text-xs"
                          value={picks[key] ?? ""}
                          onChange={(e) => setPicks((p) => ({ ...p, [key]: e.target.value }))}
                        >
                          <option value="">Add workout…</option>
                          {app.workouts.map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => addWorkout(key)}
                          disabled={!picks[key]}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Add"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Existing programs */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
          Existing programs ({app.programs.length})
        </h2>
        {app.programs.length === 0 ? (
          <p className="text-sm text-ink-500">No programs yet — build and save your first one above.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {app.programs.map((p) => (
              <div key={p.id} className="card overflow-hidden p-0">
                <div className={cn("h-20 bg-gradient-to-br", p.color)} />
                <div className="p-4">
                  <p className="font-semibold text-ink-900">{p.name}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{p.focus}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="badge bg-ink-100 text-ink-600">{p.weeks} weeks</span>
                    <span className="badge bg-ink-100 text-ink-600">{p.workoutsPerWeek}×/week</span>
                    <span className="badge bg-accent-500/15 text-accent-400">{p.clientsAssigned} assigned</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
