"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell, FileText, Dumbbell, Apple, MessageSquare, CalendarCheck, Layers, Video,
} from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useLocalState } from "@/lib/useLocalState";

type Item = { id: string; icon: React.ComponentType<{ className?: string }>; tint: string; title: string; sub: string; href: string };

export function ClientNotificationsBell() {
  const app = useApp();
  const client = useCurrentClient();
  const [open, setOpen] = useState(false);
  // Track which notifications the client has already seen (by id), so assigning
  // a workout / meal / form / message all surface a fresh badge.
  const [seen, setSeen] = useLocalState<string[]>("ffkc-client-notif-seen", []);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  // Render the bell even before a client record resolves so it's always visible;
  // the notification list just stays empty until data loads.
  const plan = client ? app.clientPlans[client.id] ?? { workoutIds: [] } : { workoutIds: [] as string[] };
  const assignedForms = (plan.formIds ?? [])
    .map((id) => app.forms.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));
  const formsToDo = client
    ? assignedForms.filter(
        (f) => !app.checkins.some((ci) => ci.clientId === client.id && ci.formId === f.id),
      )
    : [];
  const assignedWorkoutIds = plan.workoutIds ?? [];
  const program = plan.programId ? app.programs.find((p) => p.id === plan.programId) : undefined;
  const mealPlan = app.mealPlans.find((m) => m.id === plan.mealPlanId);
  const conv = client ? app.conversations.find((c) => c.clientId === client.id) : undefined;
  const lastCoach = conv?.messages.filter((m) => !m.fromClient).slice(-1)[0];
  const nextAppt = client ? app.appointments.find((a) => a.clientId === client.id) : undefined;
  const liveClasses = client ? app.classes.filter((c) => c.type === "live") : [];

  const items: Item[] = [];
  // Assigned training program (shows the moment a coach assigns one).
  if (program) {
    items.push({ id: "prog_" + program.id, icon: Layers, tint: "bg-brand-500/15 text-brand-400", title: `Program assigned: ${program.name}`, sub: `${program.weeks} weeks · ${program.workoutsPerWeek}×/wk`, href: "/client/workouts" });
  }
  // Each assigned workout is its own notification so newly-assigned ones show up.
  for (const id of assignedWorkoutIds) {
    const w = app.workouts.find((x) => x.id === id);
    if (!w) continue;
    items.push({ id: "wk_" + w.id, icon: Dumbbell, tint: "bg-accent-500/15 text-accent-400", title: `Workout assigned: ${w.name}`, sub: `${w.exercises.length} exercises · tap to start`, href: "/client/workouts" });
  }
  for (const f of formsToDo) {
    items.push({ id: "form_" + f.id, icon: FileText, tint: "bg-brand-500/15 text-brand-400", title: `Form to complete: ${f.name}`, sub: `${f.fields.length} questions`, href: "/client/forms" });
  }
  if (mealPlan) {
    items.push({ id: "meal_" + mealPlan.id, icon: Apple, tint: "bg-amber-500/15 text-amber-400", title: `Meal plan assigned: ${mealPlan.name}`, sub: `${mealPlan.calories.toLocaleString()} kcal/day`, href: "/client/nutrition" });
  }
  if (lastCoach) {
    items.push({ id: "msg_" + (conv?.clientId ?? "") + "_" + lastCoach.text.slice(0, 12), icon: MessageSquare, tint: "bg-sky-500/15 text-sky-400", title: "Message from your coach", sub: lastCoach.text.slice(0, 48), href: "/client/messages" });
  }
  if (nextAppt) {
    items.push({ id: "appt_" + nextAppt.id, icon: CalendarCheck, tint: "bg-violet-500/15 text-violet-400", title: nextAppt.title, sub: `${nextAppt.start} – ${nextAppt.end}`, href: "/client/schedule" });
  }
  for (const cls of liveClasses) {
    items.push({ id: "cls_" + cls.id, icon: Video, tint: "bg-rose-500/15 text-rose-400", title: `Class: ${cls.title}`, sub: `${cls.durationMin} min · ${cls.category}`, href: "/client/classes" });
  }

  const seenSet = new Set(seen);
  const unread = items.filter((i) => !seenSet.has(i.id)).length;

  function toggle() {
    setOpen((o) => {
      const next = !o;
      // Opening the panel marks everything currently shown as seen.
      if (next) setSeen(items.map((i) => i.id));
      return next;
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-600 hover:bg-ink-200"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-ink-100">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-ink-200/70 bg-ink-100 shadow-2xl">
          <div className="border-b border-ink-200/60 px-4 py-3 font-semibold text-ink-900">From your coach</div>
          <div className="max-h-96 overflow-y-auto scroll-thin">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-ink-400">
                Nothing assigned yet. Your coach&apos;s workouts, forms and plans will show up here.
              </div>
            ) : (
              items.map((n) => {
                const isNew = !seenSet.has(n.id);
                return (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 border-b border-ink-100 px-4 py-3 transition last:border-0 hover:bg-ink-50"
                  >
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", n.tint)}>
                      <n.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink-800">{n.title}</div>
                      <div className="truncate text-xs text-ink-400">{n.sub}</div>
                    </div>
                    {isNew && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
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
