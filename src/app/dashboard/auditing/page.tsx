"use client";

import { useState } from "react";
import {
  CheckCircle2, AlertTriangle, Eye, Sparkles, FileText, ClipboardList, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { ComplianceBars } from "@/components/dashboard/Charts";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Modal";
import { lightStyles, type Light } from "@/lib/platform";
import type { Client } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Filter = "all" | "red" | "yellow" | "green";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "red", label: "At risk" },
  { id: "yellow", label: "Watch" },
  { id: "green", label: "On track" },
];

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

interface Derived {
  client: Client;
  light: Light;
  workout: number;
  diet: number;
  habits: number;
}

function lightOf(adherence: number): Light {
  if (adherence >= 80) return "green";
  if (adherence >= 50) return "yellow";
  return "red";
}

function derive(client: Client): Derived {
  const a = client.adherence ?? 0;
  return {
    client,
    light: lightOf(a),
    workout: clamp(a),
    diet: clamp(a - 8),
    habits: clamp(a - 12),
  };
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-ink-100">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-xs font-medium tabular-nums text-ink-600">{value}%</span>
    </div>
  );
}

function generateReview(d: Derived): string {
  const name = d.client.name.split(" ")[0] || "This client";
  const strongest = Math.max(d.workout, d.diet, d.habits);
  const weakest = Math.min(d.workout, d.diet, d.habits);
  const weakArea =
    weakest === d.workout ? "workout completion" : weakest === d.diet ? "nutrition logging" : "daily habits";
  const strongArea =
    strongest === d.workout ? "training adherence" : strongest === d.diet ? "nutrition" : "habit consistency";

  if (d.light === "red") {
    return `${name} is significantly off-plan with overall adherence at ${d.client.adherence}%. Workout completion sits at ${d.workout}%, diet at ${d.diet}% and habits at ${d.habits}%. The biggest gap is ${weakArea} (${weakest}%). Immediate action recommended: schedule a 1:1 to rebuild momentum before the account churns.`;
  }
  if (d.light === "yellow") {
    return `${name} is mostly on track but worth watching — overall adherence is ${d.client.adherence}%. ${strongArea} is the bright spot (${strongest}%), while ${weakArea} (${weakest}%) is dragging overall results. A light-touch nudge this week should keep things from slipping.`;
  }
  return `${name} is performing strongly with ${d.client.adherence}% overall adherence. Across the board — workout ${d.workout}%, diet ${d.diet}%, habits ${d.habits}% — adherence is excellent, led by ${strongArea} at ${strongest}%. Consider progressing the program to keep them challenged.`;
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export default function AuditingPage() {
  const app = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [reviews, setReviews] = useState<Record<string, string>>({});

  if (!app.hydrated) return <Loading />;

  if (app.clients.length === 0) {
    return (
      <>
        <PageHeader
          title="Performance auditing"
          subtitle="Monitor engagement and flag at-risk accounts"
        />
        <EmptyState
          icon={ClipboardList}
          title="No clients to audit yet"
          description="Add clients in the Clients page to start tracking adherence and compliance."
        />
      </>
    );
  }

  const derived = app.clients.map(derive);

  const counts = derived.reduce(
    (acc, d) => {
      acc[d.light] += 1;
      return acc;
    },
    { green: 0, yellow: 0, red: 0 } as Record<Light, number>,
  );

  const n = derived.length;
  const avg = (sel: (d: Derived) => number) =>
    n === 0 ? 0 : clamp(derived.reduce((s, d) => s + sel(d), 0) / n);
  const rates = {
    workout: avg((d) => d.workout),
    diet: avg((d) => d.diet),
    habits: avg((d) => d.habits),
  };

  const rows = filter === "all" ? derived : derived.filter((d) => d.light === filter);

  function toggleReview(d: Derived) {
    setReviews((prev) => {
      const next = { ...prev };
      if (next[d.client.id]) {
        delete next[d.client.id];
      } else {
        next[d.client.id] = generateReview(d);
      }
      return next;
    });
  }

  return (
    <>
      <PageHeader
        title="Performance auditing"
        subtitle="Monitor engagement and flag at-risk accounts"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <h2 className="font-semibold text-ink-900">Rolling compliance</h2>
          <p className="mb-5 text-sm text-ink-500">Across your active roster</p>
          <ComplianceBars workout={rates.workout} diet={rates.diet} habits={rates.habits} />
        </div>
        <StatCard label="On track" value={String(counts.green)} icon={CheckCircle2} />
        <div className="grid gap-6 sm:grid-cols-2 lg:contents">
          <StatCard label="Watch list" value={String(counts.yellow)} icon={Eye} positive={false} />
          <StatCard label="At risk" value={String(counts.red)} icon={AlertTriangle} positive={false} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                active
                  ? "bg-brand-600 text-white shadow-glow"
                  : "border border-ink-200 bg-ink-100 text-ink-700 hover:bg-ink-50",
              )}
            >
              {f.label}
              {f.id !== "all" && (
                <span className={cn("ml-1.5 text-xs", active ? "text-white/80" : "text-ink-400")}>
                  {counts[f.id as Light]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((d) => {
          const styles = lightStyles[d.light];
          const open = Boolean(reviews[d.client.id]);
          const isRed = d.light === "red";

          return (
            <div
              key={d.client.id}
              className={cn(
                "card overflow-hidden transition",
                isRed && "border-rose-200 bg-rose-50/40 ring-1 ring-rose-100",
              )}
            >
              <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className={cn("h-3 w-3 shrink-0 rounded-full", styles.dot)} />
                  <Avatar initials={d.client.avatar} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-ink-900">{d.client.name}</span>
                      <span className={cn("badge", styles.badge)}>{styles.label}</span>
                    </div>
                    <p className="truncate text-xs text-ink-500">{d.client.program}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 lg:gap-6">
                  <div>
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-400">Workout</div>
                    <MiniBar value={d.workout} color="bg-brand-500" />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-400">Diet</div>
                    <MiniBar value={d.diet} color="bg-accent-500" />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-400">Habits</div>
                    <MiniBar value={d.habits} color="bg-amber-500" />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => toggleReview(d)}
                    className={cn(open ? "btn-secondary" : "btn-primary", "whitespace-nowrap")}
                  >
                    <Sparkles className="h-4 w-4" />
                    {open ? "Hide review" : "Generate progress review"}
                  </button>
                </div>
              </div>

              {open && (
                <div className="border-t border-brand-100 bg-brand-50/50 px-5 py-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-400">
                    <FileText className="h-3.5 w-3.5" /> Auto-generated progress review
                  </div>
                  <p className="text-sm leading-relaxed text-ink-700">{reviews[d.client.id]}</p>
                </div>
              )}
            </div>
          );
        })}

        {rows.length === 0 && (
          <p className="card p-10 text-center text-sm text-ink-400">No clients in this segment.</p>
        )}
      </div>
    </>
  );
}
