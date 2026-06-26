"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity, Dumbbell, ClipboardCheck, Scale, Image as ImageIcon, ChevronDown,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useApp, useMyClients } from "@/lib/store";
import { cn } from "@/lib/utils";

type Kind = "workout" | "checkin" | "weight" | "photo";

type FeedItem = {
  id: string;
  kind: Kind;
  clientId: string;
  clientName: string;
  avatar: string;
  date: string;
  ts: number;
  detail: React.ReactNode;
};

const KIND_META: Record<Kind, { icon: React.ComponentType<{ className?: string }>; tint: string }> = {
  workout: { icon: Dumbbell, tint: "bg-brand-500/15 text-brand-400" },
  checkin: { icon: ClipboardCheck, tint: "bg-accent-500/15 text-accent-400" },
  weight: { icon: Scale, tint: "bg-sky-500/15 text-sky-400" },
  photo: { icon: ImageIcon, tint: "bg-violet-500/15 text-violet-400" },
};

const FILTERS: { value: Kind | "all"; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "workout", label: "Workouts" },
  { value: "checkin", label: "Check-ins" },
  { value: "weight", label: "Weigh-ins" },
  { value: "photo", label: "Photos" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - +new Date(iso);
  const m = Math.round(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RecentActivityFeed() {
  const app = useApp();
  const clients = useMyClients();
  const [filter, setFilter] = useState<Kind | "all">("all");

  const items: FeedItem[] = [];
  for (const c of clients) {
    const href = `/dashboard/clients/${c.id}`;
    const name = (
      <Link href={href} className="font-semibold text-ink-900 hover:text-brand-400">
        {c.name}
      </Link>
    );

    for (const w of app.completions[c.id] ?? []) {
      items.push({
        id: "wc_" + w.id, kind: "workout", clientId: c.id, clientName: c.name, avatar: c.avatar, date: w.date, ts: +new Date(w.date),
        detail: (
          <>
            {name} completed <span className="font-medium text-brand-400">{w.workoutName}</span>
            {w.avgRpe > 0 && <> and rated it <span className="text-ink-700">RPE {w.avgRpe}/10</span></>}
            {w.setsLogged > 0 && <span className="text-ink-500"> · {w.setsLogged} sets</span>}
          </>
        ),
      });
    }
    for (const ci of app.checkins.filter((x) => x.clientId === c.id)) {
      items.push({
        id: "ci_" + ci.id, kind: "checkin", clientId: c.id, clientName: c.name, avatar: c.avatar, date: ci.date, ts: +new Date(ci.date),
        detail: <>{name} submitted <span className="font-medium text-accent-400">{ci.formName || "a check-in"}</span></>,
      });
    }
    for (const wl of app.weightLogs[c.id] ?? []) {
      items.push({
        id: "wl_" + c.id + wl.date, kind: "weight", clientId: c.id, clientName: c.name, avatar: c.avatar, date: wl.date, ts: +new Date(wl.date),
        detail: <>{name} weighed in at <span className="font-medium text-sky-400">{wl.weight} lb</span></>,
      });
    }
    for (const p of app.photos[c.id] ?? []) {
      items.push({
        id: "ph_" + p.id, kind: "photo", clientId: c.id, clientName: c.name, avatar: c.avatar, date: p.date, ts: +new Date(p.date),
        detail: <>{name} added a <span className="font-medium text-violet-400">progress photo</span></>,
      });
    }
  }

  items.sort((a, b) => b.ts - a.ts);
  const filtered = filter === "all" ? items : items.filter((i) => i.kind === filter);
  const shown = filtered.slice(0, 60);

  return (
    <div className="card flex flex-col p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-400" />
          <h2 className="font-semibold text-ink-900">Recent activity</h2>
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Kind | "all")}
            className="appearance-none rounded-full border border-ink-200 bg-ink-100 py-1.5 pl-3 pr-8 text-sm font-medium text-ink-700 transition hover:border-ink-300 focus:outline-none"
            aria-label="Filter activity"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        </div>
      </div>

      <div className="mt-4 max-h-[28rem] space-y-1 overflow-y-auto scroll-thin pr-1">
        {shown.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-400">
            No activity yet — sessions, check-ins, weigh-ins and photos from your clients appear here in real time.
          </p>
        ) : (
          shown.map((it) => {
            const Icon = KIND_META[it.kind].icon;
            return (
              <div key={it.id} className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-ink-50">
                <div className="relative shrink-0">
                  <Avatar initials={it.avatar} size="sm" />
                  <span className={cn("absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-ink-100", KIND_META[it.kind].tint)}>
                    <Icon className="h-2.5 w-2.5" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-ink-600">{it.detail}</p>
                  <p className="mt-0.5 text-xs text-ink-400">{timeAgo(it.date)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
