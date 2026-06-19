"use client";

import {
  Users, UserCog, DollarSign, Dumbbell, Star,
  TrendingUp, TrendingDown, Gauge, ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EnrollmentChart } from "@/components/dashboard/Charts";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Modal";
import { adminKpis, enrollmentTrend, billingTiers } from "@/lib/platform";
import { useApp } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

const roleBadge: Record<string, string> = {
  Client: "bg-ink-100 text-ink-700",
  Coach: "bg-brand-500/15 text-brand-400",
  Staff: "bg-purple-500/15 text-purple-400",
  Admin: "bg-accent-500/15 text-accent-400",
};

const statusBadge: Record<string, string> = {
  active: "bg-accent-500/15 text-accent-400",
  suspended: "bg-rose-500/15 text-rose-400",
  invited: "bg-amber-500/15 text-amber-400",
};

const insights = [
  { label: "Client retention", value: "94.2%", icon: TrendingUp, tone: "text-accent-400", bg: "bg-accent-500/15" },
  { label: "Monthly churn", value: "2.8%", icon: TrendingDown, tone: "text-rose-400", bg: "bg-rose-500/15" },
  { label: "Avg session rating", value: "4.8 / 5", icon: Star, tone: "text-amber-400", bg: "bg-amber-500/15" },
  { label: "Support SLA met", value: "98.5%", icon: Gauge, tone: "text-brand-400", bg: "bg-brand-500/15" },
];

export default function AdminOverviewPage() {
  const app = useApp();
  const maxSubs = Math.max(...billingTiers.map((t) => t.subscribers));

  const coaches = app.users.filter((u) => u.role === "Coach");
  const coachCount = coaches.length;
  const clientCount = app.clients.length;

  return (
    <>
      <PageHeader
        title="Platform overview"
        subtitle="Aggregate activity across the entire facility network"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Coaches" value={app.hydrated ? coachCount.toLocaleString() : "—"} delta="4.5%" icon={UserCog} />
        <StatCard label="Clients" value={app.hydrated ? clientCount.toLocaleString() : "—"} delta="6.8%" icon={Users} />
        <StatCard label="MRR" value={formatCurrency(adminKpis.mrr)} delta="9.1%" icon={DollarSign} />
        <StatCard label="Workouts today" value={adminKpis.workoutsToday.toLocaleString()} delta="3.2%" icon={Dumbbell} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink-900">Client growth</h2>
              <p className="text-sm text-ink-500">Network-wide enrollment trend</p>
            </div>
            <span className="text-2xl font-bold text-ink-900">{adminKpis.clients.toLocaleString()}</span>
          </div>
          <div className="mt-4">
            <EnrollmentChart data={enrollmentTrend} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-ink-900">Subscribers by tier</h2>
          <p className="text-sm text-ink-500">Active plan distribution</p>
          <div className="mt-5 space-y-4">
            {billingTiers.map((t) => (
              <div key={t.name}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-ink-700">{t.name}</span>
                  <span className="font-semibold text-ink-900">{t.subscribers.toLocaleString()}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-ink-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${t.color}`}
                    style={{ width: `${(t.subscribers / maxSubs) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-900">Top trainers</h2>
          <span className="text-sm text-ink-500">Coaches on the platform</span>
        </div>

        {!app.hydrated ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
          </div>
        ) : coaches.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={UserCog}
              title="No coaches yet"
              description="Invite coaches from Identity & Access and they'll appear here."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto scroll-thin">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="pb-3 font-medium">Trainer</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((t) => (
                  <tr key={t.id} className="border-b border-ink-50 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={t.avatar} size="sm" />
                        <span className="font-semibold text-ink-900">{t.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-ink-700">{t.email}</td>
                    <td className="py-3">
                      <span className={`badge ${roleBadge[t.role]}`}>{t.role}</span>
                    </td>
                    <td className="py-3">
                      <span className={`badge capitalize ${statusBadge[t.status]}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-ink-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Operational insight trends
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {insights.map((i) => (
            <div key={i.label} className="card p-5">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${i.bg} ${i.tone}`}>
                <i.icon className="h-5 w-5" />
              </span>
              <div className="mt-4 text-2xl font-bold text-ink-900">{i.value}</div>
              <div className="mt-1 text-sm text-ink-500">{i.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
