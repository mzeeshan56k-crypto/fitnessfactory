"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Pencil, Printer, Copy, Trash2, Users, Plus, X, Clock,
  ListChecks, Dumbbell, Play, Video as VideoIcon, Check, FileText, Tag,
  Loader2, ChevronUp, ChevronDown,
} from "lucide-react";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { VideoModal } from "@/components/ui/VideoModal";
import { WorkoutThumb } from "@/components/ui/WorkoutThumb";
import { Avatar } from "@/components/ui/Avatar";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/lib/data";
import { useApp, useMyClients } from "@/lib/store";
import { cn, shortDate } from "@/lib/utils";

const difficulties = ["Beginner", "Intermediate", "Advanced"] as const;

function difficultyClasses(level: string) {
  switch (level) {
    case "Beginner": return "bg-accent-500/15 text-accent-400";
    case "Intermediate": return "bg-brand-500/15 text-brand-400";
    case "Advanced": return "bg-rose-500/15 text-rose-400";
    default: return "bg-ink-100 text-ink-600";
  }
}

export default function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const app = useApp();
  const myClients = useMyClients();
  const router = useRouter();

  const w = app.workouts.find((x) => x.id === params.id);

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [assignClients, setAssignClients] = useState<Set<string>>(new Set());
  const [addExId, setAddExId] = useState("");
  const [video, setVideo] = useState<{ src: string; title: string } | null>(null);

  const [edit, setEdit] = useState({
    name: "", category: "", durationMin: "", difficulty: "Beginner" as (typeof difficulties)[number],
    video: "", description: "", instructions: "", tags: "",
  });

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!w) {
    return (
      <div className="space-y-5">
        <Link href="/dashboard/workouts" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900">
          <ArrowLeft className="h-4 w-4" /> Master Libraries
        </Link>
        <EmptyState
          icon={Dumbbell}
          title="Workout not found"
          description="This workout may have been deleted."
          action={<Link href="/dashboard/workouts" className="btn-primary">Back to library</Link>}
        />
      </div>
    );
  }

  const isVideo = !!w.video;

  function openEdit() {
    if (!w) return;
    setEdit({
      name: w.name, category: w.category, durationMin: String(w.durationMin),
      difficulty: w.difficulty, video: w.video ?? "", description: w.description ?? "",
      instructions: w.instructions ?? "", tags: (w.tags ?? []).join(", "),
    });
    setEditOpen(true);
  }
  function saveEdit() {
    if (!w || !edit.name.trim()) return;
    app.updateWorkout(w.id, {
      name: edit.name.trim(),
      category: edit.category.trim() || "Strength",
      durationMin: Number(edit.durationMin) || w.durationMin,
      difficulty: edit.difficulty,
      video: edit.video.trim() || undefined,
      description: edit.description.trim() || undefined,
      instructions: edit.instructions.trim() || undefined,
      tags: edit.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setEditOpen(false);
    app.notify("Workout details saved");
  }

  /* ----- exercise / set editing ----- */
  function mutate(next: WorkoutExercise[]) {
    if (!w) return;
    app.updateWorkout(w.id, { exercises: next });
  }
  function addExercise() {
    if (!w || !addExId) return;
    const ex = app.exercises.find((e) => e.id === addExId);
    if (!ex) return;
    const we: WorkoutExercise = {
      exerciseId: ex.id, name: ex.name, muscle: ex.muscle,
      sets: [{ reps: "10", weight: "—", rest: "60s" }],
    };
    mutate([...w.exercises, we]);
    setAddExId("");
  }
  function removeExercise(idx: number) {
    if (!w) return;
    mutate(w.exercises.filter((_, i) => i !== idx));
  }
  function moveExercise(idx: number, dir: -1 | 1) {
    if (!w) return;
    const next = [...w.exercises];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    mutate(next);
  }
  function addSet(exIdx: number) {
    if (!w) return;
    const next = w.exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      const last = ex.sets[ex.sets.length - 1] ?? { reps: "10", weight: "—", rest: "60s" };
      return { ...ex, sets: [...ex.sets, { ...last }] };
    });
    mutate(next);
  }
  function removeSet(exIdx: number, setIdx: number) {
    if (!w) return;
    const next = w.exercises.map((ex, i) =>
      i === exIdx ? { ...ex, sets: ex.sets.filter((_, s) => s !== setIdx) } : ex,
    );
    mutate(next);
  }
  function updateSet(exIdx: number, setIdx: number, patch: Partial<WorkoutSet>) {
    if (!w) return;
    const next = w.exercises.map((ex, i) =>
      i === exIdx
        ? { ...ex, sets: ex.sets.map((s, si) => (si === setIdx ? { ...s, ...patch } : s)) }
        : ex,
    );
    mutate(next);
  }

  function duplicate() {
    if (!w) return;
    const copy = app.duplicateWorkout(w.id);
    if (copy) {
      app.notify(`Duplicated to “${copy.name}”`);
      router.push(`/dashboard/workouts/${copy.id}`);
    }
  }
  function doDelete() {
    if (!w) return;
    app.removeWorkout(w.id);
    app.notify(`Deleted “${w.name}”`, "info");
    router.push("/dashboard/workouts");
  }
  function confirmAssign() {
    if (!w || assignClients.size === 0) return;
    app.assignWorkoutToClients([w.id], [...assignClients]);
    app.notify(`Assigned “${w.name}” to ${assignClients.size} client${assignClients.size === 1 ? "" : "s"}`);
    setAssignOpen(false);
    setAssignClients(new Set());
  }

  const unassignedExercises = app.exercises;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/workouts" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900">
          <ArrowLeft className="h-4 w-4" /> Master Libraries
        </Link>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAssignOpen(true)} className="btn-primary">
            <Users className="h-4 w-4" /> Assign to clients
          </button>
          <button onClick={openEdit} className="btn-secondary">
            <Pencil className="h-4 w-4" /> Edit details
          </button>
          <button onClick={duplicate} className="btn-secondary" title="Duplicate">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={() => window.print()} className="btn-secondary" title="Print">
            <Printer className="h-4 w-4" />
          </button>
          <button onClick={() => setConfirmDelete(true)} className="btn-secondary text-rose-400 hover:bg-rose-500/15" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Header card */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-5 p-6 sm:flex-row">
          <button
            type="button"
            onClick={() => isVideo && setVideo({ src: w.video!, title: w.name })}
            className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl sm:h-32 sm:w-56"
            aria-label={isVideo ? "Play workout video" : undefined}
          >
            <WorkoutThumb workout={w} className="h-full w-full" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-ink-900">{w.name}</h1>
              {isVideo ? (
                <span className="badge bg-brand-500/15 text-brand-400"><VideoIcon className="h-3 w-3" /> Video workout</span>
              ) : (
                <span className={cn("badge", difficultyClasses(w.difficulty))}>{w.difficulty}</span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-500">
              Created by {w.createdBy ?? app.settings.businessName}
              {w.createdAt ? ` on ${shortDate(w.createdAt)}` : ""}
              {w.updatedAt ? `, last updated ${shortDate(w.updatedAt)}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-600">
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-ink-400" /> {w.durationMin} min</span>
              <span className="flex items-center gap-1.5"><ListChecks className="h-4 w-4 text-ink-400" /> {w.exercises.length} exercises</span>
              <span className="flex items-center gap-1.5"><Dumbbell className="h-4 w-4 text-ink-400" /> {w.category}</span>
            </div>
            {(w.tags?.length ?? 0) > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {w.tags!.map((t) => (
                  <span key={t} className="badge bg-brand-500/10 text-brand-400"><Tag className="h-3 w-3" /> {t}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        {(w.description || w.instructions) && (
          <div className="border-t border-ink-100 px-6 py-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-ink-400" />
              <h2 className="text-sm font-semibold text-ink-900">Instructions</h2>
            </div>
            {w.description && <p className="mt-2 text-sm text-ink-600">{w.description}</p>}
            {w.instructions && (
              <div className="mt-2 space-y-2 text-sm text-ink-600">
                {w.instructions.split("\n").filter(Boolean).map((line, i) => <p key={i}>{line}</p>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video player (inline) */}
      {isVideo && (
        <div className="mt-6 card overflow-hidden p-6">
          <div className="flex items-center gap-2">
            <VideoIcon className="h-5 w-5 text-brand-400" />
            <h2 className="font-semibold text-ink-900">Follow-along video</h2>
          </div>
          <button
            type="button"
            onClick={() => setVideo({ src: w.video!, title: w.name })}
            className="group relative mt-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-ink-200 to-ink-100"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white shadow-glow transition group-hover:scale-105">
              <Play className="h-7 w-7 fill-current" />
            </span>
          </button>
          <p className="mt-3 text-xs text-ink-400">Members can play this video in their workout player.</p>
        </div>
      )}

      {/* Exercises / builder */}
      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-brand-400" />
            <h2 className="font-semibold text-ink-900">Exercises</h2>
            <span className="badge bg-ink-100 text-ink-600">{w.exercises.length}</span>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {w.exercises.map((ex, i) => (
            <div key={`${ex.exerciseId}-${i}`} className="rounded-xl border border-ink-100">
              <div className="flex items-center gap-3 border-b border-ink-100 p-3">
                <div className="flex flex-col text-ink-300">
                  <button onClick={() => moveExercise(i, -1)} disabled={i === 0} aria-label="Move up" className="transition hover:text-brand-400 disabled:opacity-30">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => moveExercise(i, 1)} disabled={i === w.exercises.length - 1} aria-label="Move down" className="transition hover:text-brand-400 disabled:opacity-30">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink-900">{ex.name}</div>
                  <div className="text-xs text-ink-500">{ex.muscle}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setVideo({ src: app.exercises.find((e) => e.id === ex.exerciseId)?.video || "", title: ex.name })}
                  disabled={!app.exercises.find((e) => e.id === ex.exerciseId)?.video}
                  className="hidden items-center gap-1.5 rounded-full border border-ink-200 bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-400 disabled:opacity-40 sm:inline-flex"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Demo
                </button>
                <button onClick={() => removeExercise(i)} aria-label={`Remove ${ex.name}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-rose-500/15 hover:text-rose-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
                      <th className="pb-2 pl-1 font-medium">Set</th>
                      <th className="pb-2 font-medium">Reps</th>
                      <th className="pb-2 font-medium">Weight</th>
                      <th className="pb-2 font-medium">Rest</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {ex.sets.map((s, si) => (
                      <tr key={si} className="border-t border-ink-50">
                        <td className="py-1.5 pl-1 font-semibold text-ink-700">{si + 1}</td>
                        <td className="py-1.5 pr-2">
                          <input value={s.reps} onChange={(e) => updateSet(i, si, { reps: e.target.value })} className="input px-2 py-1 text-sm" aria-label={`Reps for set ${si + 1}`} />
                        </td>
                        <td className="py-1.5 pr-2">
                          <input value={s.weight} onChange={(e) => updateSet(i, si, { weight: e.target.value })} className="input px-2 py-1 text-sm" aria-label={`Weight for set ${si + 1}`} />
                        </td>
                        <td className="py-1.5 pr-2">
                          <input value={s.rest} onChange={(e) => updateSet(i, si, { rest: e.target.value })} className="input px-2 py-1 text-sm" aria-label={`Rest for set ${si + 1}`} />
                        </td>
                        <td className="py-1.5">
                          <button onClick={() => removeSet(i, si)} aria-label={`Remove set ${si + 1}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 transition hover:bg-rose-500/15 hover:text-rose-400">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={() => addSet(i)} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-brand-400 hover:text-brand-400">
                  <Plus className="h-3.5 w-3.5" /> Add set
                </button>
              </div>
            </div>
          ))}

          {w.exercises.length === 0 && (
            <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-6 text-center text-sm text-ink-400">
              No exercises yet. Add one from your library below.
            </p>
          )}

          {/* Add exercise */}
          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-ink-200 p-3 sm:flex-row">
            <select value={addExId} onChange={(e) => setAddExId(e.target.value)} className="input flex-1">
              <option value="">
                {unassignedExercises.length === 0 ? "No library exercises — add some first" : "Choose a library exercise…"}
              </option>
              {unassignedExercises.map((e) => (
                <option key={e.id} value={e.id}>{e.name} · {e.muscle}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={addExercise} disabled={!addExId}>
              <Plus className="h-4 w-4" /> Add to workout
            </button>
          </div>
        </div>
      </div>

      {/* Edit details modal */}
      <Modal
        open={editOpen} onClose={() => setEditOpen(false)} title="Edit workout" size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveEdit} disabled={!edit.name.trim()}>Save changes</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <input className="input" value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category"><input className="input" value={edit.category} onChange={(e) => setEdit((s) => ({ ...s, category: e.target.value }))} /></Field>
            <Field label="Duration (min)"><input type="number" className="input" value={edit.durationMin} onChange={(e) => setEdit((s) => ({ ...s, durationMin: e.target.value }))} /></Field>
            <Field label="Difficulty">
              <select className="input" value={edit.difficulty} onChange={(e) => setEdit((s) => ({ ...s, difficulty: e.target.value as (typeof difficulties)[number] }))}>
                {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Tags (comma-separated)">
            <input className="input" value={edit.tags} onChange={(e) => setEdit((s) => ({ ...s, tags: e.target.value }))} placeholder="30 Day Beginner Plan, At home" />
          </Field>
          <Field label="Short description">
            <input className="input" value={edit.description} onChange={(e) => setEdit((s) => ({ ...s, description: e.target.value }))} placeholder="One-line summary shown in the library" />
          </Field>
          <Field label="Instructions">
            <textarea rows={4} className="input resize-none" value={edit.instructions} onChange={(e) => setEdit((s) => ({ ...s, instructions: e.target.value }))} placeholder="Coaching notes the member sees before starting…" />
          </Field>
          <Field label="Video workout URL (optional)">
            <input className="input" value={edit.video} onChange={(e) => setEdit((s) => ({ ...s, video: e.target.value }))} placeholder="YouTube / Vimeo / .mp4 link" />
          </Field>
        </div>
      </Modal>

      {/* Assign modal */}
      <Modal
        open={assignOpen} onClose={() => setAssignOpen(false)} title={`Assign “${w.name}”`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAssignOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={confirmAssign} disabled={assignClients.size === 0}>
              Assign to {assignClients.size || "—"}
            </button>
          </>
        }
      >
        {myClients.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">No clients yet. Add clients to assign workouts.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-ink-500">They&apos;ll see this workout in their plan right away.</p>
            <div className="max-h-72 space-y-1.5 overflow-y-auto scroll-thin">
              {myClients.map((cl) => {
                const checked = assignClients.has(cl.id);
                const already = (app.clientPlans[cl.id]?.workoutIds ?? []).includes(w.id);
                return (
                  <button
                    key={cl.id} type="button"
                    onClick={() => setAssignClients((s) => { const n = new Set(s); n.has(cl.id) ? n.delete(cl.id) : n.add(cl.id); return n; })}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition",
                      checked ? "border-brand-300 bg-brand-50/50" : "border-ink-100 hover:border-brand-200",
                    )}
                  >
                    <Avatar initials={cl.avatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink-900">{cl.name}</div>
                      <div className="truncate text-xs text-ink-500">{already ? "Already assigned" : cl.program}</div>
                    </div>
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", checked ? "border-brand-500 bg-brand-600 text-white" : "border-ink-300")}>
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete workout" size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button className="btn border border-rose-200 bg-rose-600 text-white hover:bg-rose-700" onClick={doDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          Delete <span className="font-semibold text-ink-900">{w.name}</span>? It will also be removed from any client plans it&apos;s in. This cannot be undone.
        </p>
      </Modal>

      <VideoModal open={!!video} onClose={() => setVideo(null)} src={video?.src ?? ""} title={video?.title} />
    </>
  );
}
