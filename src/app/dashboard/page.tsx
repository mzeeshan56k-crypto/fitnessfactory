"use client";

import Link from "next/link";
import {
  Users, Dumbbell, ClipboardList, Activity, ArrowRight, Calendar,
  AlertTriangle, CheckCircle2, Flame, CalendarPlus, Plus, Sparkles, CalendarDays,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Modal";
import { useApp, useMyClients } from "@/lib/store";
import { cn } from "@/lib/utils";

// Appointments use day 0 = Monday; map JS getDay() (0 = Sun) onto that.
function todayIndex() {
  return (new Date().getDay() + 6) % 7;
}

export default function DashboardPage() {
  const app = useApp();
  const myClients = useMyClients();

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );
  }

  const firstName = (app.settings.trainerName?.trim() || "Coach").split(" ")[0];
  const business = app.settings.businessName?.trim() || "your gym";
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  const quickActions = [
    { href: "/dashboard/workouts", label: "Create workout", icon: Dumbbell, primary: true },
    { href: "/dashboard/clients?new=1", label: "Add client", icon: Users },
    { href: "/dashboard/program-builder", label: "Build program", icon: ClipboardList },
    { href: "/dashboard/calendar", label: "Schedule", icon: CalendarDays },
  ];

  const clientCount = myClients.length;
  const avgAdherence =
    clientCount > 0
      ? Math.round(myClients.reduce((s, c) => s + (c.adherence ?? 0), 0) / clientCount)
      : 0;

  const myIds = new Set(myClients.map((c) => c.id));
  const todays = app.appointments.filter((a) => a.day === todayIndex() && (!a.clientId || myIds.has(a.clientId)));
  const atRisk = myClients.filter((c) => c.adherence < 60 || c.status === "inactive");
  const recent = myClients.filter((c) => c.status === "active").slice(0, 5);
  const getClient = (id: string) => myClients.find((c) => c.id === id);

  return (
    <>
      {/* Welcome hero */}
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-100 p-6 text-white shadow-glow sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-100">
              <Sparkles className="h-4 w-4" /> {todayLabel}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {firstName} 👋
            </h1>
            <p className="mt-1 max-w-md text-sm text-brand-100">
              Here&apos;s what&apos;s happening at {business} today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.label}
                  href={a.href}
                  className={cn(
                    "btn",
                    a.primary
                      ? "bg-white text-ink-900 shadow-soft hover:bg-white/90"
                      : "bg-white/15 text-white ring-1 ring-inset ring-white/30 backdrop-blur-sm hover:bg-white/25",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {a.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active clients" value={String(clientCount)} icon={Users} />
        <StatCard label="Programs" value={String(app.programs.length)} icon={ClipboardList} />
        <StatCard label="Workouts in library" value={String(app.workouts.length)} icon={Dumbbell} />
        <StatCard label="Avg. adherence" value={clientCount ? `${avgAdherence}%` : "—"} icon={Activity} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Today's schedule */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">Today&apos;s schedule</h2>
            <Link href="/dashboard/calendar" className="text-sm font-medium text-brand-400 hover:text-brand-400">
              View calendar
            </Link>
          </div>
          <div className="mt-4 space-y-3">
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
            {recent.map((c) => (
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
                <div className="hidden items-center gap-2 text-xs text-ink-500 sm:flex">
                  <Flame className="h-4 w-4 text-orange-500" /> {c.adherence}%
                </div>
                <div className="hidden w-40 sm:block">
                  <div className="mb-1 flex justify-between text-xs text-ink-500">
                    <span>{c.goal}</span><span>{c.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-accent-500" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
