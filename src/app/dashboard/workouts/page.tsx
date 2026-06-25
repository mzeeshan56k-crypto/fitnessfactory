"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Dumbbell, Layers, Library, Clock, Search, Play, Users, Trash2,
  Loader2, Tag, Copy, ChevronRight, Check, FolderOpen, Hash, X,
  ArrowUpDown, ListChecks, Video as VideoIcon, UtensilsCrossed, Flame, Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { VideoModal } from "@/components/ui/VideoModal";
import { ExerciseAnimation } from "@/components/ui/ExerciseAnimation";
import { WorkoutThumb } from "@/components/ui/WorkoutThumb";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { DataControls } from "@/components/dashboard/DataControls";
import { Avatar } from "@/components/ui/Avatar";
import type { Workout, Recipe, MealType } from "@/lib/data";
import { useApp, useMyClients } from "@/lib/store";
import { cn, shortDate } from "@/lib/utils";
import { posterFor } from "@/lib/media";

type Tab = "workouts" | "exercises" | "meals" | "programs";
type SortKey = "name" | "recent" | "duration";
type RecipeSortKey = "recent" | "name" | "calories";

const NO_TAGS = "__none__";
const ALL_MEALS = "All";
const MEAL_TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];

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
    case "Beginner": return "bg-accent-500/15 text-accent-400";
    case "Intermediate": return "bg-brand-500/15 text-brand-400";
    case "Advanced": return "bg-rose-500/15 text-rose-400";
    default: return "bg-ink-100 text-ink-600";
  }
}

