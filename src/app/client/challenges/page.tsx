"use client";

import Link from "next/link";
import { Trophy, Users, Clock, Check, Flame, Star, UserPlus } from "lucide-react";
import { leaderboard } from "@/lib/platform";
import { useApp, useCurrentClient } from "@/lib/store";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Modal";

const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function ClientChallengesPage() {
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

  const challenges = app.challenges;
  const youRow = leaderboard.find((r) => r.you);
  const joinedCount = challenges.filter((c) => c.joined).length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <div className="flex items-center gap-2 text-sm text-brand-100">
          <Trophy className="h-4 w-4" /> Challenges
        </div>
        <h1 className="mt-1 text-2xl font-bold">Compete, stay accountable, win 🏆</h1>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-brand-100">Your points</div>
            <div className="mt-1 flex items-center gap-1.5 text-2xl font-bold">
              <Star className="h-5 w-5 fill-amber-300 text-amber-300" />
              {youRow ? youRow.points.toLocaleString() : "0"}
            </div>
          </div>
          <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-brand-100">Joined</div>
            <div className="mt-1 flex items-center gap-1.5 text-2xl font-bold">
              <Flame className="h-5 w-5 text-orange-300" />
              {joinedCount} active
            </div>
          </div>
        </div>
      </section>

      {/* Active challenges */}
      <section>
        <h2 className="mb-3 px-1 font-semibold text-ink-900">Active challenges</h2>
        {challenges.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No challenges yet"
            description="Create a challenge in the Trainer portal and it will appear here for your clients to join."
            action={<Link href="/dashboard/challenges" className="btn-primary">Go to Challenges</Link>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {challenges.map((c) => {
              const joined = !!c.joined;
              return (
                <div key={c.id} className="card overflow-hidden">
                  <div className={`bg-gradient-to-br ${c.color} p-4 text-white`}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold leading-tight">{c.name}</h3>
                      {joined && (
                        <span className="badge bg-white/20 text-white">
                          <Check className="h-3 w-3" /> Joined
                        </span>
                      )}
                    </div>
                    <span className="badge mt-2 bg-white/20 text-white">{c.metric}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-ink-600">{c.desc}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {c.daysLeft} days left
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />{" "}
                        {c.participants.toLocaleString()} joined
                      </span>
                    </div>
                    <button
                      onClick={() => app.toggleJoinChallenge(c.id)}
                      className={
                        joined
                          ? "btn-secondary mt-4 w-full"
                          : "btn-primary mt-4 w-full"
                      }
                    >
                      {joined ? (
                        <>
                          <Check className="h-4 w-4" /> Joined ✓
                        </>
                      ) : (
                        "Join challenge"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Leaderboard */}
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink-900">Leaderboard</h2>
          <span className="badge bg-brand-500/15 text-brand-400">This month</span>
        </div>
        <div className="space-y-2">
          {leaderboard.map((row) => (
            <div
              key={row.rank}
              className={
                row.you
                  ? "flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-500/15 p-3"
                  : "flex items-center gap-3 rounded-xl border border-ink-100 p-3"
              }
            >
              <span className="flex w-8 shrink-0 justify-center text-lg font-bold text-ink-700">
                {medals[row.rank] ?? row.rank}
              </span>
              <Avatar initials={row.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-ink-900">
                    {row.name}
                  </span>
                  {row.you && (
                    <span className="badge bg-brand-600 text-white">You</span>
                  )}
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
