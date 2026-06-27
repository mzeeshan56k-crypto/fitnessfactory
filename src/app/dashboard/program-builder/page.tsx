"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Loader2, Dumbbell, Plus, X, Layers, ChevronRight, Trash2, Pencil,
  ArrowUp, ArrowDown, SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState, Modal, Field } from "@/components/ui/Modal";
import { useApp, uid } from "@/lib/store";
import type { Program, ProgramPhase } from "@/lib/data";
import { cn } from "@/lib/utils";

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

const newPhase = (n: number): ProgramPhase => ({
  id: uid("ph"), name: `Week ${n * 4 - 3}-${n * 4}`, weeks: 4, workoutIds: [],
});

export default function ProgramBuilderPage() {
  const app = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [newProgramOpen, setNewProgramOpen] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [addWorkoutOpen, setAddWorkoutOpen] = useState(false);
  const [quickWorkoutName, setQuickWorkoutName] = useState("");

  if (!app.hydrated) return <Loading />;

  const program = app.programs.find((p) => p.id === selectedId) ?? null;
  // Ensure the program we edit always has at least one phase to work in.
  const phases: ProgramPhase[] = program?.phases?.length
    ? program.phases
    : program
      ? [{ id: "legacy", name: "Phase 1", weeks: program.weeks, workoutIds: program.workoutIds ?? [] }]
      : [];
  const activePhase = phases.find((ph) => ph.id === activePhaseId) ?? phases[0] ?? null;

  function savePhases(next: ProgramPhase[]) {
    if (!program) return;
    app.updateProgram(program.id, { phases: next });
  }

  function createProgram() {
    const name = newProgramName.trim();
    if (!name) return;
    const p = app.addProgram({ name, phases: [newPhase(1)] });
    setSelectedId(p.id);
    setActivePhaseId(p.phases?.[0]?.id ?? null);
    setNewProgramName("");
    setNewProgramOpen(false);
  }

  function addPhase() {
    if (!program) return;
    const next = [...phases, newPhase(phases.length + 1)];
    savePhases(next);
    setActivePhaseId(next[next.length - 1].id);
  }

  function removePhase(id: string) {
    if (!program) return;
    const next = phases.filter((ph) => ph.id !== id);
    savePhases(next.length ? next : [newPhase(1)]);
    setActivePhaseId(null);
  }

  function renamePhase(id: string, name: string) {
    savePhases(phases.map((ph) => (ph.id === id ? { ...ph, name } : ph)));
  }
  function setPhaseWeeks(id: string, weeks: number) {
    savePhases(phases.map((ph) => (ph.id === id ? { ...ph, weeks } : ph)));
  }

  function addWorkoutToPhase(workoutId: string) {
    if (!activePhase) return;
    savePhases(phases.map((ph) =>
      ph.id === activePhase.id && !ph.workoutIds.includes(workoutId)
        ? { ...ph, workoutIds: [...ph.workoutIds, workoutId] }
        : ph,
    ));
  }
  function removeWorkoutFromPhase(workoutId: string) {
    if (!activePhase) return;
    savePhases(phases.map((ph) =>
      ph.id === activePhase.id ? { ...ph, workoutIds: ph.workoutIds.filter((w) => w !== workoutId) } : ph,
    ));
  }
  function moveWorkout(idx: number, dir: -1 | 1) {
    if (!activePhase) return;
    const ids = [...activePhase.workoutIds];
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    savePhases(phases.map((ph) => (ph.id === activePhase.id ? { ...ph, workoutIds: ids } : ph)));
  }

  function quickCreateWorkout() {
    const name = quickWorkoutName.trim();
    if (!name || !activePhase) return;
    const w = app.addWorkout({ name, category: "Strength", durationMin: 45, difficulty: "Beginner", exercises: [] });
    addWorkoutToPhase(w.id);
    setQuickWorkoutName("");
    setAddWorkoutOpen(false);
  }

  const phaseWorkouts = activePhase
    ? activePhase.workoutIds.map((id) => app.workouts.find((w) => w.id === id)).filter((w): w is NonNullable<typeof w> => Boolean(w))
    : [];
  const available = app.workouts.filter((w) => !activePhase?.workoutIds.includes(w.id));

  return (
    <>
      <PageHeader
        title="Program builder"
        subtitle="Build phase-based programs — pick a phase, then add the workouts it delivers"
        action={
          <button className="btn-primary" onClick={() => setNewProgramOpen(true)}>
            <Plus className="h-4 w-4" /> New program
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        {/* Left: program list */}
        <div className="card h-fit p-3">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Programs ({app.programs.length})
          </p>
          {app.programs.length === 0 ? (
            <p className="px-2 py-4 text-sm text-ink-400">No programs yet. Create one to start.</p>
          ) : (
            <div className="space-y-1">
              {app.programs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedId(p.id); setActivePhaseId(p.phases?.[0]?.id ?? null); }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                    p.id === selectedId ? "bg-brand-500/15 text-brand-500" : "text-ink-700 hover:bg-ink-50",
                  )}
                >
                  <span className={cn("h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br", p.color)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-900">{p.name}</span>
                    <span className="block text-xs text-ink-400">
                      {(p.phases?.length ?? 1)} phase{(p.phases?.length ?? 1) === 1 ? "" : "s"} · {p.workoutIds?.length ?? 0} workouts
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: phase editor */}
        {!program ? (
          <div className="card">
            <EmptyState
              icon={Layers}
              title="Select a program"
              description="Pick a program on the left to edit its phases and workouts, or create a new one."
            />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Program header */}
            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={cn("h-10 w-10 rounded-xl bg-gradient-to-br", program.color)} />
                  <div>
                    <h2 className="font-bold text-ink-900">{program.name}</h2>
                    <p className="text-xs text-ink-500">{program.focus} · {program.workoutIds?.length ?? 0} workouts total</p>
                  </div>
                </div>
                <Link href="/dashboard/workouts" className="btn-secondary text-sm">
                  <SlidersHorizontal className="h-4 w-4" /> Edit details & media
                </Link>
              </div>

              {/* Phase selector (the dropdown of phases) */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">Phase</span>
                <select
                  className="input h-9 max-w-xs py-0 text-sm"
                  value={activePhase?.id ?? ""}
                  onChange={(e) => setActivePhaseId(e.target.value)}
                >
                  {phases.map((ph) => (
                    <option key={ph.id} value={ph.id}>{ph.name} ({ph.weeks} wk · {ph.workoutIds.length} workouts)</option>
                  ))}
                </select>
                <button onClick={addPhase} className="btn-secondary h-9 py-0 text-sm">
                  <Plus className="h-3.5 w-3.5" /> Add phase
                </button>
              </div>
            </div>

            {/* Active phase editor */}
            {activePhase && (
              <div className="card p-5">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-ink-100 pb-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <Field label="Phase name">
                      <input
                        className="input h-9 py-0"
                        value={activePhase.name}
                        onChange={(e) => renamePhase(activePhase.id, e.target.value)}
                      />
                    </Field>
                    <Field label="Weeks">
                      <input
                        type="number"
                        min={1}
                        max={16}
                        className="input h-9 w-20 py-0"
                        value={activePhase.weeks}
                        onChange={(e) => setPhaseWeeks(activePhase.id, Number(e.target.value) || 1)}
                      />
                    </Field>
                  </div>
                  {phases.length > 1 && (
                    <button
                      onClick={() => removePhase(activePhase.id)}
                      className="btn-secondary h-9 py-0 text-sm text-rose-400 hover:bg-rose-500/15"
                    >
                      <Trash2 className="h-4 w-4" /> Delete phase
                    </button>
                  )}
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink-900">Workouts in {activePhase.name}</h3>
                  <button onClick={() => setAddWorkoutOpen(true)} className="btn-primary px-3 py-1.5 text-sm">
                    <Plus className="h-4 w-4" /> Add workout
                  </button>
                </div>

                {phaseWorkouts.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm text-ink-400">
                    No workouts in this phase yet. Add one from your library or create a new one.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {phaseWorkouts.map((w, i) => (
                      <div key={w.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-400">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-ink-900">{w.name}</div>
                          <div className="text-xs text-ink-400">
                            {w.durationMin} min · {w.exercises.length} exercises
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/workouts?select=${w.id}`}
                          className="btn-secondary px-2.5 py-1.5 text-xs"
                          title="Build warm-ups, exercises & rest times"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Build
                        </Link>
                        <div className="flex items-center">
                          <button onClick={() => moveWorkout(i, -1)} disabled={i === 0} className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                          <button onClick={() => moveWorkout(i, 1)} disabled={i === phaseWorkouts.length - 1} className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                          <button onClick={() => removeWorkoutFromPhase(w.id)} className="rounded p-1 text-ink-400 hover:bg-rose-500/15 hover:text-rose-400" aria-label="Remove"><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New program modal */}
      <Modal
        open={newProgramOpen}
        onClose={() => setNewProgramOpen(false)}
        title="New program"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setNewProgramOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={createProgram} disabled={!newProgramName.trim()}>Create</button>
          </>
        }
      >
        <Field label="Program name">
          <input
            autoFocus
            className="input"
            value={newProgramName}
            onChange={(e) => setNewProgramName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createProgram(); }}
            placeholder="e.g. 8-Week Strength Foundations"
          />
        </Field>
        <p className="mt-2 text-xs text-ink-400">Starts with one phase — add more phases after creating.</p>
      </Modal>

      {/* Add workout to phase modal */}
      <Modal
        open={addWorkoutOpen}
        onClose={() => setAddWorkoutOpen(false)}
        title={`Add workout to ${activePhase?.name ?? "phase"}`}
        footer={<button className="btn-secondary" onClick={() => setAddWorkoutOpen(false)}>Done</button>}
      >
        <div className="space-y-4">
          <div>
            <span className="label">Create a new workout</span>
            <div className="mt-1 flex gap-2">
              <input
                className="input flex-1"
                value={quickWorkoutName}
                onChange={(e) => setQuickWorkoutName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") quickCreateWorkout(); }}
                placeholder="e.g. Day 1 — Upper Body"
              />
              <button className="btn-primary shrink-0" onClick={quickCreateWorkout} disabled={!quickWorkoutName.trim()}>
                <Plus className="h-4 w-4" /> Create
              </button>
            </div>
            <p className="mt-1 text-xs text-ink-400">Creates a blank workout in this phase — then tap “Build” to add warm-ups, exercises and rest times.</p>
          </div>

          <div>
            <span className="label">Or add from your library</span>
            {available.length === 0 ? (
              <p className="mt-1 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-4 text-center text-sm text-ink-400">
                Every workout is already in this phase.
              </p>
            ) : (
              <div className="mt-1 max-h-64 space-y-1.5 overflow-y-auto scroll-thin">
                {available.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => addWorkoutToPhase(w.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-ink-100 p-2.5 text-left transition hover:border-brand-300 hover:bg-brand-500/5"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                      <Dumbbell className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-900">{w.name}</span>
                      <span className="block text-xs text-ink-400">{w.exercises.length} exercises</span>
                    </span>
                    <Plus className="h-4 w-4 text-brand-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
