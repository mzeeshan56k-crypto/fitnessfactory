"use client";

import Link from "next/link";
import {
  Dumbbell, Flame, Target, TrendingDown, ChevronRight, CheckCircle2,
  Calendar, Apple, Droplet, Moon, Footprints,
  ClipboardCheck, Trophy, GraduationCap, UserPlus,
} from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { habits } from "@/lib/data";
import { EmptyState } from "@/components/ui/Modal";

const habitIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  footprints: Footprints, droplet: Droplet, moon: Moon, utensils: Apple,
};

export default function ClientTodayPage() {
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

  // The member's assigned workouts (today = the first one assigned by the coach).
  const assignedWorkouts = (app.clientPlans[c.id]?.workoutIds ?? [])
    .map((id) => app.workouts.find((w) => w.id === id))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));
  const todaysWorkout = assignedWorkouts[0];
  const lost = c.startWeight - c.currentWeight;
  const toGoal = Math.abs(c.currentWeight - c.goalWeight);
  const streak = Math.max(0, ...habits.map((h) => h.streak));

  return (
    <div className="space-y-6">
      {/* Viewing as selector */}
      {app.clients.length >= 2 && (
        <div className="flex items-center gap-2">
          <label htmlFor="viewing-as" className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Viewing as
          </label>
          <select
            id="viewing-as"
            value={app.currentClientId ?? c.id}
            onChange={(e) => app.setCurrentClient(e.target.value)}
            className="input flex-1"
            aria-label="Viewing as client"
          >
            {app.clients.map((cl) => (
              <option key={cl.id} value={cl.id}>{cl.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Greeting + workout hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <p className="text-sm text-brand-100">Good morning</p>
        <h1 className="text-2xl font-bold">{c.name.split(" ")[0]} 👋</h1>

        {todaysWorkout ? (
          <Link
            href={`/client/workouts/${todaysWorkout.id}`}
            className="mt-5 flex items-center gap-4 rounded-2xl bg-white/15 p-4 backdrop-blur transition hover:bg-white/20"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Dumbbell className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wide text-brand-100">
                Today&apos;s workout
              </div>
              <div className="font-semibold">{todaysWorkout.name}</div>
              <div className="text-xs text-brand-100">
                {todaysWorkout.exercises.length} exercises · {todaysWorkout.durationMin} min
              </div>
            </div>
            <ChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <div className="mt-5 flex items-center gap-4 rounded-2xl bg-white/15 p-4 backdrop-blur">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Dumbbell className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wide text-brand-100">
                Today&apos;s workout
              </div>
              <div className="font-semibold">No workouts assigned yet</div>
              <div className="text-xs text-brand-100">
                Your coach will assign training soon.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-3 gap-3">
        <Link href="/client/checkin" className="card flex flex-col items-center gap-1.5 p-4 text-center transition hover:border-brand-200 hover:shadow-soft">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400"><ClipboardCheck className="h-4 w-4" /></span>
          <span className="text-xs font-medium text-ink-700">Check-in</span>
        </Link>
        <Link href="/client/challenges" className="card flex flex-col items-center gap-1.5 p-4 text-center transition hover:border-brand-200 hover:shadow-soft">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400"><Trophy className="h-4 w-4" /></span>
          <span className="text-xs font-medium text-ink-700">Challenges</span>
        </Link>
        <Link href="/client/resources" className="card flex flex-col items-center gap-1.5 p-4 text-center transition hover:border-brand-200 hover:shadow-soft">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400"><GraduationCap className="h-4 w-4" /></span>
          <span className="text-xs font-medium text-ink-700">Learn</span>
        </Link>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-3 gap-3">
        <StatTile icon={Flame} label="Streak" value={`${streak} days`} tint="text-orange-500 bg-orange-500/15" />
        <StatTile icon={TrendingDown} label="Weight lost" value={`${lost} lb`} tint="text-accent-400 bg-accent-500/15" />
        <StatTile icon={Target} label="To goal" value={`${toGoal} lb`} tint="text-brand-400 bg-brand-500/15" />
      </section>

      {/* Goal progress */}
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink-900">{c.goal}</h2>
            <p className="text-sm text-ink-500">{c.program}</p>
          </div>
          <span className="text-2xl font-bold text-brand-400">{c.progress}%</span>
        </div>
        <div className="mt-4 h-2.5 w-full rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
            style={{ width: `${c.progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink-400">
          <span>{c.startWeight} lb start</span>
          <span>{c.currentWeight} lb now</span>
          <span>{c.goalWeight} lb goal</span>
        </div>
      </section>

      {/* Habits */}
      <section className="card p-5">
        <h2 className="font-semibold text-ink-900">Today&apos;s habits</h2>
        <div className="mt-4 space-y-2">
          {habits.map((h) => {
            const Icon = habitIcons[h.icon] ?? CheckCircle2;
            const doneToday = h.weekly[h.weekly.length - 1];
            return (
              <div
                key={h.id}
                className="flex items-center gap-3 rounded-xl border border-ink-100 p-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink-900">{h.name}</div>
                  <div className="flex items-center gap-1 text-xs text-ink-400">
                    <Flame className="h-3 w-3 text-orange-400" /> {h.streak} day streak
                  </div>
                </div>
                <CheckCircle2
                  className={doneToday ? "h-6 w-6 text-accent-500" : "h-6 w-6 text-ink-200"}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Next session */}
      {(() => {
        const nextSession = app.appointments.find((a) => a.clientId === c.id);
        if (!nextSession) return null;
        return (
          <section className="card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400">
              <Calendar className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wide text-ink-400">Next session</div>
              <div className="font-semibold text-ink-900">{nextSession.title}</div>
              <div className="text-sm text-ink-500">
                {nextSession.start} – {nextSession.end}
                {app.settings.trainerName ? ` with ${app.settings.trainerName}` : ""}
              </div>
            </div>
          </section>
        );
      })()}
    </div>
  );
}

function StatTile({
  icon: Icon, label, value, tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tint: string;
}) {
  const [text, bg] = tint.split(" ");
  return (
    <div className="card p-4 text-center">
      <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${text}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="mt-2 text-base font-bold text-ink-900">{value}</div>
      <div className="text-[11px] text-ink-400">{label}</div>
    </div>
  );
}
