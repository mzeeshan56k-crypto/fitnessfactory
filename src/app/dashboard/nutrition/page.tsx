"use client";

import { useState } from "react";
import {
  Plus, Flame, Drumstick, Wheat, Droplet, Utensils, Trash2, Loader2, X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import type { MealPlan } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const macroConfig = [
  { key: "protein" as const, label: "Protein", kcalPerG: 4, color: "bg-brand-500", text: "text-brand-400" },
  { key: "carbs" as const, label: "Carbs", kcalPerG: 4, color: "bg-accent-500", text: "text-accent-400" },
  { key: "fat" as const, label: "Fat", kcalPerG: 9, color: "bg-amber-500", text: "text-amber-400" },
];

type MealRow = { name: string; kcal: string; items: string };
const emptyMealRow = (): MealRow => ({ name: "", kcal: "", items: "" });

export default function NutritionPage() {
  const app = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Plan form
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("2000");
  const [protein, setProtein] = useState("150");
  const [carbs, setCarbs] = useState("200");
  const [fat, setFat] = useState("60");
  const [tag, setTag] = useState("Custom");
  const [mealRows, setMealRows] = useState<MealRow[]>([emptyMealRow()]);

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const selected: MealPlan | null =
    app.mealPlans.find((m) => m.id === selectedId) ?? app.mealPlans[0] ?? null;

  const macroKcal = {
    protein: (selected?.protein ?? 0) * 4,
    carbs: (selected?.carbs ?? 0) * 4,
    fat: (selected?.fat ?? 0) * 9,
  };
  const totalMacroKcal = macroKcal.protein + macroKcal.carbs + macroKcal.fat;
  const pct = (n: number) => (totalMacroKcal === 0 ? 0 : Math.round((n / totalMacroKcal) * 100));

  function resetForm() {
    setName("");
    setCalories("2000");
    setProtein("150");
    setCarbs("200");
    setFat("60");
    setTag("Custom");
    setMealRows([emptyMealRow()]);
  }

  function submitPlan() {
    if (!name.trim()) return;
    const meals = mealRows
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        kcal: Number(r.kcal) || 0,
        items: r.items
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
      }));
    const plan = app.addMealPlan({
      name: name.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      tag: tag.trim() || "Custom",
      meals,
    });
    setSelectedId(plan.id);
    resetForm();
    setOpen(false);
  }

  function updateMealRow(idx: number, patch: Partial<MealRow>) {
    setMealRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  return (
    <>
      <PageHeader
        title="Nutrition"
        subtitle="Build meal plans and track macros"
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New meal plan
          </button>
        }
      />

      {/* Macro stat cards for selected plan */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Calories" value={`${(selected?.calories ?? 0).toLocaleString()} kcal`} icon={Flame} />
        <StatCard label="Protein (g)" value={`${selected?.protein ?? 0} g`} icon={Drumstick} />
        <StatCard label="Carbs (g)" value={`${selected?.carbs ?? 0} g`} icon={Wheat} />
        <StatCard label="Fat (g)" value={`${selected?.fat ?? 0} g`} icon={Droplet} />
      </div>

      {app.mealPlans.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Utensils}
            title="No meal plans yet"
            description="Create a meal plan with macro targets and meals to get started."
            action={
              <button className="btn-primary" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                New meal plan
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Meal plan list */}
          <div className="card p-4 lg:col-span-1">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-ink-900">Meal plans</h2>
              <span className="badge bg-ink-100 text-ink-600">{app.mealPlans.length}</span>
            </div>
            <div className="space-y-2">
              {app.mealPlans.map((m) => {
                const active = selected?.id === m.id;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border p-3 transition",
                      active
                        ? "border-brand-300 bg-brand-50/60"
                        : "border-ink-100 hover:border-brand-200 hover:bg-brand-50/30",
                    )}
                  >
                    <button
                      onClick={() => setSelectedId(m.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-ink-900">{m.name}</span>
                        <span className="badge bg-brand-500/15 text-brand-400">{m.tag}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                        <Flame className="h-3.5 w-3.5" />
                        {m.calories.toLocaleString()} kcal
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        app.removeMealPlan(m.id);
                        if (selectedId === m.id) setSelectedId(null);
                      }}
                      aria-label={`Delete ${m.name}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-rose-500/15 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected plan detail */}
          {selected && (
            <div className="space-y-6 lg:col-span-2">
              {/* Macro breakdown */}
              <div className="card p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-ink-900">{selected.name}</h2>
                    <p className="text-sm text-ink-500">Macro breakdown · {selected.calories.toLocaleString()} kcal/day</p>
                  </div>
                  <span className="badge bg-brand-500/15 text-brand-400">{selected.tag}</span>
                </div>

                <div className="mt-5 space-y-4">
                  {macroConfig.map((mc) => {
                    const grams = selected[mc.key];
                    const kcal = macroKcal[mc.key];
                    const percentage = pct(kcal);
                    return (
                      <div key={mc.key}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 font-medium text-ink-700">
                            <span className={cn("h-2.5 w-2.5 rounded-full", mc.color)} />
                            {mc.label}
                          </span>
                          <span className="text-ink-500">
                            <span className={cn("font-semibold", mc.text)}>{grams} g</span>
                            {" · "}
                            {percentage}%
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-ink-100">
                          <div
                            className={cn("h-full rounded-full", mc.color)}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Meals */}
              <div className="card p-6">
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-brand-400" />
                  <h2 className="font-semibold text-ink-900">Meals</h2>
                  <span className="badge bg-ink-100 text-ink-600">{selected.meals.length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {selected.meals.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-6 text-center text-sm text-ink-400">
                      No meals in this plan. Add meals when creating a plan.
                    </p>
                  ) : (
                    selected.meals.map((meal, i) => (
                      <div key={i} className="rounded-xl border border-ink-100 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-ink-900">{meal.name}</h3>
                          <span className="flex items-center gap-1 text-xs font-medium text-ink-500">
                            <Flame className="h-3.5 w-3.5" /> {meal.kcal} kcal
                          </span>
                        </div>
                        {meal.items.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {meal.items.map((item, ii) => (
                              <span
                                key={ii}
                                className="inline-flex items-center rounded-full border border-ink-100 bg-ink-50 px-3 py-1 text-xs text-ink-700"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New meal plan modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New meal plan"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submitPlan} disabled={!name.trim()}>
              Create plan
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="High protein cut"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Calories">
              <input type="number" className="input" value={calories} onChange={(e) => setCalories(e.target.value)} />
            </Field>
            <Field label="Protein (g)">
              <input type="number" className="input" value={protein} onChange={(e) => setProtein(e.target.value)} />
            </Field>
            <Field label="Carbs (g)">
              <input type="number" className="input" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            </Field>
            <Field label="Fat (g)">
              <input type="number" className="input" value={fat} onChange={(e) => setFat(e.target.value)} />
            </Field>
          </div>
          <Field label="Tag">
            <input
              className="input"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Cut, Bulk, Maintenance…"
            />
          </Field>

          {/* Meals builder */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label mb-0">Meals</span>
              <button
                type="button"
                className="btn-secondary px-2.5 py-1 text-xs"
                onClick={() => setMealRows((rows) => [...rows, emptyMealRow()])}
              >
                <Plus className="h-3.5 w-3.5" />
                Add meal
              </button>
            </div>
            <div className="space-y-3">
              {mealRows.map((row, i) => (
                <div key={i} className="rounded-xl border border-ink-100 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      className="input flex-1"
                      value={row.name}
                      onChange={(e) => updateMealRow(i, { name: e.target.value })}
                      placeholder="Meal name (e.g. Breakfast)"
                    />
                    <input
                      type="number"
                      className="input w-24"
                      value={row.kcal}
                      onChange={(e) => updateMealRow(i, { kcal: e.target.value })}
                      placeholder="kcal"
                    />
                    {mealRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setMealRows((rows) => rows.filter((_, idx) => idx !== i))}
                        aria-label="Remove meal row"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-rose-500/15 hover:text-rose-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input
                    className="input mt-2"
                    value={row.items}
                    onChange={(e) => updateMealRow(i, { items: e.target.value })}
                    placeholder="Items, comma separated (e.g. Oats, Eggs, Banana)"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
