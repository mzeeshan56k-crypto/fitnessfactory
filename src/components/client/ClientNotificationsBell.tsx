"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell, FileText, Dumbbell, Apple, MessageSquare, CalendarCheck,
} from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { cn } from "@/lib/utils";

type Item = { id: string; icon: React.ComponentType<{ className?: string }>; tint: string; title: string; sub: string; href: string; action?: boolean };

export function ClientNotificationsBell() {
  const app = useApp();
  const client = useCurrentClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!client) return null;

  const plan = app.clientPlans[client.id] ?? { workoutIds: [] };
  const assignedForms = (plan.formIds ?? [])
    .map((id) => app.forms.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));
  const formsToDo = assignedForms.filter(
    (f) => !app.checkins.some((ci) => ci.clientId === client.id && ci.formId === f.id),
  );
  const assignedWorkouts = (plan.workoutIds ?? []).length;
  const mealPlan = app.mealPlans.find((m) => m.id === plan.mealPlanId);
  const conv = app.conversations.find((c) => c.clientId === client.id);
  const lastCoach = conv?.messages.filter((m) => !m.fromClient).slice(-1)[0];
  const nextAppt = app.appointments.find((a) => a.clientId === client.id);

  const items: Item[] = [];
  for (const f of formsToDo) {
    items.push({ id: "form_" + f.id, icon: FileText, tint: "bg-brand-500/15 text-brand-400", title: `Form to complete: ${f.name}`, sub: `${f.fields.length} questions`, href: "/client/forms", action: true });
  }
  if (lastCoach) {
    items.push({ id: "msg", icon: MessageSquare, tint: "bg-sky-500/15 text-sky-400", title: "Message from your coach", sub: lastCoach.text.slice(0, 48), href: "/client/messages" });
  }
  if (assignedWorkouts > 0) {
    items.push({ id: "wk", icon: Dumbbell, tint: "bg-accent-500/15 text-accent-400", title: `${assignedWorkouts} workout${assignedWorkouts === 1 ? "" : "s"} assigned`, sub: "Tap to start training", href: "/client/workouts" });
  }
  if (mealPlan) {
    items.push({ id: "meal", icon: Apple, tint: "bg-amber-500/15 text-amber-400", title: `Meal plan: ${mealPlan.name}`, sub: `${mealPlan.calories.toLocaleString()} kcal/day`, href: "/client/nutrition" });
  }
  if (nextAppt) {
    items.push({ id: "appt", icon: CalendarCheck, tint: "bg-violet-500/15 text-violet-400", title: nextAppt.title, sub: `${nextAppt.start} – ${nextAppt.end}`, href: "/client/schedule" });
  }

  const badge = formsToDo.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-600 hover:bg-ink-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {badge > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-ink-100">
            {badge}
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
              items.map((n) => (
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
                  {n.action && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
