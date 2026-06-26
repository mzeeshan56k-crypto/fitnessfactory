"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock, X, CalendarCheck, Plus, ChevronLeft, ChevronRight, UserPlus,
} from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import type { Appointment } from "@/lib/data";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 07:00..19:00

type EventType = Appointment["type"];

const TYPE_STYLES: Record<EventType, { label: string; dot: string; chip: string }> = {
  session: { label: "Session", dot: "bg-brand-500", chip: "border-brand-200 bg-brand-500/15 text-brand-700" },
  "check-in": { label: "Check-in", dot: "bg-accent-500", chip: "border-accent-200 bg-accent-500/15 text-accent-700" },
  consult: { label: "Consult", dot: "bg-amber-500", chip: "border-amber-200 bg-amber-500/15 text-amber-700" },
  class: { label: "Class", dot: "bg-purple-500", chip: "border-purple-200 bg-purple-500/15 text-purple-700" },
};
const TYPE_OPTIONS: EventType[] = ["session", "check-in", "consult", "class"];

function hourOf(time: string) {
  return parseInt(time.slice(0, 2), 10);
}

export default function ClientSchedulePage() {
  const app = useApp();
  const client = useCurrentClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    day: 0,
    start: "09:00",
    end: "10:00",
    type: "session" as EventType,
  });

  if (!app.hydrated)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );

  if (!client)
    return (
      <EmptyState
        icon={UserPlus}
        title="No client selected"
        description="Add a client in the Trainer portal, then preview their experience here."
        action={<Link href="/dashboard/clients" className="btn-primary">Go to Clients</Link>}
      />
    );

  // Only this member's appointments (the workspace already scopes these for members).
  const mine = app.appointments
    .filter((a) => a.clientId === client.id)
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));

  function submit() {
    if (!form.title.trim()) return;
    app.addAppointment({
      title: form.title.trim(),
      clientId: client!.id,
      day: form.day,
      start: form.start,
      end: form.end,
      type: form.type,
      requestedByClient: true,
    });
    setForm({ title: "", day: 0, start: "09:00", end: "10:00", type: "session" });
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <p className="text-sm text-brand-100">Plan your week</p>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="mt-1 text-sm text-brand-100">
          Sessions your coach books appear here — and you can request your own.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
        >
          <Plus className="h-4 w-4" /> Request a session
        </button>
      </section>

      {/* Weekly grid */}
      <section className="card p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <button className="btn-ghost h-8 w-8 !px-0" aria-label="Previous week"><ChevronLeft className="h-4 w-4" /></button>
            This week
            <button className="btn-ghost h-8 w-8 !px-0" aria-label="Next week"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500">
            {(Object.keys(TYPE_STYLES) as EventType[]).map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", TYPE_STYLES[t].dot)} />
                {TYPE_STYLES[t].label}
              </span>
            ))}
          </div>
        </div>

        {mine.length === 0 && (
          <p className="mb-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-3 text-center text-xs text-ink-400">
            Nothing scheduled yet — request a session or wait for your coach to book one.
          </p>
        )}

        {/* Desktop grid */}
        <div className="hidden overflow-x-auto scroll-thin md:block">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-ink-100">
              <div />
              {DAYS.map((d) => (
                <div key={d} className="px-1 pb-2 text-center text-xs font-medium text-ink-500">{d}</div>
              ))}
            </div>
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-ink-50">
                <div className="py-3 pr-1 text-right text-[10px] font-medium text-ink-400">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {DAYS.map((_, dayIdx) => {
                  const cell = mine.filter((a) => a.day === dayIdx && hourOf(a.start) === hour);
                  return (
                    <div key={dayIdx} className="min-h-[52px] space-y-1 border-l border-ink-50 p-1">
                      {cell.map((a) => (
                        <div key={a.id} className={cn("group relative rounded-lg border p-1.5 text-left", TYPE_STYLES[a.type].chip)}>
                          <div className="truncate text-[11px] font-semibold leading-tight">{a.title}</div>
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] opacity-80">
                            <Clock className="h-2.5 w-2.5" />{a.start}–{a.end}
                          </div>
                          {a.requestedByClient && (
                            <button
                              type="button"
                              onClick={() => app.removeAppointment(a.id)}
                              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink-100 text-ink-400 opacity-0 shadow ring-1 ring-ink-100 transition hover:text-rose-400 group-hover:opacity-100"
                              aria-label="Cancel request"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile agenda */}
        <div className="space-y-4 md:hidden">
          {DAYS.map((d, dayIdx) => {
            const dayAppts = mine.filter((a) => a.day === dayIdx);
            if (dayAppts.length === 0) return null;
            return (
              <div key={d}>
                <div className="mb-2 text-sm font-semibold text-ink-900">{DAY_OPTIONS[dayIdx]}</div>
                <div className="space-y-2">
                  {dayAppts.map((a) => (
                    <div key={a.id} className={cn("flex items-center gap-3 rounded-xl border p-3", TYPE_STYLES[a.type].chip)}>
                      <span className={cn("h-8 w-1 rounded-full", TYPE_STYLES[a.type].dot)} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{a.title}</div>
                        <div className="text-xs opacity-80">{a.start}–{a.end}</div>
                      </div>
                      {a.requestedByClient && (
                        <button onClick={() => app.removeAppointment(a.id)} className="rounded-full p-1.5 text-ink-400 hover:text-rose-400" aria-label="Cancel">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Upcoming list */}
      <section className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
            <CalendarCheck className="h-4 w-4" />
          </span>
          <h2 className="font-semibold text-ink-900">Upcoming</h2>
        </div>
        {mine.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 p-4 text-center text-sm text-ink-400">
            No sessions yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {mine.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                <span className={cn("h-9 w-1 rounded-full", TYPE_STYLES[a.type].dot)} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ink-900">{a.title}</div>
                  <div className="text-xs text-ink-500">
                    {DAYS[a.day]} · {a.start}–{a.end}
                    {a.requestedByClient && <span className="ml-2 text-brand-400">· requested by you</span>}
                  </div>
                </div>
                {a.requestedByClient && (
                  <button
                    onClick={() => app.removeAppointment(a.id)}
                    className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/15"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Request session modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request a session"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" disabled={!form.title.trim()} onClick={submit}>Send request</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="What for?">
            <input
              autoFocus
              className="input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. 1:1 strength session"
            />
          </Field>
          <Field label="Day">
            <select className="input" value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: Number(e.target.value) }))}>
              {DAY_OPTIONS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start">
              <input type="time" className="input" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} />
            </Field>
            <Field label="End">
              <input type="time" className="input" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} />
            </Field>
          </div>
          <Field label="Type">
            <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EventType }))}>
              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{TYPE_STYLES[t].label}</option>)}
            </select>
          </Field>
          <p className="text-xs text-ink-400">
            Your coach sees this request on their calendar right away.
          </p>
        </div>
      </Modal>
    </div>
  );
}
