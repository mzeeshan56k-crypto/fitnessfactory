"use client";

import Link from "next/link";
import {
  Dumbbell, Clock, ListChecks, ChevronRight, CheckCircle2, CalendarDays, UserPlus,
} from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/Modal";

const difficultyTint: Record<string, string> = {
  Beginner: "bg-accent-500/15 text-accent-400",
  Intermediate: "bg-brand-500/15 text-brand-400",
  Advanced: "bg-rose-500/15 text-rose-400",
};

export default function ClientWorkoutsPage() {
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

  // Members see only the workouts their coach assigned to them.
  const plan = app.clientPlans[c.id];
  const workouts = (plan?.workoutIds ?? [])
    .map((id) => app.workouts.find((w) => w.id === id))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));
  // Which assigned workouts they've already completed.
  const completedIds = new Set((app.completions[c.id] ?? []).map((s) => s.workoutId));

  return (
    <div className="space-y-6">
      {/* Header / plan hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-brand-100">
          <CalendarDays className="h-4 w-4" /> Your training plan
        </div>
        <h1 className="mt-1 text-2xl font-bold">{c.program}</h1>
        <p className="mt-1 text-sm text-brand-100">
          Your training plan · {workouts.length} workouts this week
        </p>
      </section>

      {/* Workout list */}
      {workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workouts assigned yet"
          description="Your coach hasn't assigned any workouts. Add workouts in the Trainer portal to preview them here."
          action={<Link href="/dashboard/workouts" className="btn-primary">Go to Workouts</Link>}
        />
      ) : (
        <section className="space-y-3">
          {workouts.map((w, i) => {
            const isCompleted = completedIds.has(w.id);
            const isToday = !isCompleted && i === 0;
            return (
              <Link
                key={w.id}
                href={`/client/workouts/${w.id}`}
                className={cn(
                  "card flex items-center gap-4 p-4 transition hover:shadow-lg active:scale-[0.99]",
                  isToday && "border-brand-200 ring-2 ring-brand-100",
                )}
              >
                {/* Day / index chip */}
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-center",
                    isToday
                      ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white"
                      : "bg-ink-50 text-ink-500",
                  )}
                >
                  <span className="text-[10px] font-medium uppercase leading-none">Day</span>
                  <span className="text-lg font-bold leading-tight">{i + 1}</span>
                </div>

                {/* Body */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-semibold text-ink-900">{w.name}</h2>
                    {isToday && (
                      <span className="badge bg-brand-600 text-white">Today</span>
                    )}
                    {isCompleted && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-500" />
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="badge bg-ink-100 text-ink-600">{w.category}</span>
                    <span className={cn("badge", difficultyTint[w.difficulty])}>
                      {w.difficulty}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-ink-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {w.durationMin} min
                    </span>
                    <span className="flex items-center gap-1">
                      <ListChecks className="h-3.5 w-3.5" /> {w.exercises.length} exercises
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-ink-300" />
              </Link>
            );
          })}
        </section>
      )}

      {/* Footer hint */}
      {workouts.length > 0 && (
        <p className="flex items-center justify-center gap-2 pt-1 text-center text-xs text-ink-400">
          <Dumbbell className="h-3.5 w-3.5" /> Tap a workout to start logging your sets
        </p>
      )}
    </div>
  );
}
