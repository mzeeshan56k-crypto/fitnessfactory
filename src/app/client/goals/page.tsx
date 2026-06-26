"use client";

import { useState } from "react";
import Link from "next/link";
import { Target, Plus, Check, Flame, Droplet, Moon, Apple, Dumbbell, UserPlus, X } from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { EmptyState } from "@/components/ui/Modal";
import { useLocalState } from "@/lib/useLocalState";
import { cn } from "@/lib/utils";

type GoalStatus = "upcoming" | "current" | "past";

interface Goal {
  id: string;
  title: string;
  target: string;
  status: GoalStatus;
  createdAt: string;
}

interface Habit {
  id: string;
  title: string;
  icon: string;
  streak: number;
  completedToday: boolean;
}

const habitIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  water: Droplet,
  sleep: Moon,
  nutrition: Apple,
  workout: Dumbbell,
  default: Flame,
};

export default function GoalsPage() {
  const app = useApp();
  const client = useCurrentClient();

  const [goals, setGoals] = useLocalState<Goal[]>("ffkc-goals", []);
  const [habits, setHabits] = useLocalState<Habit[]>("ffkc-habits", [
    { id: "h1", title: "Drink 8 glasses of water", icon: "water", streak: 0, completedToday: false },
    { id: "h2", title: "Sleep 8 hours", icon: "sleep", streak: 0, completedToday: false },
    { id: "h3", title: "Log meals", icon: "nutrition", streak: 0, completedToday: false },
  ]);

  const [goalModal, setGoalModal] = useState(false);
  const [habitModal, setHabitModal] = useState(false);
  const [gTitle, setGTitle] = useState("");
  const [gTarget, setGTarget] = useState("");
  const [hTitle, setHTitle] = useState("");
  const [hIcon, setHIcon] = useState("default");
  const [activeTab, setActiveTab] = useState<"upcoming" | "current" | "past">("current");

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
        description="Add a client in the Trainer portal to preview their experience."
        action={<Link href="/dashboard/clients" className="btn-primary">Go to Clients</Link>}
      />
    );

  const addGoal = () => {
    if (!gTitle.trim()) return;
    setGoals((g) => [
      ...g,
      { id: Date.now().toString(), title: gTitle.trim(), target: gTarget.trim(), status: "current", createdAt: new Date().toISOString() },
    ]);
    setGTitle("");
    setGTarget("");
    setGoalModal(false);
  };

  const addHabit = () => {
    if (!hTitle.trim()) return;
    setHabits((h) => [
      ...h,
      { id: Date.now().toString(), title: hTitle.trim(), icon: hIcon, streak: 0, completedToday: false },
    ]);
    setHTitle("");
    setHIcon("default");
    setHabitModal(false);
  };

  const toggleHabit = (id: string) => {
    setHabits((h) =>
      h.map((habit) =>
        habit.id === id
          ? { ...habit, completedToday: !habit.completedToday, streak: habit.completedToday ? Math.max(0, habit.streak - 1) : habit.streak + 1 }
          : habit,
      ),
    );
  };

  const removeGoal = (id: string) => setGoals((g) => g.filter((x) => x.id !== id));
  const removeHabit = (id: string) => setHabits((h) => h.filter((x) => x.id !== id));

  const filteredGoals = goals.filter((g) => g.status === activeTab);
  const currentGoals = goals.filter((g) => g.status === "current");
  const upcomingGoals = goals.filter((g) => g.status === "upcoming");
  const pastGoals = goals.filter((g) => g.status === "past");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <p className="text-sm text-brand-100">Track your progress</p>
        <h1 className="text-2xl font-bold">Goals &amp; Habits</h1>
        <p className="mt-1 text-sm text-brand-100">
          {currentGoals.length} active goals · {habits.filter((h) => h.completedToday).length}/{habits.length} habits today
        </p>
      </section>

      {/* Habits section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink-900">Daily Habits</h2>
          <button
            onClick={() => setHabitModal(true)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-400 hover:bg-brand-500/10"
          >
            <Plus className="h-4 w-4" /> Add habit
          </button>
        </div>
        {habits.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ink-400">
            No habits yet. Add one to start building your streak.
          </div>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => {
              const Icon = habitIcons[habit.icon] ?? habitIcons.default;
              return (
                <div key={habit.id} className="card flex items-center gap-4 p-4">
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
                      habit.completedToday
                        ? "bg-accent-500 text-white"
                        : "bg-ink-100 text-ink-400 hover:bg-brand-500/15 hover:text-brand-400",
                    )}
                  >
                    {habit.completedToday ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-medium", habit.completedToday ? "line-through text-ink-400" : "text-ink-900")}>
                      {habit.title}
                    </p>
                    <p className="text-xs text-ink-400">
                      <Flame className="mr-1 inline h-3 w-3 text-amber-400" />
                      {habit.streak} day streak
                    </p>
                  </div>
                  <button onClick={() => removeHabit(habit.id)} className="rounded-lg p-1 text-ink-300 hover:bg-rose-500/15 hover:text-rose-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Goals section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink-900">Goals</h2>
          <button
            onClick={() => setGoalModal(true)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-400 hover:bg-brand-500/10"
          >
            <Plus className="h-4 w-4" /> Add goal
          </button>
        </div>

        {/* Tab picker */}
        <div className="mb-4 inline-flex rounded-full border border-ink-100 bg-ink-50 p-1">
          {(["upcoming", "current", "past"] as const).map((tab) => {
            const count = tab === "upcoming" ? upcomingGoals.length : tab === "current" ? currentGoals.length : pastGoals.length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-all",
                  activeTab === tab
                    ? "bg-ink-100 text-ink-900 shadow-soft"
                    : "text-ink-500 hover:text-ink-800",
                )}
              >
                {tab} {count > 0 && <span className="ml-1 rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[10px] text-brand-500">{count}</span>}
              </button>
            );
          })}
        </div>

        {filteredGoals.length === 0 ? (
          <div className="card p-8 text-center">
            <Target className="mx-auto mb-2 h-8 w-8 text-ink-300" />
            <p className="text-sm text-ink-400">No {activeTab} goals. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGoals.map((goal) => (
              <div key={goal.id} className="card flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                  <Target className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">{goal.title}</p>
                  {goal.target && <p className="mt-0.5 text-sm text-ink-500">Target: {goal.target}</p>}
                  <div className="mt-2 flex gap-2">
                    {(["upcoming", "current", "past"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setGoals((g) => g.map((x) => x.id === goal.id ? { ...x, status: s } : x))}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize transition",
                          goal.status === s
                            ? "bg-brand-600 text-white"
                            : "bg-ink-100 text-ink-500 hover:bg-ink-200",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => removeGoal(goal.id)} className="rounded-lg p-1 text-ink-300 hover:bg-rose-500/15 hover:text-rose-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add goal modal */}
      {goalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-ink-100 p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-ink-900">Add Goal</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Goal title</label>
                <input className="input" value={gTitle} onChange={(e) => setGTitle(e.target.value)} placeholder="Lose 10 lbs, Run 5K…" autoFocus />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Target / deadline (optional)</label>
                <input className="input" value={gTarget} onChange={(e) => setGTarget(e.target.value)} placeholder="By July 2025, 180 lbs…" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setGoalModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={addGoal} disabled={!gTitle.trim()}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Add habit modal */}
      {habitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-ink-100 p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-ink-900">Add Habit</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Habit title</label>
                <input className="input" value={hTitle} onChange={(e) => setHTitle(e.target.value)} placeholder="Drink 8 glasses of water…" autoFocus />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Icon</label>
                <select className="input" value={hIcon} onChange={(e) => setHIcon(e.target.value)}>
                  <option value="water">💧 Water</option>
                  <option value="sleep">🌙 Sleep</option>
                  <option value="nutrition">🍎 Nutrition</option>
                  <option value="workout">🏋️ Workout</option>
                  <option value="default">🔥 Other</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setHabitModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={addHabit} disabled={!hTitle.trim()}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
