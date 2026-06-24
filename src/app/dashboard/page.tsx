"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users, ClipboardList, Activity, ArrowRight, Calendar,
  AlertTriangle, CheckCircle2, Flame, CalendarPlus, Dumbbell,
  ClipboardCheck, Images, Layers, Zap,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Modal";
import { useApp, useMyClients } from "@/lib/store";
import { timeAgo } from "@/lib/utils";

// Appointments use day 0 = Monday; map JS getDay() (0 = Sun) onto that.
function todayIndex() {
  return (new Date().getDay() + 6) % 7;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type ActivityItem = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  text: React.ReactNode;
  date: string;
  href: string;
};

export default function DashboardPage() {
  const app = useApp();
  const myClients = useMyClients();

  // Pull the latest workspace on open so the dashboard reflects the newest
  // assignments and client activity immediately.
  const { refresh } = app;
  useEffect(() => { refresh(); }, [refresh]);

  const myIds = useMemo(() => new Set(myClients.map((c) => c.id)), [myClients]);

  // Live "recent activity" feed — assignments the coach made plus what
  // members have been doing (completed sessions, check-ins, photos).
  const activity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    const since = Date.now() - WEEK_MS * 4;
    for (const c of myClients) {
      const href = `/dashboard/clients/${c.id}`;
      const plan = app.clientPlans[c.id];
      if (plan?.updatedAt && new Date(plan.updatedAt).getTime() > since) {
        const count = plan.workoutIds?.length ?? 0;
        items.push({
          id: `plan-${c.id}`,
          icon: Layers,
          tint: "bg-brand-500/15 text-brand-400",
          text: <><span className="font-semibold">{c.name}</span>&rsquo;s plan updated · {count} workout{count === 1 ? "" : "s"} assigned</>,
          date: plan.updatedAt,
          href,
        });
      }
      for (const s of app.completions[c.id] ?? []) {
        items.push({
          id: `wc-${s.id}`,
          icon: CheckCircle2,
          tint: "bg-accent-500/15 text-accent-400",
          text: <><span className="font-semibold">{c.name}</span> completed {s.workoutName}</>,
          date: s.date,
          href,
        });
      }
      for (const ci of app.checkins.filter((x) => x.clientId === c.id)) {
        items.push({
          id: `ci-${ci.id}`,
          icon: ClipboardCheck,
          tint: "bg-violet-500/15 text-violet-400",
          text: <><span className="font-semibold">{c.name}</span> submitted a check-in</>,
          date: ci.date,
          href,
        });
      }
      for (const p of app.photos[c.id] ?? []) {
        items.push({
          id: `ph-${p.id}`,
          icon: Images,
          tint: "bg-amber-500/15 text-amber-400",
          text: <><span className="font-semibold">{c.name}</span> added a progress photo</>,
          date: p.date,
          href,
        });
      }
    }
    return items
      .filter((i) => !Number.isNaN(new Date(i.date).getTime()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [myClients, app.clientPlans, app.completions, app.checkins, app.photos]);

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );
  }

  const firstName = (app.settings.trainerName?.trim() || "Coach").split(" ")[0];
  const business = app.settings.businessName?.trim() || "your gym";

  const clientCount = myClients.length;
  const avgAdherence =
    clientCount > 0
      ? Math.round(myClients.reduce((s, c) => s + (c.adherence ?? 0), 0) / clientCount)
      : 0;

  // Assignment-aware figures that change the instant a coach assigns training.
  const activePlans = myClients.filter((c) => {
    const plan = app.clientPlans[c.id];
    return (plan?.workoutIds?.length ?? 0) > 0 || !!plan?.programId;
  }).length;
  const totalAssigned = myClients.reduce(
    (s, c) => s + (app.clientPlans[c.id]?.workoutIds?.length ?? 0),
    0,
  );
  const sessionsThisWeek = myClients.reduce((s, c) => {
    const list = app.completions[c.id] ?? [];
    return s + list.filter((w) => Date.now() - new Date(w.date).getTime() < WEEK_MS).length;
  }, 0);

  const todays = app.appointments.filter((a) => a.day === todayIndex() && (!a.clientId || myIds.has(a.clientId)));
  const atRisk = myClients.filter((c) => c.adherence < 60 || c.status === "inactive");
  const recent = myClients.filter((c) => c.status === "active").slice(0, 6);
  const getClient = (id: string) => myClients.find((c) => c.id === id);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName} 👋`}
        subtitle={`Here's what's happening at ${business} today.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active clients" value={String(clientCount)} icon={Users} />
        <StatCard label="Clients with a plan" value={clientCount ? `${activePlans}` : "—"} hint={`${totalAssigned} workouts assigned`} icon={ClipboardList} />
        <StatCard label="Sessions this week" value={String(sessionsThisWeek)} icon={Dumbbell} />
        <StatCard label="Avg. adherence" value={clientCount ? `${avgAdherence}%` : "—"} icon={Activity} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Live activity feed */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-brand-400" />
              <h2 className="font-semibold text-ink-900">Recent activity</h2>
            </div>
            <Link href="/dashboard/clients" className="text-sm font-medium text-brand-400 hover:text-brand-400">
              All clients
            </Link>
          </div>
          <p className="mt-1 text-sm text-ink-500">Assignments and what your clients have been doing.</p>
          <div className="mt-4 space-y-2">
            {activity.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-400">
                {clientCount === 0
                  ? "No clients yet — add one to start assigning training."
                  : "No activity yet. Assign a workout or program and it shows up here instantly."}
              </p>
            ) : (
              activity.map((a) => (
                <Link
                  key={a.id}
                  href={a.href}
                  className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.tint}`}>
                    <a.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 text-sm text-ink-700">{a.text}</div>
                  <span className="shrink-0 text-xs text-ink-400">{timeAgo(a.date)}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Needs attention */}
        <div className="card p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-ink-900">Needs attention</h2>
          </div>
          <p className="mt-1 text-sm text-ink-500">At-risk or inactive clients</p>
          <div className="mt-4 space-y-3">
            {atRisk.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/clients/${c.id}`}
                className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <Avatar initials={c.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink-900">{c.name}</div>
                  <div className="text-xs text-ink-500">{c.adherence}% adherence · {c.lastActive}</div>
                </div>
                <span className="badge bg-amber-500/15 text-amber-400">At risk</span>
              </Link>
            ))}
            {atRisk.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-400">
                {clientCount === 0 ? "No clients yet." : "Everyone's on track 🎉"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Today's schedule */}
      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-900">Today&apos;s schedule</h2>
          <Link href="/dashboard/calendar" className="text-sm font-medium text-brand-400 hover:text-brand-400">
            View calendar
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {todays.map((a) => {
            const c = a.clientId ? getClient(a.clientId) : undefined;
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                <div className="flex h-11 w-11 flex-col items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink-900">{a.title}</div>
                  <div className="text-xs text-ink-500">{a.start} – {a.end}</div>
                </div>
                {c && <Avatar initials={c.avatar} size="sm" />}
              </div>
            );
          })}
        </div>
        {todays.length === 0 && (
          <div className="py-6">
            <EmptyState
              icon={CalendarPlus}
              title="Nothing scheduled today"
              description="Book a session or check-in and it will show up here."
              action={
                <Link href="/dashboard/calendar" className="btn-primary">
                  Open calendar
                </Link>
              }
            />
          </div>
        )}
      </div>

      {/* Recent client progress */}
      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-900">Client roster</h2>
          <Link href="/dashboard/clients" className="flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-400">
            All clients <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Users}
              title="No clients yet"
              description="Add your first client to start building programs, tracking progress and messaging."
              action={
                <Link href="/dashboard/clients?new=1" className="btn-primary">
                  Add client
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {recent.map((c) => {
              const assigned = app.clientPlans[c.id]?.workoutIds?.length ?? 0;
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/clients/${c.id}`}
                  className="flex items-center gap-4 rounded-xl p-3 transition hover:bg-ink-50"
                >
                  <Avatar initials={c.avatar} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink-900">{c.name}</div>
                    <div className="text-xs text-ink-500">{c.program}</div>
                  </div>
                  <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-400 sm:inline-flex">
                    <Dumbbell className="h-3.5 w-3.5" /> {assigned} assigned
                  </span>
                  <div className="hidden items-center gap-2 text-xs text-ink-500 sm:flex">
                    <Flame className="h-4 w-4 text-orange-500" /> {c.adherence}%
                  </div>
                  <div className="hidden w-40 lg:block">
                    <div className="mb-1 flex justify-between text-xs text-ink-500">
                      <span>{c.goal}</span><span>{c.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-accent-500" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
