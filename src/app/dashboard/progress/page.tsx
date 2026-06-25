"use client";

import Link from "next/link";
import {
  Activity, Flame, Target, Users, ClipboardCheck, Dumbbell, LineChart, CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Modal";
import { DataControls } from "@/components/dashboard/DataControls";
import { useApp, useMyClients } from "@/lib/store";

type Feed = { id: string; type: "workout" | "checkin"; date: string; clientName: string; avatar: string; label: string };

export default function ProgressPage() {
  const app = useApp();
  const clients = useMyClients();

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );
  }

  const clientCount = clients.length;
  const avgAdherence =
    clientCount > 0
      ? Math.round(clients.reduce((s, c) => s + (c.adherence ?? 0), 0) / clientCount)
      : 0;
  const myIds = new Set(clients.map((c) => c.id));
  const totalWorkouts = clients.reduce((s, c) => s + (app.completions[c.id]?.length ?? 0), 0);
  const totalCheckins = app.checkins.filter((ci) => myIds.has(ci.clientId)).length;

  // Real, live activity feed across this coach's clients.
  const feed: Feed[] = [];
  for (const c of clients) {
    for (const w of app.completions[c.id] ?? []) {
      feed.push({ id: w.id, type: "workout", date: w.date, clientName: c.name, avatar: c.avatar, label: w.workoutName });
    }
  }
  for (const ci of app.checkins) {
    if (!myIds.has(ci.clientId)) continue;
    const c = clients.find((x) => x.id === ci.clientId);
    if (c) feed.push({ id: ci.id, type: "checkin", date: ci.date, clientName: c.name, avatar: c.avatar, label: ci.formName || "Check-in" });
  }
  feed.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const recent = feed.slice(0, 12);

  const roster = [...clients].sort((a, b) => (b.adherence ?? 0) - (a.adherence ?? 0));

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <>
      <PageHeader
        title="Progress"
        subtitle="Live client adherence, sessions and check-ins"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active clients" value={String(clientCount)} icon={Users} />
        <StatCard label="Avg adherence" value={clientCount ? `${avgAdherence}%` : "—"} icon={Target} />
        <StatCard label="Sessions logged" value={String(totalWorkouts)} icon={Activity} />
        <StatCard label="Check-ins" value={String(totalCheckins)} icon={ClipboardCheck} />
      </div>

      {clientCount === 0 ? (
        <div className="mt-6 space-y-6">
          <EmptyState
            icon={LineChart}
            title="No client progress yet"
            description="Add clients and this fills with their real adherence, logged sessions and check-ins as they happen."
            action={<Link href="/dashboard/clients?new=1" className="btn-primary">Add client</Link>}
          />
          <DataControls variant="card" />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Roster progress */}
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-400" />
                <h2 className="font-semibold text-ink-900">Client roster</h2>
              </div>
              <Link href="/dashboard/clients" className="text-sm font-medium text-brand-400 hover:text-brand-300">
                All clients
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {roster.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/clients/${c.id}`}
                  className="flex items-center gap-4 rounded-xl p-3 transition hover:bg-ink-50"
                >
                  <Avatar initials={c.avatar} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink-900">{c.name}</div>
                    <div className="truncate text-xs text-ink-500">{c.program}</div>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <div className="mb-1 flex justify-between text-xs text-ink-500">
                      <span>Adherence</span><span className="font-semibold text-ink-700">{c.adherence}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${c.adherence}%` }} />
                    </div>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <div className="mb-1 flex justify-between text-xs text-ink-500">
                      <span>Goal</span><span className="font-semibold text-ink-700">{c.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent activity feed */}
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="font-semibold text-ink-900">Recent activity</h2>
            </div>
            <p className="mt-1 text-sm text-ink-500">Sessions &amp; check-ins as they come in</p>
            <div className="mt-4 space-y-3">
              {recent.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-400">
                  No activity yet — it appears the moment a client logs a session or submits a check-in.
                </p>
              ) : (
                recent.map((f) => (
                  <div key={`${f.type}-${f.id}`} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${f.type === "workout" ? "bg-brand-500/15 text-brand-400" : "bg-accent-500/15 text-accent-400"}`}>
                      {f.type === "workout" ? <Dumbbell className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink-900">{f.clientName}</div>
                      <div className="truncate text-xs text-ink-500">
                        {f.type === "workout" ? "Logged" : "Submitted"} {f.label}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-ink-400">{fmt(f.date)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
