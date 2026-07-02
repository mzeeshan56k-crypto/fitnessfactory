"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock, X, CalendarCheck, Plus, UserPlus, Check,
} from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import type { Appointment } from "@/lib/data";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { FullCalendar, type CalendarItem, type CalendarKind } from "@/components/ui/FullCalendar";
import { cn } from "@/lib/utils";

type EventType = Appointment["type"];

const KINDS: Record<string, CalendarKind> = {
  session: { label: "1 on 1 Session", dot: "bg-brand-500", chip: "border-brand-200 bg-brand-500/15 text-brand-700" },
  "check-in": { label: "Check-in", dot: "bg-accent-500", chip: "border-accent-200 bg-accent-500/15 text-accent-700" },
  consult: { label: "Consult", dot: "bg-amber-500", chip: "border-amber-200 bg-amber-500/15 text-amber-700" },
  class: { label: "Group / Class", dot: "bg-purple-500", chip: "border-purple-200 bg-purple-500/15 text-purple-700" },
  formcheck: { label: "Form Analysis", dot: "bg-violet-500", chip: "border-violet-200 bg-violet-500/15 text-violet-700" },
};
const TYPE_OPTIONS: EventType[] = ["session", "check-in", "consult", "class"];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// Monday of the current real week — anchors legacy day-index appointments.
function currentWeekISO(): string[] {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return toISO(x);
  });
}

export default function ClientSchedulePage() {
  const app = useApp();
  const client = useCurrentClient();
  const [open, setOpen] = useState(false);
  const todayISO = toISO(new Date());

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

  const weekISO = currentWeekISO();
  const apptDate = (a: Appointment) => a.date ?? weekISO[a.day] ?? weekISO[0];

  // This member's own appointments + open slots the coach published.
  const mine = app.appointments.filter((a) => a.clientId === client.id);
  const openSlots = app.appointments
    .filter((a) => !a.clientId)
    .sort((a, b) => apptDate(a).localeCompare(apptDate(b)) || a.start.localeCompare(b.start));

  // Appointments → calendar items.
  const items: CalendarItem[] = mine.map((a) => ({
    id: "appt_" + a.id,
    date: apptDate(a),
    start: a.start,
    end: a.end,
    title: a.title,
    kind: a.type,
    badge: a.requestedByClient ? "Requested by you" : undefined,
    onRemove: a.requestedByClient ? () => app.removeAppointment(a.id) : undefined,
  }));

  // Form-analysis tasks live on the calendar too — a coach request shows the
  // day it was assigned, a submission shows the day it went in, and a review
  // shows the day the coach reviewed it. All link to the Form Check page.
  for (const r of app.formCheckRequests[client.id] ?? []) {
    if (r.status === "pending") {
      items.push({
        id: "fc_" + r.id,
        date: r.requestedAt.slice(0, 10),
        title: `Form check: ${r.exercise}`,
        sub: r.note || "Upload a clip for your coach",
        kind: "formcheck",
        href: "/client/form-check",
        badge: "To do",
      });
    } else if (r.status === "submitted" && r.submittedAt) {
      items.push({
        id: "fc_" + r.id,
        date: r.submittedAt.slice(0, 10),
        title: `Form check: ${r.exercise}`,
        sub: "Submitted — awaiting review",
        kind: "formcheck",
        href: "/client/form-check",
      });
    } else if (r.status === "reviewed") {
      items.push({
        id: "fc_" + r.id,
        date: (r.review?.date ?? r.submittedAt ?? r.requestedAt).slice(0, 10),
        title: `Form check: ${r.exercise}`,
        sub: "Reviewed by your coach — see feedback",
        kind: "formcheck",
        href: "/client/form-check",
        badge: "Reviewed",
      });
    }
  }

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

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <p className="text-sm text-brand-100">Plan your week</p>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="mt-1 text-sm text-brand-100">
          Sessions, classes and form-analysis tasks from your coach all land here — and you can request your own sessions.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
        >
          <Plus className="h-4 w-4" /> Request a session
        </button>
      </section>

      {/* Calendar: daily / weekly / monthly with event-type filters */}
      <section className="card p-4 sm:p-6">
        <FullCalendar items={items} kinds={KINDS} initialView="weekly" />
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
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg", KINDS[s.type]?.chip)}>
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
                  <span className={cn("h-9 w-1 rounded-full", KINDS[a.type]?.dot)} />
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
              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{KINDS[t]?.label}</option>)}
            </select>
          </Field>
          <p className="text-xs text-ink-400">Your coach sees this request on their calendar right away.</p>
        </div>
      </Modal>
    </div>
  );
}
