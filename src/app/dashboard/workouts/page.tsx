"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus, Dumbbell, Layers, Library, GripVertical, Clock, Search,
  Play, Users, Trash2, Loader2, ChevronRight, ArrowUp, ArrowDown, X, Copy, Pencil,
  Eye, UserPlus, Check,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { VideoModal } from "@/components/ui/VideoModal";
import { ExerciseAnimation } from "@/components/ui/ExerciseAnimation";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { MediaEditor } from "@/components/MediaEditor";
import { MediaGallery } from "@/components/MediaGallery";
import { WorkoutBuilder } from "@/components/WorkoutBuilder";
import { Avatar } from "@/components/ui/Avatar";
import type { Workout, Exercise, Program, TrainingMedia } from "@/lib/data";
import { sampleVideo } from "@/lib/media";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Tab = "programs" | "workouts" | "library";

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "programs", label: "Programs", icon: Layers },
  { id: "workouts", label: "Workouts", icon: Dumbbell },
  { id: "library", label: "Exercise Library", icon: Library },
];

const exerciseTypes = ["All", "Strength", "Cardio", "Mobility", "Core"] as const;
const difficulties = ["Beginner", "Intermediate", "Advanced"] as const;
const levels = ["Beginner", "Intermediate", "Advanced"] as const;
const types = ["Strength", "Cardio", "Mobility", "Core"] as const;

const colorPresets: { label: string; value: string }[] = [
  { label: "Brand", value: "from-brand-500 to-brand-700" },
  { label: "Accent", value: "from-accent-500 to-accent-700" },
  { label: "Amber", value: "from-amber-500 to-amber-700" },
  { label: "Rose", value: "from-rose-500 to-rose-700" },
  { label: "Violet", value: "from-violet-500 to-violet-700" },
];

function difficultyClasses(level: string) {
  switch (level) {
    case "Beginner":
      return "bg-accent-500/15 text-accent-400";
    case "Intermediate":
      return "bg-brand-500/15 text-brand-400";
    case "Advanced":
      return "bg-rose-500/15 text-rose-400";
    default:
      return "bg-ink-100 text-ink-600";
  }
}

