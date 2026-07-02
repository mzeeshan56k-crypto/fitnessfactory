"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Modal, Field } from "@/components/ui/Modal";
import { FullCalendar, type CalendarItem, type CalendarKind } from "@/components/ui/FullCalendar";
import { useApp } from "@/lib/store";
import type { Appointment } from "@/lib/data";
import { cn } from "@/lib/utils";

type EventType = Appointment["type"];

const KINDS: Record<string, CalendarKind> = {
  session: { label: "1 on 1 Session", dot: "bg-brand-500", chip: "border-brand-200 bg-brand-500/15 text-brand-800" },
  "check-in": { label: "Check-in", dot: "bg-accent-500", chip: "border-accent-200 bg-accent-500/15 text-accent-800" },
  consult: { label: "Consult", dot: "bg-amber-500", chip: "border-amber-200 bg-amber-500/15 text-amber-800" },
  class: { label: "Group / Class", dot: "bg-purple-500", chip: "border-purple-200 bg-purple-500/15 text-purple-800" },
  formcheck: { label: "Form Analysis", dot: "bg-violet-500", chip: "border-violet-200 bg-violet-500/15 text-violet-800" },
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

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export default function CalendarPage() {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const todayISO = toISO(new Date());

  const [form, setForm] = useState({
    title: "",
    clientId: "",
    date: todayISO,
    start: "09:00",
    end: "10:00",
    type: "session" as EventType,
  });

  if (!app.hydrated) return <Loading />;

  const weekISO = currentWeekISO();
  const apptDate = (a: Appointment) => a.date ?? weekISO[a.day] ?? weekISO[0];

  // Appointments → calendar items.
  const items: CalendarItem[] = app.appointments.map((a) => {
    const client = a.clientId ? app.clients.find((c) => c.id === a.clientId) : undefined;
    return {
      id: "appt_" + a.id,
      date: apptDate(a),
      start: a.start,
      end: a.end,
      title: a.title,
      sub: client?.name,
      kind: a.type,
      badge: a.requestedByClient ? "Client request" : !a.clientId ? "Open slot" : undefined,
      onRemove: () => app.removeAppointment(a.id),
    };
  });

  // Form-check tasks → all-day calendar items, so form analysis lives on the
  // calendar just like sessions (Trainerize-style).
  for (const c of app.clients) {
    for (const r of app.formCheckRequests[c.id] ?? []) {
      if (r.status === "pending") {
        items.push({
          id: "fc_" + r.id,
          date: r.requestedAt.slice(0, 10),
          title: `Form check: ${r.exercise}`,
          sub: `Waiting on ${c.name}`,
          kind: "formcheck",
          href: "/dashboard/form-check",
        });
      } else if (r.status === "submitted" && r.submittedAt) {
        items.push({
          id: "fc_" + r.id,
          date: r.submittedAt.slice(0, 10),
          title: `Form check: ${r.exercise}`,
          sub: `${c.name} — needs review`,
          kind: "formcheck",
          href: "/dashboard/form-check",
          badge: "New",
        });
      }
    }
  }

  // Upcoming = next 7 days.
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 7);
  const horizonISO = toISO(horizon);
  const upcoming = items
    .filter((i) => i.date >= todayISO && i.date <= horizonISO)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? "").localeCompare(b.start ?? ""));

  function resetForm() {
    setForm({ title: "", clientId: "", date: todayISO, start: "09:00", end: "10:00", type: "session" });
  }

  function submit() {
    if (!form.title.trim()) return;
    const dayIdx = weekISO.indexOf(form.date);
    app.addAppointment({
      title: form.title.trim(),
      clientId: form.clientId || "",
      date: form.date,
      day: dayIdx >= 0 ? dayIdx : 0,
      start: form.start,
      end: form.end,
      type: form.type,
    });
    resetForm();
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Sessions, classes, check-ins and form-analysis tasks in one place"
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New event
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="card p-4 sm:p-6 lg:col-span-3">
          <FullCalendar items={items} kinds={KINDS} initialView="weekly" />
        </div>

        {/* Upcoming mini-list */}
        <div className="card h-fit p-6">
          <h2 className="font-semibold text-ink-900">Upcoming</h2>
          <p className="mt-1 text-sm text-ink-500">Next 7 days</p>
          <div className="mt-4 space-y-2">
            {upcoming.length === 0 && <p className="text-sm text-ink-400">Nothing scheduled yet.</p>}
            {upcoming.slice(0, 12).map((i) => {
              const d = new Date(i.date + "T00:00:00");
              return (
                <div key={i.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                  <span className={cn("h-9 w-1 rounded-full", KINDS[i.kind]?.dot)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink-900">{i.title}</div>
                    <div className="text-xs text-ink-500">
                      {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      {i.start ? ` · ${i.start}${i.end ? `–${i.end}` : ""}` : " · all-day task"}
                      {i.sub ? ` · ${i.sub}` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => { setOpen(false); resetForm(); }}
        title="New event"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setOpen(false); resetForm(); }}>Cancel</button>
            <button className="btn-primary" disabled={!form.title.trim()} onClick={submit}>Add event</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <input autoFocus className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. 1:1 strength session" />
          </Field>
          <Field label="Client (leave empty for an open bookable slot)">
            <select className="input" value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}>
              <option value="">Open slot — any client can book</option>
              {app.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
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
              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{KINDS[t].label}</option>)}
            </select>
          </Field>
        </div>
      </Modal>
    </>
  );
}
