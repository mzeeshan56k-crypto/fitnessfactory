import Link from "next/link";
import {
  Users, Dumbbell, DollarSign, Activity, ArrowRight, Calendar,
  AlertTriangle, CheckCircle2, Flame,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart, ActivityChart } from "@/components/dashboard/Charts";
import { Avatar } from "@/components/ui/Avatar";
import {
  clients, revenueData, activityData, appointments, getClient,
} from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const todays = appointments.filter((a) => a.day === 0);
  const atRisk = clients.filter((c) => c.adherence < 60 || c.status === "inactive");
  const recent = clients.filter((c) => c.status === "active").slice(0, 5);

  return (
    <>
      <PageHeader
        title="Welcome back, Alex 👋"
        subtitle="Here's what's happening with your clients today."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active clients" value="42" delta="8.2%" icon={Users} />
        <StatCard label="Monthly revenue" value={formatCurrency(8450)} delta="15.7%" icon={DollarSign} />
        <StatCard label="Workouts this week" value="68" delta="4.1%" icon={Dumbbell} />
        <StatCard label="Avg. adherence" value="91%" delta="2.3%" icon={Activity} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink-900">Revenue</h2>
              <p className="text-sm text-ink-500">Monthly recurring revenue</p>
            </div>
            <span className="text-2xl font-bold text-ink-900">{formatCurrency(8450)}</span>
          </div>
          <div className="mt-4">
            <RevenueChart data={revenueData} />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">Today&apos;s schedule</h2>
            <Link href="/dashboard/calendar" className="text-sm font-medium text-brand-400 hover:text-brand-400">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {todays.map((a) => {
              const c = getClient(a.clientId);
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
              <p className="py-8 text-center text-sm text-ink-400">No sessions today 🎉</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">Client activity</h2>
            <div className="flex items-center gap-4 text-xs text-ink-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Workouts</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent-400" /> Sessions</span>
            </div>
          </div>
          <div className="mt-4">
            <ActivityChart data={activityData} />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-ink-900">Needs attention</h2>
          </div>
          <p className="mt-1 text-sm text-ink-500">AI-flagged at-risk clients</p>
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
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-900">Recent client progress</h2>
          <Link href="/dashboard/clients" className="flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-400">
            All clients <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
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
      </div>
    </>
  );
}
