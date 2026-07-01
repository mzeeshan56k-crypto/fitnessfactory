"use client";

import { useState } from "react";
import { Plus, X, ArrowUp, ArrowDown, GripVertical, Dumbbell } from "lucide-react";
import { useApp } from "@/lib/store";
import type { Workout, WorkoutExercise } from "@/lib/data";
import { cn } from "@/lib/utils";

type Section = "warmup" | "main" | "cooldown";

const SECTION_META: Record<Section, { label: string; tint: string }> = {
  warmup: { label: "Warm-up", tint: "bg-amber-500/15 text-amber-500" },
  main: { label: "Main", tint: "bg-brand-500/15 text-brand-400" },
  cooldown: { label: "Cool-down", tint: "bg-sky-500/15 text-sky-500" },
};

function restLabel(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

// 10s, 20s, 30s, then 30s intervals up to 5 minutes.
const REST_SECONDS = [10, 20, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300];
const REST_OPTIONS = REST_SECONDS.map((s) => restLabel(s));

/**
 * Full step-by-step workout builder: add warm-ups, exercises and cool-downs from
 * the library, set reps/weight/rest per set, reorder, and add coaching notes.
 * Self-contained — reads the workout live from the store and saves on every edit.
 * Reused by the Program Builder (inline within a phase) and the Training tab.
 */
export function WorkoutBuilder({ workoutId }: { workoutId: string }) {
  const app = useApp();
  const workout = app.workouts.find((w) => w.id === workoutId);
  const [addExId, setAddExId] = useState("");
  const [addSection, setAddSection] = useState<Section>("main");
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  if (!workout) {
    return (
      <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-4 text-center text-sm text-ink-400">
        Workout not found.
      </p>
    );
  }

  function patch(updater: (list: WorkoutExercise[]) => WorkoutExercise[]) {
    app.updateWorkout(workout!.id, { exercises: updater(workout!.exercises) });
  }
  function addExercise() {
    if (!addExId) return;
    const ex = app.exercises.find((e) => e.id === addExId);
    if (!ex) return;
    const we: WorkoutExercise = {
      exerciseId: ex.id, name: ex.name, muscle: ex.muscle,
      sets: [{ reps: "10", weight: "—", rest: "1m" }],
      notes: ex.instructions || "",
      section: addSection,
    };
    patch((list) => [...list, we]);
    setAddExId("");
  }
  function updateSet(i: number, si: number, p: Partial<{ reps: string; weight: string; rest: string }>) {
    patch((list) => list.map((ex, x) => (x === i ? { ...ex, sets: ex.sets.map((s, y) => (y === si ? { ...s, ...p } : s)) } : ex)));
  }
  function addSet(i: number) {
    patch((list) => list.map((ex, x) => {
      if (x !== i) return ex;
      const last = ex.sets[ex.sets.length - 1] ?? { reps: "10", weight: "—", rest: "1m" };
      return { ...ex, sets: [...ex.sets, { ...last }] };
    }));
  }
  function removeSet(i: number, si: number) {
    patch((list) => list.map((ex, x) => (x === i ? { ...ex, sets: ex.sets.length > 1 ? ex.sets.filter((_, y) => y !== si) : ex.sets } : ex)));
  }
  function setNotes(i: number, notes: string) {
    patch((list) => list.map((ex, x) => (x === i ? { ...ex, notes } : ex)));
  }
  function setSection(i: number, section: Section) {
    patch((list) => list.map((ex, x) => (x === i ? { ...ex, section } : ex)));
  }
  function removeAt(i: number) {
    patch((list) => list.filter((_, x) => x !== i));
  }
  function move(from: number, to: number) {
    if (to < 0) return;
    patch((list) => {
      if (to >= list.length) return list;
      const copy = [...list];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }
  function onDrop(to: number) {
    if (dragIdx === null || dragIdx === to) { setDragIdx(null); return; }
    move(dragIdx, to);
    setDragIdx(null);
  }

  return (
    <div className="space-y-3">
      {workout.exercises.map((ex, i) => {
        const lib = app.exercises.find((e) => e.id === ex.exerciseId);
        const section = (ex.section ?? "main") as Section;
        return (
          <div
            key={`${ex.exerciseId}-${i}`}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
            onDragEnd={() => setDragIdx(null)}
            className={cn("rounded-xl border border-ink-100 bg-ink-50/30 transition", dragIdx === i && "opacity-60 ring-2 ring-brand-500")}
          >
            <div className="flex items-center gap-2 border-b border-ink-100 p-3">
              <span className="cursor-grab text-ink-300" title="Drag to reorder"><GripVertical className="h-5 w-5" /></span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-400">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink-900">{ex.name}</div>
                <div className="text-xs text-ink-500">{ex.muscle}</div>
              </div>
              <select
                value={section}
                onChange={(e) => setSection(i, e.target.value as Section)}
                className={cn("h-8 shrink-0 rounded-lg border-0 px-2 py-0 text-xs font-medium", SECTION_META[section].tint)}
                title="Section"
              >
                <option value="warmup">Warm-up</option>
                <option value="main">Main</option>
                <option value="cooldown">Cool-down</option>
              </select>
              <div className="flex items-center">
                <button onClick={() => move(i, i - 1)} disabled={i === 0} className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                <button onClick={() => move(i, i + 1)} disabled={i === workout.exercises.length - 1} className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                <button onClick={() => removeAt(i)} className="rounded p-1 text-ink-400 hover:bg-rose-500/15 hover:text-rose-400" aria-label="Remove"><X className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="space-y-3 p-3">
              <div className="overflow-x-auto scroll-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
                      <th className="pb-2 pl-1 font-medium">Set</th>
                      <th className="pb-2 pr-2 font-medium">Reps</th>
                      <th className="pb-2 pr-2 font-medium">Weight</th>
                      <th className="pb-2 pr-2 font-medium">Rest</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {ex.sets.map((s, si) => (
                      <tr key={si} className="border-t border-ink-100">
                        <td className="py-1.5 pl-1 font-semibold text-ink-700">{si + 1}</td>
                        <td className="py-1.5 pr-2"><input className="input h-9 py-1" value={s.reps} onChange={(e) => updateSet(i, si, { reps: e.target.value })} placeholder="10" /></td>
                        <td className="py-1.5 pr-2"><input className="input h-9 py-1" value={s.weight} onChange={(e) => updateSet(i, si, { weight: e.target.value })} placeholder="—" /></td>
                        <td className="py-1.5 pr-2">
                          <select className="input h-9 py-1" value={s.rest} onChange={(e) => updateSet(i, si, { rest: e.target.value })}>
                            {!REST_OPTIONS.includes(s.rest) && s.rest && <option value={s.rest}>{s.rest}</option>}
                            {REST_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="py-1.5">
                          <button onClick={() => removeSet(i, si)} disabled={ex.sets.length <= 1} className="rounded p-1 text-ink-400 hover:bg-rose-500/15 hover:text-rose-400 disabled:opacity-30" aria-label="Remove set"><X className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => addSet(i)} className="flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300"><Plus className="h-3.5 w-3.5" /> Add set</button>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-500">Instructions / coaching notes</label>
                <textarea
                  value={ex.notes ?? ""}
                  onChange={(e) => setNotes(i, e.target.value)}
                  rows={2}
                  placeholder={lib?.instructions || "Tempo, form cues, RPE, reminders…"}
                  className="input resize-none text-sm"
                />
              </div>
            </div>
          </div>
        );
      })}

      {workout.exercises.length === 0 && (
        <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-6 text-center text-sm text-ink-400">
          No exercises yet. Add a warm-up or exercise from your library below.
        </p>
      )}

      {/* Add exercise control */}
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-ink-200 p-3 sm:flex-row sm:items-center">
        <select value={addSection} onChange={(e) => setAddSection(e.target.value as Section)} className="input h-10 sm:w-36">
          <option value="warmup">Warm-up</option>
          <option value="main">Exercise</option>
          <option value="cooldown">Cool-down</option>
        </select>
        <select value={addExId} onChange={(e) => setAddExId(e.target.value)} className="input flex-1">
          <option value="">
            {app.exercises.length === 0 ? "No library exercises — add some in the Exercise Library" : "Choose a library exercise…"}
          </option>
          {app.exercises.map((e) => (
            <option key={e.id} value={e.id}>{e.name} · {e.muscle}</option>
          ))}
        </select>
        <button className="btn-primary shrink-0" onClick={addExercise} disabled={!addExId}>
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
    </div>
  );
}

/** Compact summary line for a workout (used in lists). */
export function workoutSummary(w: Workout) {
  const warm = w.exercises.filter((e) => (e.section ?? "main") === "warmup").length;
  const main = w.exercises.filter((e) => (e.section ?? "main") === "main").length;
  const cool = w.exercises.filter((e) => (e.section ?? "main") === "cooldown").length;
  const parts = [warm && `${warm} warm-up`, main && `${main} exercise${main === 1 ? "" : "s"}`, cool && `${cool} cool-down`].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No exercises yet";
}

// re-export icon used above for callers that want a consistent glyph
export { Dumbbell as WorkoutIcon };
