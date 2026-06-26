"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ClipboardCheck, Dumbbell, MessageSquare, CheckCheck } from "lucide-react";
import { useApp, useMyClients } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useLocalState } from "@/lib/useLocalState";

type Notif = {
  id: string;
  kind: "checkin" | "workout" | "message";
  title: string;
  sub: string;
  href: string;
  ts: number;
};

const ICONS = {
  checkin: ClipboardCheck,
  workout: Dumbbell,
  message: MessageSquare,
} as const;

const TINTS = {
  checkin: "bg-accent-500/15 text-accent-400",
  workout: "bg-brand-500/15 text-brand-400",
  message: "bg-sky-500/15 text-sky-400",
} as const;

export function NotificationsBell() {
  const app = useApp();
  const clients = useMyClients();
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useLocalState<number>("ffkc-notif-seen", 0);
  // Only surface activity from the current login session. Fall back to the last
  // 7 days if we never recorded a login time in this browser.
  const [loginAt] = useLocalState<number>("ffkc-login-at", 0);
  const since = loginAt || Date.now() - 7 * 24 * 60 * 60 * 1000;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const ids = new Set(clients.map((c) => c.id));
  const notifs: Notif[] = [];

  for (const ci of app.checkins) {
    if (!ids.has(ci.clientId)) continue;
    const c = clients.find((x) => x.id === ci.clientId);
    if (!c) continue;
    notifs.push({
      id: "ci_" + ci.id,
      kind: "checkin",
      title: `${c.name} submitted ${ci.formName || "a check-in"}`,
      sub: timeAgo(ci.date),
      href: `/dashboard/clients/${c.id}`,
      ts: +new Date(ci.date),
    });
  }
  for (const c of clients) {
    for (const w of app.completions[c.id] ?? []) {
      notifs.push({
        id: "wc_" + w.id,
        kind: "workout",
        title: `${c.name} logged ${w.workoutName}`,
        sub: timeAgo(w.date),
        href: `/dashboard/clients/${c.id}`,
        ts: +new Date(w.date),
      });
    }
  }
  for (const conv of app.conversations) {
    if (conv.unread <= 0 || !ids.has(conv.clientId)) continue;
    const c = clients.find((x) => x.id === conv.clientId);
    if (!c) continue;
    notifs.push({
      id: "msg_" + conv.clientId,
      kind: "message",
      title: `${c.name} sent you a message`,
      sub: `${conv.unread} unread`,
      href: `/dashboard/messages`,
      ts: Date.now(),
    });
  }

  // Keep only what happened during this login session, newest first.
  const session = notifs.filter((n) => n.ts >= since).sort((a, b) => b.ts - a.ts);
  const recent = session.slice(0, 12);
  const unread = session.filter((n) => n.ts > lastSeen).length;

  function toggle() {
    setOpen((o) => {
      const next = !o;
      if (next) setLastSeen(Date.now());
      return next;
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-600 hover:bg-ink-200"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-ink-100">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-ink-200/70 bg-ink-100 shadow-2xl">
          <div className="flex items-center justify-between border-b border-ink-200/60 px-4 py-3">
            <span className="font-semibold text-ink-900">Notifications</span>
            {recent.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                <CheckCheck className="h-3.5 w-3.5" /> All caught up
              </span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto scroll-thin">
            {recent.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-ink-400">
                No activity yet. Check-ins, logged sessions and messages from your clients will appear here.
              </div>
            ) : (
              recent.map((n) => {
                const Icon = ICONS[n.kind];
                return (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 border-b border-ink-100 px-4 py-3 transition last:border-0 hover:bg-ink-50"
                  >
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", TINTS[n.kind])}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-ink-800">{n.title}</div>
                      <div className="text-xs text-ink-400">{n.sub}</div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - +new Date(iso);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