export default function TrainingPage() {
  const app = useApp();
  const [tab, setTab] = useState<Tab>("programs");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof exerciseTypes)[number]>("All");
  const [video, setVideo] = useState<{ src: string; title: string } | null>(null);

  // Modal state
  const [workoutModal, setWorkoutModal] = useState(false);
  const [programModal, setProgramModal] = useState(false);
  const [exerciseModal, setExerciseModal] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [viewProgramId, setViewProgramId] = useState<string | null>(null);
  const [assignProgramId, setAssignProgramId] = useState<string | null>(null);

  // Deep-link: /dashboard/workouts?select=<workoutId> opens that workout's
  // builder directly (used by the Program builder's "Build" buttons).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sel = params.get("select");
    if (sel) {
      setTab("workouts");
      setSelectedId(sel);
    }
  }, []);

  // Workout form
  const [wName, setWName] = useState("");
  const [wCategory, setWCategory] = useState("Strength");
  const [wDuration, setWDuration] = useState("45");
  const [wDifficulty, setWDifficulty] = useState<(typeof difficulties)[number]>("Beginner");
  const [wInstructions, setWInstructions] = useState("");
  const [wMedia, setWMedia] = useState<TrainingMedia[]>([]);

  // Program form
  const [pName, setPName] = useState("");
  const [pWeeks, setPWeeks] = useState("8");
  const [pPerWeek, setPPerWeek] = useState("3");
  const [pFocus, setPFocus] = useState("General");
  const [pColor, setPColor] = useState(colorPresets[0].value);
  const [pInstructions, setPInstructions] = useState("");
  const [pMedia, setPMedia] = useState<TrainingMedia[]>([]);

  // Exercise form
  const [eName, setEName] = useState("");
  const [eMuscle, setEMuscle] = useState("");
  const [eEquipment, setEEquipment] = useState("");
  const [eLevel, setELevel] = useState<(typeof levels)[number]>("Beginner");
  const [eType, setEType] = useState<(typeof types)[number]>("Strength");
  const [eVideo, setEVideo] = useState("");
  const [eInstructions, setEInstructions] = useState("");

  const filteredExercises = useMemo(() => {
    return app.exercises.filter((e) => {
      const matchesType = typeFilter === "All" || e.type === typeFilter;
      const matchesQuery =
        query.trim() === "" ||
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.muscle.toLowerCase().includes(query.toLowerCase()) ||
        e.equipment.toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [app.exercises, typeFilter, query]);

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const selectedWorkout: Workout | null =
    app.workouts.find((w) => w.id === selectedId) ?? app.workouts[0] ?? null;

  function submitWorkout() {
    if (!wName.trim()) return;
    if (editingWorkoutId) {
      app.updateWorkout(editingWorkoutId, {
        name: wName.trim(),
        category: wCategory.trim() || "Strength",
        durationMin: Number(wDuration) || 45,
        difficulty: wDifficulty,
        instructions: wInstructions.trim() || undefined,
        media: wMedia.length ? wMedia : undefined,
      });
    } else {
      const w = app.addWorkout({
        name: wName.trim(),
        category: wCategory.trim() || "Strength",
        durationMin: Number(wDuration) || 45,
        difficulty: wDifficulty,
        exercises: [],
        instructions: wInstructions.trim() || undefined,
        media: wMedia.length ? wMedia : undefined,
      });
      setSelectedId(w.id);
    }
    setWName("");
    setWCategory("Strength");
    setWDuration("45");
    setWDifficulty("Beginner");
    setWInstructions("");
    setWMedia([]);
    setEditingWorkoutId(null);
    setWorkoutModal(false);
  }

  function openCreateWorkout() {
    setEditingWorkoutId(null);
    setWName("");
    setWCategory("Strength");
    setWDuration("45");
    setWDifficulty("Beginner");
    setWInstructions("");
    setWMedia([]);
    setWorkoutModal(true);
  }

  function openEditWorkout(w: Workout) {
    setEditingWorkoutId(w.id);
    setWName(w.name);
    setWCategory(w.category);
    setWDuration(String(w.durationMin));
    setWDifficulty(w.difficulty);
    setWInstructions(w.instructions ?? "");
    setWMedia(w.media ?? []);
    setWorkoutModal(true);
  }

  function submitProgram() {
    if (!pName.trim()) return;
    if (editingProgramId) {
      app.updateProgram(editingProgramId, {
        name: pName.trim(),
        weeks: Number(pWeeks) || 8,
        workoutsPerWeek: Number(pPerWeek) || 3,
        focus: pFocus.trim() || "General",
        color: pColor,
        instructions: pInstructions.trim() || undefined,
        media: pMedia.length ? pMedia : undefined,
      });
    } else {
      app.addProgram({
        name: pName.trim(),
        weeks: Number(pWeeks) || 8,
        workoutsPerWeek: Number(pPerWeek) || 3,
        focus: pFocus.trim() || "General",
        color: pColor,
        instructions: pInstructions.trim() || undefined,
        media: pMedia.length ? pMedia : undefined,
      });
    }
    setPName("");
    setPWeeks("8");
    setPPerWeek("3");
    setPFocus("General");
    setPColor(colorPresets[0].value);
    setPInstructions("");
    setPMedia([]);
    setEditingProgramId(null);
    setProgramModal(false);
  }

  function openCreateProgram() {
    setEditingProgramId(null);
    setPName("");
    setPWeeks("8");
    setPPerWeek("3");
    setPFocus("General");
    setPColor(colorPresets[0].value);
    setPInstructions("");
    setPMedia([]);
    setProgramModal(true);
  }

  function openEditProgram(p: Program) {
    setEditingProgramId(p.id);
    setPName(p.name);
    setPWeeks(String(p.weeks));
    setPPerWeek(String(p.workoutsPerWeek));
    setPFocus(p.focus);
    setPColor(p.color);
    setPInstructions(p.instructions ?? "");
    setPMedia(p.media ?? []);
    setProgramModal(true);
  }

  function submitExercise() {
    if (!eName.trim()) return;
    const payload = {
      name: eName.trim(),
      muscle: eMuscle.trim() || "Full body",
      equipment: eEquipment.trim() || "Bodyweight",
      level: eLevel,
      type: eType,
      video: eVideo.trim() || undefined,
      instructions: eInstructions.trim() || undefined,
    };
    if (editingExerciseId) {
      app.updateExercise(editingExerciseId, payload);
    } else {
      app.addExercise(payload);
    }
    setEName("");
    setEMuscle("");
    setEEquipment("");
    setELevel("Beginner");
    setEType("Strength");
    setEVideo("");
    setEInstructions("");
    setEditingExerciseId(null);
    setExerciseModal(false);
  }

  function openCreateExercise() {
    setEditingExerciseId(null);
    setEName("");
    setEMuscle("");
    setEEquipment("");
    setELevel("Beginner");
    setEType("Strength");
    setEVideo("");
    setEInstructions("");
    setExerciseModal(true);
  }

  function openEditExercise(ex: Exercise) {
    setEditingExerciseId(ex.id);
    setEName(ex.name);
    setEMuscle(ex.muscle);
    setEEquipment(ex.equipment);
    setELevel(ex.level);
    setEType(ex.type);
    setEVideo(ex.video ?? "");
    setEInstructions(ex.instructions ?? "");
    setExerciseModal(true);
  }

  function duplicateWorkout(w: Workout) {
    const copy = app.addWorkout({
      name: `${w.name} (copy)`,
      category: w.category,
      durationMin: w.durationMin,
      difficulty: w.difficulty,
      exercises: w.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) })),
    });
    setSelectedId(copy.id);
  }

  return (
    <>
      <PageHeader
        title="Training"
        subtitle="Build programs, workouts and browse the exercise library"
        action={
          <button className="btn-primary" onClick={openCreateWorkout}>
            <Plus className="h-4 w-4" />
            Create workout
          </button>
        }
      />

      {/* Tab nav */}
      <div className="mb-6 inline-flex rounded-full border border-ink-100 bg-ink-50 p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                active
                  ? "bg-ink-100 text-ink-900 shadow-soft"
                  : "text-ink-500 hover:text-ink-800",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Programs tab */}
      {tab === "programs" && (
        <>
          <div className="mb-4 flex justify-end">
            <button className="btn-secondary" onClick={openCreateProgram}>
              <Plus className="h-4 w-4" />
              New program
            </button>
          </div>
          {app.programs.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No programs yet"
              description="Create a multi-week program to assign to your clients."
              action={
                <button className="btn-primary" onClick={openCreateProgram}>
                  <Plus className="h-4 w-4" />
                  Create program
                </button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {app.programs.map((p) => {
                const cover = p.media?.find((m) => m.type === "image");
                const assignedCount = app.clients.filter((c) => app.clientPlans[c.id]?.programId === p.id).length;
                return (
                <div key={p.id} className="card overflow-hidden">
                  <button onClick={() => setViewProgramId(p.id)} className="block w-full text-left">
                    <div className={cn("relative h-28 bg-gradient-to-br p-4 text-white", !cover && p.color)}>
                      {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover.url} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
                      )}
                      <span className="relative badge bg-black/30 text-white backdrop-blur-sm">
                        {p.focus}
                      </span>
                      {!cover && <Dumbbell className="absolute bottom-3 right-3 h-10 w-10 text-white/25" />}
                    </div>
                  </button>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-ink-900">{p.name}</h3>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          onClick={() => openEditProgram(p)}
                          aria-label={`Edit ${p.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => app.removeProgram(p.id)}
                          aria-label={`Delete ${p.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-rose-500/15 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-ink-500">
                      {p.weeks} weeks · {p.workoutsPerWeek}×/wk
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
                      <Users className="h-3.5 w-3.5" />
                      {assignedCount} {assignedCount === 1 ? "client" : "clients"} assigned
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setViewProgramId(p.id)} className="btn-secondary flex-1 py-2 text-sm">
                        <Eye className="h-4 w-4" /> View
                      </button>
                      <button onClick={() => setAssignProgramId(p.id)} className="btn-primary flex-1 py-2 text-sm">
                        <UserPlus className="h-4 w-4" /> Assign
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Workouts tab — builder */}
      {tab === "workouts" && (
        app.workouts.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No workouts yet"
            description="Create your first workout, then add exercises from your library."
            action={
              <button className="btn-primary" onClick={openCreateWorkout}>
                <Plus className="h-4 w-4" />
                Create workout
              </button>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Clean workout list (Trainerize-style rows) */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-ink-900">Your workouts</h2>
                <span className="badge bg-ink-100 text-ink-600">{app.workouts.length}</span>
              </div>
              <div className="divide-y divide-ink-100">
                {app.workouts.map((w) => {
                  const active = selectedWorkout?.id === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => setSelectedId(w.id)}
                      className={cn(
                        "flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-ink-50",
                        active && "bg-brand-500/10",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                          active ? "bg-brand-600 text-white" : "bg-brand-500/15 text-brand-400",
                        )}
                      >
                        <Dumbbell className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-ink-900">{w.name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-500">
                          <span>{w.category}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> est. {w.durationMin} min
                          </span>
                          <span>·</span>
                          <span>{w.exercises.length} exercises</span>
                        </div>
                      </div>
                      <span className={cn("badge hidden sm:inline-flex", difficultyClasses(w.difficulty))}>
                        {w.difficulty}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail / builder panel */}
            {selectedWorkout && (
              <div className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-ink-900">{selectedWorkout.name}</h2>
                      <span className={cn("badge", difficultyClasses(selectedWorkout.difficulty))}>
                        {selectedWorkout.difficulty}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-ink-500">
                      <span>{selectedWorkout.category}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {selectedWorkout.durationMin} min
                      </span>
                      <span>{selectedWorkout.exercises.length} exercises</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditWorkout(selectedWorkout)}
                      className="btn-secondary"
                      title="Edit workout details"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => duplicateWorkout(selectedWorkout)}
                      className="btn-secondary"
                      title="Create an editable copy"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        app.removeWorkout(selectedWorkout.id);
                        setSelectedId(null);
                      }}
                      className="btn-secondary text-rose-400 hover:bg-rose-500/15"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <WorkoutBuilder workoutId={selectedWorkout.id} />
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Exercise Library tab */}
      {tab === "library" && (
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search exercises…"
                className="input pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {exerciseTypes.map((t) => {
                const active = typeFilter === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                      active
                        ? "bg-brand-600 text-white"
                        : "border border-ink-200 bg-ink-100 text-ink-600 hover:border-ink-300 hover:bg-ink-50",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
              <button className="btn-primary ml-1" onClick={openCreateExercise}>
                <Plus className="h-4 w-4" />
                Add exercise
              </button>
            </div>
          </div>

          {app.exercises.length === 0 ? (
            <EmptyState
              icon={Library}
              title="No exercises yet"
              description="Build your exercise library to use in workouts."
              action={
                <button className="btn-primary" onClick={openCreateExercise}>
                  <Plus className="h-4 w-4" />
                  Add exercise
                </button>
              }
            />
          ) : filteredExercises.length === 0 ? (
            <div className="card p-12 text-center text-sm text-ink-400">
              No exercises match your search.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredExercises.map((ex) => (
                <div key={ex.id} className="card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => ex.video && setVideo({ src: ex.video, title: ex.name })}
                    aria-label={ex.video ? `Play ${ex.name} demo video` : `${ex.name} animation`}
                    className="group/play relative block h-32 w-full"
                  >
                    <ExerciseAnimation name={ex.name} pattern={ex.pattern} className="h-full w-full" />
                    {ex.video && (
                      <span className="absolute inset-0 flex items-center justify-center bg-ink-950/30 opacity-0 transition group-hover/play:opacity-100">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
                          <Play className="h-5 w-5 fill-current" />
                        </span>
                      </span>
                    )}
                    <span className="absolute right-2 top-2 badge bg-ink-950/50 text-white backdrop-blur-sm">
                      {ex.type}
                    </span>
                  </button>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-ink-900">{ex.name}</h3>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          onClick={() => openEditExercise(ex)}
                          aria-label={`Edit ${ex.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => app.removeExercise(ex.id)}
                          aria-label={`Remove ${ex.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-rose-500/15 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {ex.muscle} · {ex.equipment}
                    </p>
                    <span className={cn("badge mt-3", difficultyClasses(ex.level))}>
                      {ex.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / edit workout modal */}
      <Modal
        open={workoutModal}
        onClose={() => { setWorkoutModal(false); setEditingWorkoutId(null); }}
        title={editingWorkoutId ? "Edit workout" : "Create workout"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setWorkoutModal(false); setEditingWorkoutId(null); }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submitWorkout} disabled={!wName.trim()}>
              {editingWorkoutId ? "Save changes" : "Create"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <input
              className="input"
              value={wName}
              onChange={(e) => setWName(e.target.value)}
              placeholder="Upper body strength"
              autoFocus
            />
          </Field>
          <Field label="Category">
            <input
              className="input"
              value={wCategory}
              onChange={(e) => setWCategory(e.target.value)}
              placeholder="Strength"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration (min)">
              <input
                type="number"
                className="input"
                value={wDuration}
                onChange={(e) => setWDuration(e.target.value)}
              />
            </Field>
            <Field label="Difficulty">
              <select
                className="input"
                value={wDifficulty}
                onChange={(e) => setWDifficulty(e.target.value as (typeof difficulties)[number])}
              >
                {difficulties.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Trainer instructions (shown to client)">
            <textarea
              className="input resize-none"
              rows={3}
              value={wInstructions}
              onChange={(e) => setWInstructions(e.target.value)}
              placeholder="Say something about this workout — goals, tips, what to focus on…"
            />
          </Field>
          <Field label="Pictures & videos (shown to client)">
            <MediaEditor media={wMedia} onChange={setWMedia} />
          </Field>
        </div>
      </Modal>

      {/* New / edit program modal */}
      <Modal
        open={programModal}
        onClose={() => { setProgramModal(false); setEditingProgramId(null); }}
        title={editingProgramId ? "Edit program" : "New program"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setProgramModal(false); setEditingProgramId(null); }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submitProgram} disabled={!pName.trim()}>
              {editingProgramId ? "Save changes" : "Create"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <input
              className="input"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="12-Week Hypertrophy"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Weeks">
              <input
                type="number"
                className="input"
                value={pWeeks}
                onChange={(e) => setPWeeks(e.target.value)}
              />
            </Field>
            <Field label="Workouts / week">
              <input
                type="number"
                className="input"
                value={pPerWeek}
                onChange={(e) => setPPerWeek(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Focus">
            <input
              className="input"
              value={pFocus}
              onChange={(e) => setPFocus(e.target.value)}
              placeholder="Strength, Fat loss…"
            />
          </Field>
          <Field label="Color">
            <div className="mt-1 flex flex-wrap gap-2">
              {colorPresets.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setPColor(c.value)}
                  aria-label={c.label}
                  className={cn(
                    "h-9 w-9 rounded-lg bg-gradient-to-br ring-offset-2 transition",
                    c.value,
                    pColor === c.value ? "ring-2 ring-brand-500" : "ring-0",
                  )}
                />
              ))}
            </div>
          </Field>
          <Field label="Trainer instructions (shown to client)">
            <textarea
              className="input resize-none"
              rows={3}
              value={pInstructions}
              onChange={(e) => setPInstructions(e.target.value)}
              placeholder="Say something about this training phase — goals, focus, mindset…"
            />
          </Field>
          <Field label="Pictures & videos (shown to client)">
            <MediaEditor media={pMedia} onChange={setPMedia} />
          </Field>
        </div>
      </Modal>

      {/* Add exercise modal */}
      <Modal
        open={exerciseModal}
        onClose={() => { setExerciseModal(false); setEditingExerciseId(null); }}
        title={editingExerciseId ? "Edit exercise" : "Add exercise"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setExerciseModal(false); setEditingExerciseId(null); }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submitExercise} disabled={!eName.trim()}>
              {editingExerciseId ? "Save changes" : "Add"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <input
              className="input"
              value={eName}
              onChange={(e) => setEName(e.target.value)}
              placeholder="Barbell Back Squat"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Muscle">
              <input
                className="input"
                value={eMuscle}
                onChange={(e) => setEMuscle(e.target.value)}
                placeholder="Quads"
              />
            </Field>
            <Field label="Equipment">
              <input
                className="input"
                value={eEquipment}
                onChange={(e) => setEEquipment(e.target.value)}
                placeholder="Barbell"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Level">
              <select
                className="input"
                value={eLevel}
                onChange={(e) => setELevel(e.target.value as (typeof levels)[number])}
              >
                {levels.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Type">
              <select
                className="input"
                value={eType}
                onChange={(e) => setEType(e.target.value as (typeof types)[number])}
              >
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Demo video URL (optional)">
            <input
              className="input"
              value={eVideo}
              onChange={(e) => setEVideo(e.target.value)}
              placeholder="YouTube, Vimeo, Loom or .mp4 link"
            />
            <p className="mt-1 text-xs text-ink-400">
              Paste a YouTube/Vimeo/Loom link or a direct video URL. Leave blank to use a sample demo.
            </p>
          </Field>
          <Field label="Written instructions (optional)">
            <textarea
              className="input min-h-[88px] resize-none"
              value={eInstructions}
              onChange={(e) => setEInstructions(e.target.value)}
              placeholder="How to perform it: setup, execution, breathing and key form cues…"
            />
            <p className="mt-1 text-xs text-ink-400">
              Shown to clients and pre-filled as the default coaching note when you add this exercise to a workout.
            </p>
          </Field>
        </div>
      </Modal>

      {/* View program modal */}
      {(() => {
        const p = app.programs.find((x) => x.id === viewProgramId);
        if (!p) return null;
        const workouts = (p.workoutIds ?? [])
          .map((id) => app.workouts.find((w) => w.id === id))
          .filter((w): w is Workout => Boolean(w));
        return (
          <Modal
            open={!!viewProgramId}
            onClose={() => setViewProgramId(null)}
            title={p.name}
            size="lg"
            footer={
              <>
                <button className="btn-secondary" onClick={() => setViewProgramId(null)}>Close</button>
                <button className="btn-primary" onClick={() => { setAssignProgramId(p.id); setViewProgramId(null); }}>
                  <UserPlus className="h-4 w-4" /> Assign to client
                </button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
                <span className="badge bg-brand-500/15 text-brand-400">{p.focus}</span>
                <span>{p.weeks} weeks · {p.workoutsPerWeek}×/wk</span>
              </div>
              {p.instructions && (
                <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 text-sm text-ink-700">
                  {p.instructions}
                </div>
              )}
              {p.media && p.media.length > 0 && <MediaGallery media={p.media} />}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-ink-900">Workouts in this program</h3>
                {workouts.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-4 text-center text-sm text-ink-400">
                    No workouts added yet. Edit the program to add workouts.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {workouts.map((w) => (
                      <div key={w.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                          <Dumbbell className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-ink-900">{w.name}</div>
                          <div className="text-xs text-ink-400">{w.durationMin} min · {w.exercises.length} exercises</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Assign program modal */}
      {(() => {
        const p = app.programs.find((x) => x.id === assignProgramId);
        if (!p) return null;
        return (
          <Modal
            open={!!assignProgramId}
            onClose={() => setAssignProgramId(null)}
            title={`Assign "${p.name}"`}
            footer={<button className="btn-primary" onClick={() => setAssignProgramId(null)}>Done</button>}
          >
            <div className="space-y-2">
              {app.clients.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-4 text-center text-sm text-ink-400">
                  No clients yet. Add a client first.
                </p>
              ) : (
                app.clients.map((c) => {
                  const assigned = app.clientPlans[c.id]?.programId === p.id;
                  return (
                    <div key={c.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                      <Avatar initials={c.avatar} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink-900">{c.name}</div>
                        <div className="truncate text-xs text-ink-400">{c.email}</div>
                      </div>
                      <button
                        onClick={() => app.setClientProgram(c.id, p.id)}
                        disabled={assigned}
                        className={assigned ? "btn-secondary px-3 py-1.5 text-sm" : "btn-primary px-3 py-1.5 text-sm"}
                      >
                        {assigned ? <><Check className="h-3.5 w-3.5" /> Assigned</> : "Assign"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </Modal>
        );
      })()}

      <VideoModal
        open={!!video}
        onClose={() => setVideo(null)}
        src={video?.src ?? ""}
        title={video?.title}
      />
    </>
  );
}