export default function MasterLibrariesPage() {
  const app = useApp();
  const myClients = useMyClients();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("workouts");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null); // null=All, NO_TAGS=untagged
  const [sort, setSort] = useState<SortKey>("recent");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<(typeof exerciseTypes)[number]>("All");
  const [video, setVideo] = useState<{ src: string; title: string } | null>(null);

  // Modals
  const [workoutModal, setWorkoutModal] = useState(false);
  const [programModal, setProgramModal] = useState(false);
  const [exerciseModal, setExerciseModal] = useState(false);
  const [tagModal, setTagModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);

  // New-workout form
  const [wName, setWName] = useState("");
  const [wCategory, setWCategory] = useState("Strength");
  const [wDuration, setWDuration] = useState("45");
  const [wDifficulty, setWDifficulty] = useState<(typeof difficulties)[number]>("Beginner");
  const [wVideo, setWVideo] = useState("");

  // New-program form
  const [pName, setPName] = useState("");
  const [pWeeks, setPWeeks] = useState("8");
  const [pPerWeek, setPPerWeek] = useState("3");
  const [pFocus, setPFocus] = useState("General");
  const [pColor, setPColor] = useState(colorPresets[0].value);

  // New-exercise form
  const [eName, setEName] = useState("");
  const [eMuscle, setEMuscle] = useState("");
  const [eEquipment, setEEquipment] = useState("");
  const [eLevel, setELevel] = useState<(typeof levels)[number]>("Beginner");
  const [eType, setEType] = useState<(typeof types)[number]>("Strength");
  const [eVideo, setEVideo] = useState("");

  // Tag + assign forms
  const [tagInput, setTagInput] = useState("");
  const [assignClients, setAssignClients] = useState<Set<string>>(new Set());

  // Meals state
  const [mealFilter, setMealFilter] = useState<string>(ALL_MEALS); // All | Breakfast | …
  const [recipeSort, setRecipeSort] = useState<RecipeSortKey>("recent");
  const [recipeModal, setRecipeModal] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [rForm, setRForm] = useState({
    name: "", calories: "", protein: "", carbs: "", fat: "", servings: "1",
    mealTypes: new Set<MealType>(["Lunch"]), photo: "", ingredients: "", instructions: "",
  });

  // --- Tag folders (derived from workout usage) ---
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let untagged = 0;
    for (const w of app.workouts) {
      const tags = w.tags ?? [];
      if (tags.length === 0) untagged += 1;
      for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return { counts: [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])), untagged };
  }, [app.workouts]);

  // --- Filtered + sorted workouts ---
  const visibleWorkouts = useMemo(() => {
    let list = app.workouts.filter((w) => {
      if (activeTag === NO_TAGS && (w.tags?.length ?? 0) > 0) return false;
      if (activeTag && activeTag !== NO_TAGS && !(w.tags ?? []).includes(activeTag)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const inExercises = w.exercises.some((ex) => ex.name.toLowerCase().includes(q));
        if (
          !w.name.toLowerCase().includes(q) &&
          !w.category.toLowerCase().includes(q) &&
          !(w.description ?? "").toLowerCase().includes(q) &&
          !inExercises
        ) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "duration") return a.durationMin - b.durationMin;
      // recent
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
    return list;
  }, [app.workouts, activeTag, query, sort]);

  const filteredExercises = useMemo(() => {
    return app.exercises.filter((e) => {
      const matchesType = typeFilter === "All" || e.type === typeFilter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q === "" ||
        e.name.toLowerCase().includes(q) ||
        e.muscle.toLowerCase().includes(q) ||
        e.equipment.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [app.exercises, typeFilter, query]);

  // --- Meal-type folders + filtered/sorted recipes ---
  const mealCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of MEAL_TYPES) counts.set(t, 0);
    for (const r of app.recipes) for (const t of r.mealTypes) counts.set(t, (counts.get(t) ?? 0) + 1);
    return counts;
  }, [app.recipes]);

  const visibleRecipes = useMemo(() => {
    let list = app.recipes.filter((r) => {
      if (mealFilter !== ALL_MEALS && !r.mealTypes.includes(mealFilter as MealType)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !r.mealTypes.join(" ").toLowerCase().includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (recipeSort === "name") return a.name.localeCompare(b.name);
      if (recipeSort === "calories") return a.calories - b.calories;
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
    return list;
  }, [app.recipes, mealFilter, query, recipeSort]);

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  /* ----- selection helpers ----- */
  const visibleIds = visibleWorkouts.map((w) => w.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleSelectAll = () =>
    setSelected((s) => {
      if (visibleIds.every((id) => s.has(id))) return new Set();
      return new Set(visibleIds);
    });
  const clearSelection = () => setSelected(new Set());

  /* ----- create flows ----- */
  function submitWorkout() {
    if (!wName.trim()) return;
    const created = app.addWorkout({
      name: wName.trim(),
      category: wCategory.trim() || "Strength",
      durationMin: Number(wDuration) || 45,
      difficulty: wDifficulty,
      video: wVideo.trim() || undefined,
      tags: activeTag && activeTag !== NO_TAGS ? [activeTag] : [],
      exercises: [],
    });
    setWName(""); setWCategory("Strength"); setWDuration("45"); setWDifficulty("Beginner"); setWVideo("");
    setWorkoutModal(false);
    app.notify(`Created “${created.name}”`);
    router.push(`/dashboard/workouts/${created.id}`);
  }

  function submitProgram() {
    if (!pName.trim()) return;
    app.addProgram({
      name: pName.trim(), weeks: Number(pWeeks) || 8, workoutsPerWeek: Number(pPerWeek) || 3,
      focus: pFocus.trim() || "General", color: pColor,
    });
    setPName(""); setPWeeks("8"); setPPerWeek("3"); setPFocus("General"); setPColor(colorPresets[0].value);
    setProgramModal(false);
    app.notify("Program created");
  }

  function submitExercise() {
    if (!eName.trim()) return;
    app.addExercise({
      name: eName.trim(), muscle: eMuscle.trim() || "Full body", equipment: eEquipment.trim() || "Bodyweight",
      level: eLevel, type: eType, video: eVideo.trim() || undefined,
    });
    setEName(""); setEMuscle(""); setEEquipment(""); setELevel("Beginner"); setEType("Strength"); setEVideo("");
    setExerciseModal(false);
    app.notify("Exercise added to library");
  }

  /* ----- recipe flows ----- */
  function openNewRecipe() {
    setEditingRecipeId(null);
    setRForm({
      name: "", calories: "", protein: "", carbs: "", fat: "", servings: "1",
      mealTypes: new Set<MealType>(mealFilter !== ALL_MEALS ? [mealFilter as MealType] : ["Lunch"]),
      photo: "", ingredients: "", instructions: "",
    });
    setRecipeModal(true);
  }
  function openEditRecipe(r: Recipe) {
    setEditingRecipeId(r.id);
    setRForm({
      name: r.name, calories: String(r.calories), protein: r.protein != null ? String(r.protein) : "",
      carbs: r.carbs != null ? String(r.carbs) : "", fat: r.fat != null ? String(r.fat) : "",
      servings: String(r.servings ?? 1), mealTypes: new Set(r.mealTypes),
      photo: r.photo ?? "", ingredients: (r.ingredients ?? []).join(", "), instructions: r.instructions ?? "",
    });
    setRecipeModal(true);
  }
  function toggleRecipeMealType(t: MealType) {
    setRForm((s) => {
      const next = new Set(s.mealTypes);
      next.has(t) ? next.delete(t) : next.add(t);
      return { ...s, mealTypes: next };
    });
  }
  function submitRecipe() {
    if (!rForm.name.trim()) return;
    const payload: Partial<Recipe> = {
      name: rForm.name.trim(),
      calories: Number(rForm.calories) || 0,
      protein: rForm.protein ? Number(rForm.protein) : undefined,
      carbs: rForm.carbs ? Number(rForm.carbs) : undefined,
      fat: rForm.fat ? Number(rForm.fat) : undefined,
      servings: Number(rForm.servings) || 1,
      mealTypes: rForm.mealTypes.size ? [...rForm.mealTypes] : ["Lunch"],
      photo: rForm.photo.trim() || undefined,
      ingredients: rForm.ingredients.split(",").map((i) => i.trim()).filter(Boolean),
      instructions: rForm.instructions.trim() || undefined,
    };
    if (editingRecipeId) {
      app.updateRecipe(editingRecipeId, payload);
      app.notify("Recipe updated");
    } else {
      app.addRecipe(payload);
      app.notify(`Added “${payload.name}” to meals`);
    }
    setRecipeModal(false);
  }

  /* ----- bulk actions ----- */
  function bulkDuplicate() {
    selected.forEach((id) => app.duplicateWorkout(id));
    app.notify(`Duplicated ${selected.size} workout${selected.size === 1 ? "" : "s"}`);
    clearSelection();
  }
  function bulkDelete() {
    const n = selected.size;
    selected.forEach((id) => app.removeWorkout(id));
    app.notify(`Deleted ${n} workout${n === 1 ? "" : "s"}`, "info");
    clearSelection();
  }
  function applyTag() {
    const t = tagInput.trim();
    if (!t) return;
    selected.forEach((id) => {
      const w = app.workouts.find((x) => x.id === id);
      if (!w) return;
      const tags = Array.from(new Set([...(w.tags ?? []), t]));
      app.updateWorkout(id, { tags });
    });
    app.notify(`Tagged ${selected.size} workout${selected.size === 1 ? "" : "s"} with “${t}”`);
    setTagInput(""); setTagModal(false); clearSelection();
  }
  function confirmAssign() {
    if (assignClients.size === 0 || selected.size === 0) return;
    app.assignWorkoutToClients([...selected], [...assignClients]);
    app.notify(`Assigned ${selected.size} workout${selected.size === 1 ? "" : "s"} to ${assignClients.size} client${assignClients.size === 1 ? "" : "s"}`);
    setAssignModal(false); setAssignClients(new Set()); clearSelection();
  }

  const tabMeta: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: "workouts", label: "Workouts", icon: Dumbbell, count: app.workouts.length },
    { id: "exercises", label: "Exercises", icon: Library, count: app.exercises.length },
    { id: "meals", label: "Meals", icon: UtensilsCrossed, count: app.recipes.length },
    { id: "programs", label: "Programs", icon: Layers, count: app.programs.length },
  ];

  return (
    <>
      <PageHeader
        title="Master Libraries"
        subtitle="Build, organize and assign your workouts, exercises and programs."
        action={
          tab === "workouts" ? (
            <button className="btn-primary" onClick={() => setWorkoutModal(true)}>
              <Plus className="h-4 w-4" /> New workout
            </button>
          ) : tab === "exercises" ? (
            <button className="btn-primary" onClick={() => setExerciseModal(true)}>
              <Plus className="h-4 w-4" /> Add exercise
            </button>
          ) : tab === "meals" ? (
            <button className="btn-primary" onClick={openNewRecipe}>
              <Plus className="h-4 w-4" /> New recipe
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setProgramModal(true)}>
              <Plus className="h-4 w-4" /> New program
            </button>
          )
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left rail */}
        <aside className="shrink-0 lg:w-60">
          <div className="card p-3">
            <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Library</p>
            <div className="space-y-1">
              {tabMeta.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); clearSelection(); }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active ? "bg-brand-500/15 text-brand-400" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                    )}
                  >
                    <t.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{t.label}</span>
                    <span className={cn("badge", active ? "bg-brand-500/20 text-brand-300" : "bg-ink-100 text-ink-500")}>{t.count}</span>
                  </button>
                );
              })}
            </div>

            {/* Tag folders — only for workouts */}
            {tab === "workouts" && (
              <>
                <div className="mt-3 border-t border-ink-100 pt-3">
                  <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Tags</p>
                  <div className="space-y-1">
                    <FolderRow
                      label="All workouts" count={app.workouts.length}
                      icon={FolderOpen} active={activeTag === null} onClick={() => setActiveTag(null)}
                    />
                    <FolderRow
                      label="No tags" count={tagCounts.untagged}
                      icon={Hash} active={activeTag === NO_TAGS} onClick={() => setActiveTag(NO_TAGS)}
                    />
                    {tagCounts.counts.map(([t, n]) => (
                      <FolderRow
                        key={t} label={t} count={n} icon={Tag}
                        active={activeTag === t} onClick={() => setActiveTag(t)}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (selected.size === 0) { app.notify("Select workouts first, then add a tag", "info"); return; }
                      setTagModal(true);
                    }}
                    className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-brand-400 transition hover:bg-brand-50/50"
                  >
                    <Plus className="h-4 w-4" /> Add new tag
                  </button>
                </div>
              </>
            )}

            {/* Meal-type folders — only for meals */}
            {tab === "meals" && (
              <div className="mt-3 border-t border-ink-100 pt-3">
                <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Meal type</p>
                <div className="space-y-1">
                  <FolderRow
                    label="All meals" count={app.recipes.length} icon={FolderOpen}
                    active={mealFilter === ALL_MEALS} onClick={() => setMealFilter(ALL_MEALS)}
                  />
                  {MEAL_TYPES.map((t) => (
                    <FolderRow
                      key={t} label={t} count={mealCounts.get(t) ?? 0} icon={UtensilsCrossed}
                      active={mealFilter === t} onClick={() => setMealFilter(t)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tab === "exercises" ? "Search exercises…" : tab === "programs" ? "Search programs…" : "Search workouts…"}
                className="input pl-9"
              />
            </div>

            {tab === "workouts" && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="input w-auto pl-9 pr-8"
                    aria-label="Sort workouts"
                  >
                    <option value="recent">Newest first</option>
                    <option value="name">Name (A–Z)</option>
                    <option value="duration">Duration</option>
                  </select>
                </div>
              </div>
            )}

            {tab === "meals" && (
              <div className="relative">
                <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <select
                  value={recipeSort}
                  onChange={(e) => setRecipeSort(e.target.value as RecipeSortKey)}
                  className="input w-auto pl-9 pr-8"
                  aria-label="Sort recipes"
                >
                  <option value="recent">Last modified</option>
                  <option value="name">Name (A–Z)</option>
                  <option value="calories">Calories</option>
                </select>
              </div>
            )}

            {tab === "exercises" && (
              <div className="flex flex-wrap items-center gap-2">
                {exerciseTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                      typeFilter === t
                        ? "bg-brand-600 text-white"
                        : "border border-ink-200 bg-ink-100 text-ink-600 hover:border-ink-300 hover:bg-ink-50",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bulk action bar */}
          {tab === "workouts" && selected.size > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2">
              <span className="text-sm font-semibold text-ink-900">{selected.size} selected</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <button onClick={() => setAssignModal(true)} className="btn-secondary px-3 py-1.5 text-xs">
                  <Users className="h-3.5 w-3.5" /> Assign
                </button>
                <button onClick={() => setTagModal(true)} className="btn-secondary px-3 py-1.5 text-xs">
                  <Tag className="h-3.5 w-3.5" /> Tag
                </button>
                <button onClick={bulkDuplicate} className="btn-secondary px-3 py-1.5 text-xs">
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
                <button onClick={bulkDelete} className="btn-secondary px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/15">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
                <button onClick={clearSelection} className="btn-ghost px-3 py-1.5 text-xs">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              </div>
            </div>
          )}

          {/* ===== Workouts list ===== */}
          {tab === "workouts" && (
            app.workouts.length === 0 ? (
              <div className="card p-6">
                <EmptyState
                  icon={Dumbbell}
                  title="No workouts yet"
                  description="Create your first workout, or load the pre-built starter library to get going fast."
                  action={
                    <div className="flex flex-wrap justify-center gap-3">
                      <button className="btn-primary" onClick={() => setWorkoutModal(true)}>
                        <Plus className="h-4 w-4" /> Create workout
                      </button>
                      <DataControls />
                    </div>
                  }
                />
              </div>
            ) : visibleWorkouts.length === 0 ? (
              <div className="card p-12 text-center text-sm text-ink-400">No workouts match your filters.</div>
            ) : (
              <div className="card overflow-hidden">
                {/* header row */}
                <div className="hidden items-center gap-3 border-b border-ink-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-400 md:flex">
                  <button onClick={toggleSelectAll} className="flex h-5 w-5 items-center justify-center" aria-label="Select all">
                    <span className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      allSelected ? "border-brand-500 bg-brand-600 text-white" : "border-ink-300",
                    )}>
                      {allSelected && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                  <span className="w-12" />
                  <span className="flex-1">Name</span>
                  <span className="hidden w-36 lg:block">Created by</span>
                  <span className="hidden w-28 lg:block">Date created</span>
                  <span className="w-32">Tags</span>
                  <span className="w-5" />
                </div>

                <div className="divide-y divide-ink-100">
                  {visibleWorkouts.map((w) => {
                    const isSel = selected.has(w.id);
                    return (
                      <div
                        key={w.id}
                        className={cn(
                          "group flex items-center gap-3 px-4 py-3 transition hover:bg-ink-50",
                          isSel && "bg-brand-50/40",
                        )}
                      >
                        <button
                          onClick={() => toggleSelect(w.id)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center"
                          aria-label={`Select ${w.name}`}
                        >
                          <span className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border",
                            isSel ? "border-brand-500 bg-brand-600 text-white" : "border-ink-300 group-hover:border-ink-400",
                          )}>
                            {isSel && <Check className="h-3 w-3" />}
                          </span>
                        </button>

                        <Link href={`/dashboard/workouts/${w.id}`} className="h-12 w-12 shrink-0">
                          <WorkoutThumb workout={w} className="h-12 w-12" showPlay={!!w.video} paused />
                        </Link>

                        <Link href={`/dashboard/workouts/${w.id}`} className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold text-ink-900">{w.name}</span>
                            {w.video && <VideoIcon className="h-3.5 w-3.5 shrink-0 text-brand-400" />}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> est. {w.durationMin} min</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" /> {w.exercises.length} exercises</span>
                            <span className={cn("badge hidden sm:inline-flex", difficultyClasses(w.difficulty))}>{w.difficulty}</span>
                          </div>
                        </Link>

                        <span className="hidden w-36 truncate text-sm text-ink-500 lg:block">{w.createdBy ?? app.settings.businessName}</span>
                        <span className="hidden w-28 text-sm text-ink-500 lg:block">{w.createdAt ? shortDate(w.createdAt) : "—"}</span>
                        <div className="flex w-32 flex-wrap gap-1">
                          {(w.tags ?? []).slice(0, 2).map((t) => (
                            <span key={t} className="badge bg-brand-500/10 text-brand-400">{t}</span>
                          ))}
                          {(w.tags?.length ?? 0) > 2 && (
                            <span className="badge bg-ink-100 text-ink-500">+{(w.tags!.length - 2)}</span>
                          )}
                        </div>
                        <Link href={`/dashboard/workouts/${w.id}`} className="text-ink-300 transition group-hover:text-brand-400">
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {/* ===== Exercises grid ===== */}
          {tab === "exercises" && (
            app.exercises.length === 0 ? (
              <div className="card p-6">
                <EmptyState
                  icon={Library}
                  title="No exercises yet"
                  description="Build your exercise library, or load the pre-built starter content."
                  action={
                    <div className="flex flex-wrap justify-center gap-3">
                      <button className="btn-primary" onClick={() => setExerciseModal(true)}>
                        <Plus className="h-4 w-4" /> Add exercise
                      </button>
                      <DataControls />
                    </div>
                  }
                />
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="card p-12 text-center text-sm text-ink-400">No exercises match your search.</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredExercises.map((ex) => (
                  <div key={ex.id} className="card group/card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setVideo({ src: ex.video || "", title: ex.name })}
                      aria-label={ex.video ? `Play ${ex.name} demo video` : `${ex.name} animation`}
                      disabled={!ex.video}
                      className="group/play relative block h-28 w-full"
                    >
                      <ExerciseAnimation name={ex.name} pattern={ex.pattern} className="h-full w-full" paused />
                      {ex.video && (
                        <span className="absolute inset-0 flex items-center justify-center bg-ink-950/30 opacity-0 transition group-hover/play:opacity-100">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white">
                            <Play className="h-5 w-5 fill-current" />
                          </span>
                        </span>
                      )}
                      <span className="absolute right-2 top-2 badge bg-ink-950/50 text-white backdrop-blur-sm">{ex.type}</span>
                    </button>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold text-ink-900">{ex.name}</h3>
                        <button
                          onClick={() => { app.removeExercise(ex.id); app.notify(`Removed ${ex.name}`, "info"); }}
                          aria-label={`Remove ${ex.name}`}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-ink-400 opacity-0 transition hover:bg-rose-500/15 hover:text-rose-400 group-hover/card:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-500">{ex.muscle} · {ex.equipment}</p>
                      <span className={cn("badge mt-2", difficultyClasses(ex.level))}>{ex.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ===== Meals ===== */}
          {tab === "meals" && (
            app.recipes.length === 0 ? (
              <div className="card p-6">
                <EmptyState
                  icon={UtensilsCrossed}
                  title="No recipes yet"
                  description="Add your first recipe, or load the starter content for a ready-made meals library."
                  action={
                    <div className="flex flex-wrap justify-center gap-3">
                      <button className="btn-primary" onClick={openNewRecipe}>
                        <Plus className="h-4 w-4" /> New recipe
                      </button>
                      <DataControls />
                    </div>
                  }
                />
              </div>
            ) : visibleRecipes.length === 0 ? (
              <div className="card p-12 text-center text-sm text-ink-400">No recipes match your filters.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleRecipes.map((r) => (
                  <div key={r.id} className="card group/recipe overflow-hidden">
                    <button type="button" onClick={() => openEditRecipe(r)} className="relative block h-40 w-full text-left">
                      {r.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photo} alt={r.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br text-white/70", posterFor(r.name))}>
                          <UtensilsCrossed className="h-10 w-10" />
                        </div>
                      )}
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-ink-950/55 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                        <Flame className="h-3 w-3" /> {r.calories}
                      </span>
                    </button>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <button type="button" onClick={() => openEditRecipe(r)} className="min-w-0 flex-1 text-left">
                          <h3 className="truncate font-semibold text-ink-900">{r.name}</h3>
                        </button>
                        <div className="flex shrink-0 gap-1 opacity-0 transition group-hover/recipe:opacity-100">
                          <button onClick={() => openEditRecipe(r)} aria-label={`Edit ${r.name}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-brand-500/15 hover:text-brand-400">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { const c = app.duplicateRecipe(r.id); if (c) app.notify(`Duplicated “${r.name}”`); }} aria-label={`Duplicate ${r.name}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { app.removeRecipe(r.id); app.notify(`Removed “${r.name}”`, "info"); }} aria-label={`Delete ${r.name}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-rose-500/15 hover:text-rose-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 truncate text-xs text-ink-500">{r.mealTypes.join(", ")}</p>
                      <p className="mt-2 text-xs font-medium text-ink-400">{r.calories} Cal / Serving</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ===== Programs ===== */}
          {tab === "programs" && (
            app.programs.length === 0 ? (
              <div className="card p-6">
                <EmptyState
                  icon={Layers}
                  title="No programs yet"
                  description="Create a multi-week program to assign to your clients, or load starter content."
                  action={
                    <div className="flex flex-wrap justify-center gap-3">
                      <button className="btn-primary" onClick={() => setProgramModal(true)}>
                        <Plus className="h-4 w-4" /> Create program
                      </button>
                      <DataControls />
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {app.programs
                  .filter((p) => !query.trim() || p.name.toLowerCase().includes(query.toLowerCase()) || p.focus.toLowerCase().includes(query.toLowerCase()))
                  .map((p) => (
                    <div key={p.id} className="card overflow-hidden">
                      <div className={cn("relative h-28 bg-gradient-to-br p-4 text-white", p.color)}>
                        <span className="badge bg-white/20 text-white backdrop-blur-sm">{p.focus}</span>
                        <Dumbbell className="absolute bottom-3 right-3 h-10 w-10 text-white/25" />
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-ink-900">{p.name}</h3>
                          <button
                            onClick={() => { app.removeProgram(p.id); app.notify(`Deleted ${p.name}`, "info"); }}
                            aria-label={`Delete ${p.name}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-rose-500/15 hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-ink-500">{p.weeks} weeks · {p.workoutsPerWeek}×/wk</p>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
                          <ListChecks className="h-3.5 w-3.5" /> {p.workoutIds?.length ?? 0} workouts
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Create workout modal */}
      <Modal
        open={workoutModal} onClose={() => setWorkoutModal(false)} title="Create workout"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setWorkoutModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={submitWorkout} disabled={!wName.trim()}>Create &amp; edit</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <input className="input" value={wName} onChange={(e) => setWName(e.target.value)} placeholder="Upper Body Push" autoFocus />
          </Field>
          <Field label="Category">
            <input className="input" value={wCategory} onChange={(e) => setWCategory(e.target.value)} placeholder="Strength" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration (min)">
              <input type="number" className="input" value={wDuration} onChange={(e) => setWDuration(e.target.value)} />
            </Field>
            <Field label="Difficulty">
              <select className="input" value={wDifficulty} onChange={(e) => setWDifficulty(e.target.value as (typeof difficulties)[number])}>
                {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Video workout URL (optional)">
            <input className="input" value={wVideo} onChange={(e) => setWVideo(e.target.value)} placeholder="YouTube / Vimeo / .mp4 link" />
            <p className="mt-1 text-xs text-ink-400">Add a link to make this a follow-along video workout. Leave blank for a set-by-set workout.</p>
          </Field>
        </div>
      </Modal>

      {/* New program modal */}
      <Modal
        open={programModal} onClose={() => setProgramModal(false)} title="New program"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setProgramModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={submitProgram} disabled={!pName.trim()}>Create</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <input className="input" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="12-Week Hypertrophy" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Weeks"><input type="number" className="input" value={pWeeks} onChange={(e) => setPWeeks(e.target.value)} /></Field>
            <Field label="Workouts / week"><input type="number" className="input" value={pPerWeek} onChange={(e) => setPPerWeek(e.target.value)} /></Field>
          </div>
          <Field label="Focus">
            <input className="input" value={pFocus} onChange={(e) => setPFocus(e.target.value)} placeholder="Strength, Fat loss…" />
          </Field>
          <Field label="Color">
            <div className="mt-1 flex flex-wrap gap-2">
              {colorPresets.map((c) => (
                <button
                  key={c.value} type="button" onClick={() => setPColor(c.value)} aria-label={c.label}
                  className={cn("h-9 w-9 rounded-lg bg-gradient-to-br ring-offset-2 transition", c.value, pColor === c.value ? "ring-2 ring-brand-500" : "ring-0")}
                />
              ))}
            </div>
          </Field>
        </div>
      </Modal>

      {/* Add exercise modal */}
      <Modal
        open={exerciseModal} onClose={() => setExerciseModal(false)} title="Add exercise"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setExerciseModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={submitExercise} disabled={!eName.trim()}>Add</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <input className="input" value={eName} onChange={(e) => setEName(e.target.value)} placeholder="Barbell Back Squat" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Muscle"><input className="input" value={eMuscle} onChange={(e) => setEMuscle(e.target.value)} placeholder="Quads" /></Field>
            <Field label="Equipment"><input className="input" value={eEquipment} onChange={(e) => setEEquipment(e.target.value)} placeholder="Barbell" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Level">
              <select className="input" value={eLevel} onChange={(e) => setELevel(e.target.value as (typeof levels)[number])}>
                {levels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select className="input" value={eType} onChange={(e) => setEType(e.target.value as (typeof types)[number])}>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Demo video URL (optional)">
            <input className="input" value={eVideo} onChange={(e) => setEVideo(e.target.value)} placeholder="YouTube, Vimeo or .mp4 link" />
          </Field>
        </div>
      </Modal>

      {/* Tag modal */}
      <Modal
        open={tagModal} onClose={() => setTagModal(false)} title={`Tag ${selected.size} workout${selected.size === 1 ? "" : "s"}`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setTagModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={applyTag} disabled={!tagInput.trim()}>Apply tag</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tag name">
            <input className="input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="e.g. 30 Day Beginner Plan" autoFocus />
          </Field>
          {tagCounts.counts.length > 0 && (
            <div>
              <p className="label">Existing tags</p>
              <div className="flex flex-wrap gap-2">
                {tagCounts.counts.map(([t]) => (
                  <button key={t} type="button" onClick={() => setTagInput(t)} className="badge bg-ink-100 text-ink-600 hover:bg-brand-500/15 hover:text-brand-400">
                    <Tag className="h-3 w-3" /> {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Assign modal */}
      <Modal
        open={assignModal} onClose={() => setAssignModal(false)} title={`Assign ${selected.size} workout${selected.size === 1 ? "" : "s"}`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAssignModal(false)}>Cancel</button>
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
            <p className="text-sm text-ink-500">Pick who should receive {selected.size === 1 ? "this workout" : "these workouts"}. They&apos;ll see it in their plan right away.</p>
            <div className="max-h-72 space-y-1.5 overflow-y-auto scroll-thin">
              {myClients.map((cl) => {
                const checked = assignClients.has(cl.id);
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
                      <div className="truncate text-xs text-ink-500">{cl.program}</div>
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

      {/* Recipe create / edit modal */}
      <Modal
        open={recipeModal} onClose={() => setRecipeModal(false)}
        title={editingRecipeId ? "Edit recipe" : "New recipe"} size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRecipeModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={submitRecipe} disabled={!rForm.name.trim()}>
              {editingRecipeId ? "Save changes" : "Add recipe"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Recipe name">
            <input className="input" value={rForm.name} onChange={(e) => setRForm((s) => ({ ...s, name: e.target.value }))} placeholder="Mediterranean Breakfast Pita" autoFocus />
          </Field>
          <div>
            <span className="label">Meal type</span>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((t) => {
                const on = rForm.mealTypes.has(t);
                return (
                  <button
                    key={t} type="button" onClick={() => toggleRecipeMealType(t)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                      on ? "bg-brand-600 text-white" : "border border-ink-200 bg-ink-100 text-ink-600 hover:border-ink-300",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Field label="Calories"><input type="number" className="input" value={rForm.calories} onChange={(e) => setRForm((s) => ({ ...s, calories: e.target.value }))} /></Field>
            <Field label="Protein (g)"><input type="number" className="input" value={rForm.protein} onChange={(e) => setRForm((s) => ({ ...s, protein: e.target.value }))} /></Field>
            <Field label="Carbs (g)"><input type="number" className="input" value={rForm.carbs} onChange={(e) => setRForm((s) => ({ ...s, carbs: e.target.value }))} /></Field>
            <Field label="Fat (g)"><input type="number" className="input" value={rForm.fat} onChange={(e) => setRForm((s) => ({ ...s, fat: e.target.value }))} /></Field>
            <Field label="Servings"><input type="number" className="input" value={rForm.servings} onChange={(e) => setRForm((s) => ({ ...s, servings: e.target.value }))} /></Field>
          </div>
          <Field label="Ingredients (comma-separated)">
            <input className="input" value={rForm.ingredients} onChange={(e) => setRForm((s) => ({ ...s, ingredients: e.target.value }))} placeholder="Pita, Egg whites, Feta, Spinach, Tomato" />
          </Field>
          <Field label="Instructions">
            <textarea rows={3} className="input resize-none" value={rForm.instructions} onChange={(e) => setRForm((s) => ({ ...s, instructions: e.target.value }))} placeholder="How to prepare this meal…" />
          </Field>
          <Field label="Photo URL (optional)">
            <input className="input" value={rForm.photo} onChange={(e) => setRForm((s) => ({ ...s, photo: e.target.value }))} placeholder="https://…/photo.jpg" />
          </Field>
        </div>
      </Modal>

      <VideoModal open={!!video} onClose={() => setVideo(null)} src={video?.src ?? ""} title={video?.title} />
    </>
  );
}

function FolderRow({
  label, count, icon: Icon, active, onClick,
}: {
  label: string; count: number; icon: React.ComponentType<{ className?: string }>; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition",
        active ? "bg-brand-500/15 font-semibold text-brand-400" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-left">{label}</span>
      <span className={cn("badge", active ? "bg-brand-500/20 text-brand-300" : "bg-ink-100 text-ink-500")}>{count}</span>
    </button>
  );
}
