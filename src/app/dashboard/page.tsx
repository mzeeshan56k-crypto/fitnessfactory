"use client";

import Link from "next/link";
import {
  Users, Dumbbell, ClipboardList, Activity, ArrowRight, Calendar,
  AlertTriangle, CheckCircle2, Flame, CalendarPlus, Plus, FileSpreadsheet,
  MessageSquare, Sparkles, TrendingUp, ClipboardCheck, Library,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Modal";
import { AdherenceRing } from "@/components/dashboard/Charts";
import { useApp, useMyClients } from "@/lib/store";
import { cn } from "@/lib/utils";

// Appointments use day 0 = Monday; map JS getDay() (0 = Sun) onto that.
function todayIndex() {
  return (new Date().getDay() + 6) % 7;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* Gradient KPI card */
function Kpi({
  label, value, sub, icon: Icon, gradient,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}) {
  return (
    <div className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-brand-500/40">
      <div className={cn("pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40", gradient)} />
      <div className="relative flex items-center justify-between">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft", gradient)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="relative mt-4 text-3xl font-bold tracking-tight text-ink-900">{value}</div>
      <div className="relative mt-1 text-sm font-medium text-ink-500">{label}</div>
      {sub && <div className="relative mt-0.5 text-xs text-ink-400">{sub}</div>}
    </div>
  );
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

  // ----- real weekly activity from logged workouts + check-ins -----
  const today = new Date();
  const week = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
  const activity = week.map((d) => {
    const key = d.toISOString().slice(0, 10);
    let workouts = 0;
    for (const c of myClients) {
      workouts += (app.completions[c.id] ?? []).filter((w) => w.date.slice(0, 10) === key).length;
    }
    const checkins = app.checkins.filter((ci) => myIds.has(ci.clientId) && ci.date.slice(0, 10) === key).length;
    return { label: dayLabels[(d.getDay() + 6) % 7], total: workouts + checkins };
  });
  const maxActivity = Math.max(1, ...activity.map((a) => a.total));
  const weekTotal = activity.reduce((s, a) => s + a.total, 0);

  const last7 = new Set(week.map((d) => d.toISOString().slice(0, 10)));
  const checkinsThisWeek = app.checkins.filter((ci) => myIds.has(ci.clientId) && last7.has(ci.date.slice(0, 10))).length;
  const openReviews = app.kanban.find((c) => c.id === "formcheck")?.cards.length ?? 0;

  const quickActions = [
    { href: "/dashboard/clients?new=1", label: "Add client", icon: Plus },
    { href: "/dashboard/program-builder", label: "New program", icon: ClipboardList },
    { href: "/dashboard/form-builder", label: "Build a form", icon: FileSpreadsheet },
    { href: "/dashboard/messages", label: "Message", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden rounded-3xl border border-ink-200/60 bg-gradient-to-br from-brand-600 via-brand-700 to-ink-100 p-6 shadow-glow sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-orange-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
              {greeting()}, {firstName} 👋
            </h1>
            <p className="mt-1.5 max-w-lg text-sm text-white/80">
              Here&apos;s what&apos;s happening at {business} today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
              >
                <a.icon className="h-4 w-4" /> {a.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---- First-run onboarding (empty workspace) ---- */}
      {clientCount === 0 && app.programs.length === 0 && app.workouts.length === 0 && (
        <section className="card flex flex-col items-start gap-4 border-brand-500/30 bg-brand-500/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
              <Library className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-ink-900">Get started in seconds</h2>
              <p className="mt-0.5 text-sm text-ink-500">
                Load a ready-made library of exercises, workouts, programs and forms — then add your first client.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={() => app.loadStarterContent()} className="btn-primary">
              <Library className="h-4 w-4" /> Load starter content
            </button>
            <Link href="/dashboard/clients?new=1" className="btn-secondary">
              <Plus className="h-4 w-4" /> Add client
            </Link>
          </div>
        </section>
      )}

      {/* ---- KPIs ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active clients" value={String(clientCount)} sub={clientCount ? `${atRisk.length} need attention` : "Add your first client"} icon={Users} gradient="from-brand-500 to-brand-700" />
        <Kpi label="Programs" value={String(app.programs.length)} sub={`${app.workouts.length} workouts in library`} icon={ClipboardList} gradient="from-violet-500 to-indigo-600" />
        <Kpi label="Check-ins this week" value={String(checkinsThisWeek)} sub={`${openReviews} open form reviews`} icon={ClipboardCheck} gradient="from-sky-500 to-blue-600" />
        <Kpi label="Avg. adherence" value={clientCount ? `${avgAdherence}%` : "—"} sub="Across your roster" icon={Activity} gradient="from-accent-500 to-emerald-600" />
      </div>

      {/* ---- Activity + snapshot ---- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly activity (themed, dependency-free bar chart) */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-400" />
              <h2 className="font-semibold text-ink-900">Weekly activity</h2>
            </div>
            <span className="text-sm text-ink-500">{weekTotal} this week</span>
          </div>
          {weekTotal === 0 ? (
            <p className="mt-10 mb-10 text-center text-sm text-ink-400">
              Activity appears here as clients log workouts and submit check-ins.
            </p>
          ) : (
            <div className="mt-6 flex h-44 items-end justify-between gap-2 sm:gap-4">
              {activity.map((a, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-orange-400 transition-all duration-500"
                      style={{ height: `${Math.max(6, (a.total / maxActivity) * 100)}%` }}
                      title={`${a.total} activity`}
                    />
                  </div>
                  <span className="text-xs font-medium text-ink-400">{a.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coaching snapshot */}
        <div className="card p-6">
          <h2 className="font-semibold text-ink-900">Coaching snapshot</h2>
          <p className="mt-1 text-sm text-ink-500">Roster adherence</p>
          <div className="mt-2">
            <AdherenceRing value={avgAdherence} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3 text-center">
              <div className="text-xl font-bold text-ink-900">{todays.length}</div>
              <div className="text-xs text-ink-500">Sessions today</div>
            </div>
            <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3 text-center">
              <div className="text-xl font-bold text-ink-900">{checkinsThisWeek}</div>
              <div className="text-xs text-ink-500">Check-ins (7d)</div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Schedule + needs attention ---- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's schedule */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-400" />
              <h2 className="font-semibold text-ink-900">Today&apos;s schedule</h2>
            </div>
            <Link href="/dashboard/calendar" className="text-sm font-medium text-brand-400 hover:text-brand-300">
              View calendar
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {todays.map((a) => {
              const c = a.clientId ? getClient(a.clientId) : undefined;
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 transition hover:border-brand-500/30 hover:bg-brand-500/5">
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
                className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 transition hover:border-brand-500/30 hover:bg-brand-500/5"
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

      {/* ---- Client roster ---- */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-400" />
            <h2 className="font-semibold text-ink-900">Client roster</h2>
          </div>
          <Link href="/dashboard/clients" className="flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300">
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
    </div>
  );
}
