"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, Clock, Flame, Check, CheckCircle2, Dumbbell, PartyPopper,
  Timer, TrendingUp, AlertTriangle, Activity, X, Play, UserPlus,
} from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { EmptyState } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { useLocalState } from "@/lib/useLocalState";
import { VideoModal } from "@/components/ui/VideoModal";
import { MediaGallery } from "@/components/MediaGallery";
import { sampleVideo } from "@/lib/media";

interface SetLog {
  done: boolean;
  reps: string;
  load: string;
  rpe: number; // 6-10
  rir: number; // 0-5
}

type LogMap = Record<string, SetLog>;

// Strip a numeric prefix out of strings like "135 lb" or "8 rounds".
function numeric(v: string): number {
  const m = String(v).match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
}

function autoReg(rpe: number): { tone: "up" | "hold" | "down"; text: string } | null {
  if (!rpe) return null;
  if (rpe <= 7) return { tone: "up", text: "Could add load next set" };
  if (rpe >= 9.5) return { tone: "down", text: "Near max — hold or reduce" };
  if (rpe >= 8.5) return { tone: "hold", text: "Solid effort — hold load" };
  return { tone: "hold", text: "On target" };
}

export default function Page({ params }: { params: { id: string } }) {
  const app = useApp();
  const client = useCurrentClient();

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

  const workout = app.workouts.find((w) => w.id === params.id);

  if (!workout)
    return (
      <div className="space-y-5">
        <Link
          href="/client/workouts"
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 transition hover:text-ink-900"
        >
          <ChevronLeft className="h-4 w-4" /> All workouts
        </Link>
        <EmptyState
          icon={Dumbbell}
          title="Workout not found"
          description="This workout no longer exists or hasn't been assigned."
          action={<Link href="/client/workouts" className="btn-primary">Back to workouts</Link>}
        />
      </div>
    );

  return <WorkoutPlayer workout={workout} clientId={client.id} />;
}

