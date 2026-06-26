"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock, X, CalendarCheck, Plus, ChevronLeft, ChevronRight, UserPlus, Check,
} from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import type { Appointment } from "@/lib/data";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i);

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
function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function weekStart(base: Date, offset: number) {
  const d = new Date(base);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function ClientSchedulePage() {
  const app = useApp();
  const client = useCurrentClient();
  const [open, setOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const todayISO = toISO(new Date());
  const start = weekStart(new Date(), weekOffset);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const weekISO = weekDates.map(toISO);

  const [form, setForm] = useState({
    title: "",
    date: todayISO,
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

  const apptDate = (a: Appointment) => a.date ?? weekISO[a.day] ?? weekISO[0];

  // This member's own appointments + open slots the coach published.
  const mine = app.appointments.filter((a) => a.clientId === client.id);
  const openSlots = app.appointments
    .filter((a) => !a.clientId)
    .sort((a, b) => apptDate(a).localeCompare(apptDate(b)) || a.start.localeCompare(b.start));

  function submit() {
    if (!form.title.trim()) return;
    const dayIdx = weekISO.indexOf(form.date);
    app.addAppointment({
      title: form.title.trim(),
      clientId: client!.id,
      date: form.date,
      day: dayIdx >= 0 ? dayIdx : 0,
      start: form.start,
      end: form.end,
      type: form.type,
      requestedByClient: true,
    });
    setForm({ title: "", date: todayISO, start: "09:00", end: "10:00", type: "session" });
    setOpen(false);
  }

  const rangeLabel = `${weekDates[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

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
            <button onClick={() => setWeekOffset((w) => w - 1)} className="btn-ghost h-8 w-8 !px-0" aria-label="Previous week"><ChevronLeft className="h-4 w-4" /></button>
            {weekOffset === 0 ? "This week" : weekOffset === 1 ? "Next week" : weekOffset === -1 ? "Last week" : `Week ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
            <span className="font-normal text-ink-500">{rangeLabel}</span>
            <button onClick={() => setWeekOffset((w) => w + 1)} className="btn-ghost h-8 w-8 !px-0" aria-label="Next week"><ChevronRight className="h-4 w-4" /></button>
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

        {mine.filter((a) => weekISO.includes(apptDate(a))).length === 0 && (
          <p className="mb-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-3 text-center text-xs text-ink-400">
            Nothing scheduled this week — request a session or book an open slot below.
          </p>
        )}

        {/* Desktop grid */}
        <div className="hidden overflow-x-auto scroll-thin md:block">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-ink-100">
              <div />
              {DAYS.map((d, i) => {
                const isToday = weekISO[i] === todayISO;
                return (
                  <div key={d} className={cn("px-1 pb-2 text-center", isToday && "rounded-t-lg bg-brand-500/15")}>
                    <div className="text-xs font-medium text-ink-500">{d}</div>
                    <div className={cn("mx-auto mt-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold", isToday ? "bg-brand-600 text-white" : "text-ink-900")}>
                      {weekDates[i].getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-ink-50">
                <div className="py-3 pr-1 text-right text-[10px] font-medium text-ink-400">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {weekISO.map((iso, dayIdx) => {
                  const cell = mine.filter((a) => apptDate(a) === iso && hourOf(a.start) === hour);
                  return (
                    <div key={dayIdx} className={cn("min-h-[52px] space-y-1 border-l border-ink-50 p-1", iso === todayISO && "bg-brand-50/40")}>
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
                              aria-label="Cancel"
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
          {weekISO.map((iso, dayIdx) => {
            const dayAppts = mine.filter((a) => apptDate(a) === iso);
            if (dayAppts.length === 0) return null;
            return (
              <div key={iso}>
                <div className="mb-2 text-sm font-semibold text-ink-900">
                  {weekDates[dayIdx].toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </div>
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

      {/* Open slots published by the coach */}
      <section className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
            <CalendarCheck className="h-4 w-4" />
          </span>
          <h2 className="font-semibold text-ink-900">Available sessions</h2>
        </div>
        {openSlots.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 p-4 text-center text-sm text-ink-400">
            No open slots right now. Your coach will publish availability here, or request a session above.
          </p>
        ) : (
          <div className="space-y-2.5">
            {openSlots.map((s) => {
              const d = new Date(apptDate(s) + "T00:00:00");
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg", TYPE_STYLES[s.type].chip)}>
                    <CalendarCheck className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ink-900">{s.title}</div>
                    <div className="flex items-center gap-1 text-xs text-ink-500">
                      <Clock className="h-3 w-3" />
                      {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {s.start}–{s.end}
                    </div>
                  </div>
                  <button onClick={() => app.bookAppointment(s.id)} className="btn-primary px-4 py-2 text-sm">
                    Book
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Upcoming list */}
      <section className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
            <Check className="h-4 w-4" />
          </span>
          <h2 className="font-semibold text-ink-900">My upcoming</h2>
        </div>
        {mine.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 p-4 text-center text-sm text-ink-400">
            No sessions yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {[...mine].sort((a, b) => apptDate(a).localeCompare(apptDate(b)) || a.start.localeCompare(b.start)).map((a) => {
              const d = new Date(apptDate(a) + "T00:00:00");
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                  <span className={cn("h-9 w-1 rounded-full", TYPE_STYLES[a.type].dot)} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ink-900">{a.title}</div>
                    <div className="text-xs text-ink-500">
                      {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {a.start}–{a.end}
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
              );
            })}
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
            <input autoFocus className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. 1:1 strength session" />
          </Field>
          <Field label="Date">
            <input type="date" className="input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
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
          <p className="text-xs text-ink-400">Your coach sees this request on their calendar right away.</p>
        </div>
      </Modal>
    </div>
  );
}
