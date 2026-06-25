"use client";

import Link from "next/link";
import { Flame, ListChecks, Check, UserPlus, CheckCircle2 } from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { habitStreak, habitDoneOn, lastNDays, habitDateKey } from "@/lib/data";
import { HabitIcon } from "@/lib/habit-icons";
import { EmptyState } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

export default function ClientHabitsPage() {
  const app = useApp();
  const c = useCurrentClient();

  if (!app.hydrated)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );

  if (!c)
    return (
      <EmptyState
        icon={UserPlus}
        title="No client selected"
        description="Add a client in the Trainer portal, then preview their experience here."
        action={<Link href="/dashboard/clients" className="btn-primary">Go to Clients</Link>}
      />
    );

  const today = habitDateKey();
  const week = lastNDays(7).map((key) => ({
    key,
    weekday: new Date(`${key}T00:00:00`).toLocaleDateString("en-US", { weekday: "narrow" }),
    dom: new Date(`${key}T00:00:00`).getDate(),
    isToday: key === today,
  }));

  const habitLog = app.habitLogs[c.id] ?? {};
  const assignedHabits = (app.clientPlans[c.id]?.habitIds ?? [])
    .map((id) => app.masterHabits.find((h) => h.id === id))
    .filter((h): h is NonNullable<typeof h> => Boolean(h));

  const doneToday = assignedHabits.filter((h) => habitDoneOn(habitLog[h.id])).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Habits</h1>
        <p className="mt-1 text-sm text-ink-500">
          Tap a day to check off a habit. Your coach sees your streaks update live.
        </p>
      </div>

      {assignedHabits.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No habits yet"
          description="Your coach hasn't assigned any habits yet. They'll show up here once they do."
        />
      ) : (
        <>
          {/* Today summary */}
          <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
            <p className="text-sm text-brand-100">Today</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-bold">{doneToday}</span>
              <span className="mb-1 text-brand-100">/ {assignedHabits.length} habits done</span>
            </div>
            <div className="mt-4 h-2.5 w-full rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${assignedHabits.length ? (doneToday / assignedHabits.length) * 100 : 0}%` }}
              />
            </div>
          </section>

          {/* Habit cards with weekly grid */}
          <div className="space-y-3">
            {assignedHabits.map((h) => {
              const dates = habitLog[h.id];
              const s = habitStreak(dates);
              const set = new Set(dates ?? []);
              return (
                <section key={h.id} className="card p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                      <HabitIcon icon={h.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-ink-900">{h.name}</h2>
                      {h.description && <p className="mt-0.5 text-sm text-ink-500">{h.description}</p>}
                      <div className="mt-1 flex items-center gap-1 text-xs text-ink-400">
                        <Flame className={cn("h-3.5 w-3.5", s > 0 ? "text-orange-400" : "text-ink-300")} />
                        {s} day streak
                      </div>
                    </div>
                  </div>

                  {/* Last 7 days */}
                  <div className="mt-4 grid grid-cols-7 gap-1.5">
                    {week.map((d) => {
                      const checked = set.has(d.key);
                      return (
                        <button
                          key={d.key}
                          onClick={() => app.toggleHabitDay(c.id, h.id, d.key)}
                          className="flex flex-col items-center gap-1"
                          aria-label={`${checked ? "Uncheck" : "Check"} ${h.name} on ${d.key}`}
                          aria-pressed={checked}
                        >
                          <span className="text-[11px] font-medium text-ink-400">{d.weekday}</span>
                          <span
                            className={cn(
                              "flex h-10 w-full items-center justify-center rounded-xl border text-xs font-semibold transition",
                              checked
                                ? "border-accent-500 bg-accent-500 text-white"
                                : "border-ink-200 text-ink-400 hover:border-brand-300 hover:bg-brand-50/40",
                              d.isToday && !checked && "border-brand-400 ring-1 ring-brand-200",
                            )}
                          >
                            {checked ? <Check className="h-4 w-4" /> : d.dom}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick check-off for today */}
                  <button
                    onClick={() => app.toggleHabitDay(c.id, h.id)}
                    className={cn(
                      "btn-secondary mt-4 w-full justify-center",
                      habitDoneOn(dates) && "text-accent-500",
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {habitDoneOn(dates) ? "Completed today — tap to undo" : "Mark done for today"}
                  </button>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