function WorkoutPlayer({ workout, clientId }: { workout: import("@/lib/data").Workout; clientId: string }) {
  const w = workout;
  const { exercises: exerciseLibrary, completeWorkout } = useApp();

  // Build a stable default log map seeded from the prescribed sets.
  const defaultLog = useMemo<LogMap>(() => {
    const map: LogMap = {};
    w.exercises.forEach((ex, exIdx) => {
      ex.sets.forEach((s, setIdx) => {
        map[`${exIdx}-${setIdx}`] = {
          done: false,
          reps: String(s.reps).replace(/[^\d]/g, "") || String(s.reps),
          load: String(s.weight),
          rpe: 8,
          rir: 2,
        };
      });
    });
    return map;
  }, [w]);

  const [log, setLog] = useLocalState<LogMap>(`ffkc-wlog-${w.id}`, defaultLog);
  const [finished, setFinished] = useState(false);
  const [video, setVideo] = useState<{ src: string; title: string } | null>(null);

  // Ensure every prescribed set key exists even if a saved log is stale.
  const getSet = (key: string): SetLog => log[key] ?? defaultLog[key];

  const updateSet = (key: string, patch: Partial<SetLog>) =>
    setLog((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? defaultLog[key]), ...patch },
    }));

  const totalSets = useMemo(
    () => w.exercises.reduce((acc, ex) => acc + ex.sets.length, 0),
    [w],
  );

  const allKeys = useMemo(() => {
    const keys: string[] = [];
    w.exercises.forEach((ex, exIdx) =>
      ex.sets.forEach((_, setIdx) => keys.push(`${exIdx}-${setIdx}`)),
    );
    return keys;
  }, [w]);

  const completedSets = allKeys.filter((k) => getSet(k).done).length;
  const pct = totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);
  const allDone = completedSets === totalSets && totalSets > 0;

  const completedExercises = w.exercises.filter((ex, exIdx) =>
    ex.sets.every((_, setIdx) => getSet(`${exIdx}-${setIdx}`).done),
  ).length;

  // Summary metrics
  const summary = useMemo(() => {
    let volume = 0;
    let rpeSum = 0;
    let rpeCount = 0;
    let logged = 0;
    allKeys.forEach((k) => {
      const s = getSet(k);
      if (!s.done) return;
      logged += 1;
      const reps = numeric(s.reps);
      const load = numeric(s.load);
      if (!Number.isNaN(reps) && !Number.isNaN(load)) volume += reps * load;
      if (s.rpe) {
        rpeSum += s.rpe;
        rpeCount += 1;
      }
    });
    return {
      logged,
      volume,
      avgRpe: rpeCount ? rpeSum / rpeCount : 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log, allKeys]);

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        href="/client/workouts"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ChevronLeft className="h-4 w-4" /> All workouts
      </Link>

      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-ink-50 p-6 text-white shadow-glow">
        <span className="badge bg-white/15 text-white">{w.category}</span>
        <h1 className="mt-2 text-2xl font-bold">{w.name}</h1>
        <div className="mt-1 flex items-center gap-3 text-sm text-brand-100">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> {w.durationMin} min
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-4 w-4" /> {w.difficulty}
          </span>
        </div>
        {w.instructions && (
          <p className="mt-3 rounded-xl bg-white/10 px-4 py-3 text-sm text-brand-50 leading-relaxed">
            {w.instructions}
          </p>
        )}

        {/* Progress indicator */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-brand-100">
            <span>{completedExercises} of {w.exercises.length} exercises done</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Trainer media */}
      {w.media && w.media.length > 0 && (
        <section className="space-y-3">
          <h2 className="px-1 font-semibold text-ink-900">From your coach</h2>
          <MediaGallery media={w.media} />
        </section>
      )}

      {/* Exercises */}
      <section className="space-y-4 pb-4">
        {w.exercises.map((ex, exIdx) => {
          const exDone = ex.sets.every((_, setIdx) => getSet(`${exIdx}-${setIdx}`).done);
          return (
            <div
              key={`${ex.exerciseId}-${exIdx}`}
              className={cn(
                "card overflow-hidden p-5 transition",
                exDone && "border-accent-200 bg-accent-50/40 ring-1 ring-accent-100",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink-400">
                      {String(exIdx + 1).padStart(2, "0")}
                    </span>
                    <h2 className="font-semibold text-ink-900">{ex.name}</h2>
                  </div>
                  <span className="badge mt-1.5 bg-brand-500/15 text-brand-400">
                    {ex.muscle}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {exDone && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-accent-400">
                      <CheckCircle2 className="h-5 w-5" /> Done
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setVideo({
                        src:
                          exerciseLibrary.find((e) => e.id === ex.exerciseId)?.video ||
                          sampleVideo(ex.exerciseId || ex.name),
                        title: ex.name,
                      })
                    }
                    aria-label={`Watch ${ex.name} demo`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-400 active:scale-95"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" /> Watch demo
                  </button>
                </div>
              </div>

              {ex.notes && (
                <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">
                  {ex.notes}
                </p>
              )}

              {/* Rest timer */}
              <RestTimer seconds={90} />

              {/* Sets */}
              <div className="mt-4 space-y-3">
                {ex.sets.map((s, setIdx) => {
                  const key = `${exIdx}-${setIdx}`;
                  const set = getSet(key);
                  const checked = set.done;
                  const hint = autoReg(set.rpe);
                  return (
                    <div
                      key={key}
                      className={cn(
                        "rounded-xl border p-3 text-sm transition",
                        checked
                          ? "border-accent-200 bg-accent-500/15"
                          : "border-ink-100 bg-ink-100",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-xs font-bold text-ink-600">
                          {setIdx + 1}
                        </span>
                        <span className="text-xs text-ink-400">
                          Target {s.reps} · {s.weight} · rest {s.rest}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSet(key, { done: !checked })}
                          aria-pressed={checked}
                          aria-label={`Mark set ${setIdx + 1} ${checked ? "incomplete" : "complete"}`}
                          className={cn(
                            "ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90",
                            checked
                              ? "border-accent-500 bg-accent-500 text-white"
                              : "border-ink-200 text-transparent hover:border-brand-400",
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Editable performance inputs */}
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Field label="Reps">
                          <input
                            inputMode="numeric"
                            value={set.reps}
                            onChange={(e) => updateSet(key, { reps: e.target.value })}
                            className="input px-2.5 py-1.5 text-center text-sm"
                            aria-label={`Actual reps for set ${setIdx + 1}`}
                          />
                        </Field>
                        <Field label="Load">
                          <input
                            value={set.load}
                            onChange={(e) => updateSet(key, { load: e.target.value })}
                            className="input px-2.5 py-1.5 text-center text-sm"
                            aria-label={`Actual load for set ${setIdx + 1}`}
                          />
                        </Field>
                        <Field label="RPE">
                          <select
                            value={set.rpe}
                            onChange={(e) => updateSet(key, { rpe: parseFloat(e.target.value) })}
                            className="input px-2 py-1.5 text-center text-sm"
                            aria-label={`RPE for set ${setIdx + 1}`}
                          >
                            {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="RIR">
                          <select
                            value={set.rir}
                            onChange={(e) => updateSet(key, { rir: parseInt(e.target.value, 10) })}
                            className="input px-2 py-1.5 text-center text-sm"
                            aria-label={`Reps in reserve for set ${setIdx + 1}`}
                          >
                            {[0, 1, 2, 3, 4, 5].map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      {/* Auto-regulation hint */}
                      {hint && (
                        <div
                          className={cn(
                            "mt-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                            hint.tone === "up" && "bg-accent-500/15 text-accent-400",
                            hint.tone === "hold" && "bg-brand-500/15 text-brand-400",
                            hint.tone === "down" && "bg-amber-500/15 text-amber-400",
                          )}
                        >
                          {hint.tone === "up" && <TrendingUp className="h-3.5 w-3.5" />}
                          {hint.tone === "hold" && <Activity className="h-3.5 w-3.5" />}
                          {hint.tone === "down" && <AlertTriangle className="h-3.5 w-3.5" />}
                          {hint.text}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Finish summary */}
      {finished && (
        <section className="card border-accent-200 bg-accent-50/60 p-5">
          <div className="flex items-center gap-2 text-accent-400">
            <PartyPopper className="h-5 w-5" />
            <h2 className="font-semibold">Workout complete!</h2>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <SummaryTile label="Sets logged" value={`${summary.logged}`} />
            <SummaryTile
              label="Total volume"
              value={summary.volume ? `${Math.round(summary.volume).toLocaleString()}` : "—"}
            />
            <SummaryTile
              label="Avg RPE"
              value={summary.avgRpe ? summary.avgRpe.toFixed(1) : "—"}
            />
          </div>
        </section>
      )}

      {/* Sticky progress / finish bar */}
      <div className="sticky bottom-4 z-20">
        <div
          className={cn(
            "card flex items-center gap-4 p-4 shadow-lg backdrop-blur",
            allDone ? "border-accent-200 bg-accent-50/90" : "bg-ink-100/80",
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-xs text-ink-500">
              <span className="font-medium">
                {completedSets} / {totalSets} sets
              </span>
              <span className="font-semibold text-ink-900">{pct}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={!allDone}
            onClick={() => {
              if (!finished) {
                completeWorkout(clientId, {
                  workoutId: w.id,
                  workoutName: w.name,
                  setsLogged: summary.logged,
                  volume: Math.round(summary.volume),
                  avgRpe: Number(summary.avgRpe.toFixed(1)),
                });
              }
              setFinished(true);
            }}
            className={cn(
              "btn-primary shrink-0 whitespace-nowrap",
              allDone && "bg-accent-500 hover:bg-accent-600",
            )}
          >
            {allDone ? (
              <>
                <PartyPopper className="h-4 w-4" /> Finish workout
              </>
            ) : (
              <>
                <Dumbbell className="h-4 w-4" /> Finish workout
              </>
            )}
          </button>
        </div>
      </div>

      <VideoModal
        open={!!video}
        onClose={() => setVideo(null)}
        src={video?.src ?? ""}
        title={video?.title}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-100 p-3 text-center shadow-soft">
      <div className="text-lg font-bold text-ink-900">{value}</div>
      <div className="text-[11px] text-ink-400">{label}</div>
    </div>
  );
}

function RestTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const start = () => {
    setRemaining(seconds);
    setRunning(true);
  };
  const stop = () => {
    setRunning(false);
    setRemaining(0);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="mt-3">
      {running ? (
        <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-500/15 px-3 py-2">
          <Timer className="h-4 w-4 text-brand-400" />
          <span className="font-mono text-base font-bold tabular-nums text-brand-400">
            {mm}:{ss}
          </span>
          <span className="text-xs text-brand-500">resting…</span>
          <button
            type="button"
            onClick={stop}
            aria-label="Stop rest timer"
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-full border border-brand-200 text-brand-400 transition hover:bg-ink-100 active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-400 active:scale-95"
        >
          <Timer className="h-3.5 w-3.5" /> Rest {seconds}s
        </button>
      )}
    </div>
  );
}
