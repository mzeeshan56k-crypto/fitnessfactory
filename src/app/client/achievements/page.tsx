"use client";

import Link from "next/link";
import {
  Trophy, Star, Award, Lock, Dumbbell, Flame, Zap,
  Apple, Sunrise, Droplet, Medal, UserPlus, ClipboardCheck,
} from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Modal";

const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function ClientAchievementsPage() {
  const app = useApp();
  const client = useCurrentClient();

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
        description="Add a client in the Trainer portal, then preview their experience here."
        action={<Link href="/dashboard/clients" className="btn-primary">Go to Clients</Link>}
      />
    );

  // ----- real points/XP derived from logged activity -----
  const pointsFor = (id: string) => {
    const comps = (app.completions[id] ?? []).length;
    const cis = app.checkins.filter((c) => c.clientId === id).length;
    const weights = (app.weightLogs[id] ?? []).length;
    const photos = (app.photos[id] ?? []).length;
    return comps * 50 + cis * 30 + weights * 10 + photos * 15;
  };

  const comps = app.completions[client.id] ?? [];
  const workouts = comps.length;
  const checkins = app.checkins.filter((c) => c.clientId === client.id).length;
  const nutrition = app.nutritionLogs[client.id];

  const points = pointsFor(client.id);
  const level = Math.floor(points / 1000) + 1;
  const xpCurrent = points % 1000;
  const xpNext = 1000;
  const xpPct = Math.round((xpCurrent / xpNext) * 100);

  const now = Date.now();
  const inWeek = (d: string, wAgo: number) => {
    const t = +new Date(d);
    return t >= now - (wAgo + 1) * 7 * 86_400_000 && t < now - wAgo * 7 * 86_400_000;
  };
  const threeWeekStreak = [0, 1, 2].every((w) => comps.some((c) => inWeek(c.date, w)));

  const badges = [
    { id: "b1", name: "First Workout", desc: "Completed your very first session", icon: Dumbbell, tint: "text-brand-400 bg-brand-500/15", earned: workouts >= 1 },
    { id: "b2", name: "10 Workouts", desc: "Logged 10 training sessions", icon: Medal, tint: "text-accent-400 bg-accent-500/15", earned: workouts >= 10 },
    { id: "b3", name: "3-Week Streak", desc: "Trained every week for 3 weeks", icon: Flame, tint: "text-orange-400 bg-orange-500/15", earned: threeWeekStreak },
    { id: "b4", name: "PR Smasher", desc: "Logged a session at RPE 9+", icon: Zap, tint: "text-amber-400 bg-amber-500/15", earned: comps.some((c) => (c.avgRpe ?? 0) >= 9) },
    { id: "b5", name: "Early Bird", desc: "Trained before 7am", icon: Sunrise, tint: "text-amber-400 bg-amber-500/15", earned: comps.some((c) => new Date(c.date).getHours() < 7) },
    { id: "b6", name: "Consistent", desc: "Submitted 4+ check-ins", icon: ClipboardCheck, tint: "text-sky-400 bg-sky-500/15", earned: checkins >= 4 },
    { id: "b7", name: "100th Workout", desc: "Reach 100 completed sessions", icon: Award, tint: "text-brand-400 bg-brand-500/15", earned: workouts >= 100 },
    { id: "b8", name: "Hydration Hero", desc: "Hit your water goal", icon: Droplet, tint: "text-brand-400 bg-brand-500/15", earned: (nutrition?.water ?? 0) >= 8 },
  ];
  const earnedCount = badges.filter((b) => b.earned).length;

  // ----- leaderboard from real clients' derived points -----
  const board = app.clients
    .map((c) => ({ id: c.id, name: c.name, avatar: c.avatar, points: pointsFor(c.id) }))
    .sort((a, b) => b.points - a.points)
    .map((row, i) => ({ ...row, rank: i + 1, you: row.id === client.id }));
  const youRow = board.find((r) => r.you);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <div className="flex items-center gap-2 text-sm text-brand-100">
          <Trophy className="h-4 w-4" /> Achievements
        </div>
        <h1 className="mt-1 text-2xl font-bold">Your wins, milestones & rank 🏅</h1>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-brand-100">Total points</div>
            <div className="mt-1 flex items-center gap-1.5 text-2xl font-bold">
              <Star className="h-5 w-5 fill-amber-300 text-amber-300" />
              {points.toLocaleString()}
            </div>
          </div>
          <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-brand-100">Current rank</div>
            <div className="mt-1 flex items-center gap-1.5 text-2xl font-bold">
              <Medal className="h-5 w-5 text-amber-300" />
              #{youRow ? youRow.rank : "—"}
            </div>
          </div>
          <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-brand-100">Badges</div>
            <div className="mt-1 flex items-center gap-1.5 text-2xl font-bold">
              <Award className="h-5 w-5 text-amber-300" />
              {earnedCount}/{badges.length}
            </div>
          </div>
        </div>
      </section>

      {/* Level progress */}
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-orange-500 text-white shadow-glow">
              <Zap className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-ink-900">Level {level}</h2>
              <p className="text-xs text-ink-400">{xpNext - xpCurrent} XP to Level {level + 1}</p>
            </div>
          </div>
          <span className="text-sm font-bold text-brand-400">{xpCurrent} / {xpNext} XP</span>
        </div>
        <div className="mt-4 h-2.5 w-full rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-orange-500" style={{ width: `${xpPct}%` }} />
        </div>
        <p className="mt-3 text-xs text-ink-400">
          Earn XP by logging workouts (50), submitting check-ins (30), logging weight (10) and photos (15).
        </p>
      </section>

      {/* Milestone badges */}
      <section>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="font-semibold text-ink-900">Milestone badges</h2>
          <span className="badge bg-brand-500/15 text-brand-400">{earnedCount} earned</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {badges.map((b) => {
            const Icon = b.earned ? b.icon : Lock;
            return (
              <div
                key={b.id}
                className={b.earned ? "card flex flex-col items-center p-4 text-center" : "card flex flex-col items-center p-4 text-center opacity-50 grayscale"}
              >
                <span className={b.earned ? `flex h-12 w-12 items-center justify-center rounded-2xl ${b.tint}` : "flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-400"}>
                  <Icon className="h-6 w-6" />
                </span>
                <div className="mt-3 text-sm font-semibold text-ink-900">{b.name}</div>
                <p className="mt-1 text-[11px] leading-snug text-ink-500">{b.desc}</p>
                <span className={b.earned ? "badge mt-2 bg-accent-500/15 text-accent-400" : "badge mt-2 bg-ink-100 text-ink-400"}>
                  {b.earned ? "Earned" : "Locked"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink-900">Leaderboard</h2>
          <span className="badge bg-brand-500/15 text-brand-400">By points</span>
        </div>
        <div className="space-y-2">
          {board.length === 0 && (
            <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-4 text-center text-sm text-ink-400">
              No rankings yet — points build as you log workouts, check-ins and progress.
            </p>
          )}
          {board.map((row) => (
            <div
              key={row.id}
              className={row.you ? "flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-500/15 p-3" : "flex items-center gap-3 rounded-xl border border-ink-100 p-3"}
            >
              <span className="flex w-8 shrink-0 justify-center text-lg font-bold text-ink-700">
                {medals[row.rank] ?? row.rank}
              </span>
              <Avatar initials={row.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-ink-900">{row.name}</span>
                  {row.you && <span className="badge bg-brand-600 text-white">You</span>}
                </div>
              </div>
              <span className="flex items-center gap-1 text-sm font-bold text-brand-400">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {row.points.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
