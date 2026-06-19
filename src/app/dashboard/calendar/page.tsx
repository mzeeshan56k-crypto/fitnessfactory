"use client";

import { useState } from "react";
import {
  Plus, ChevronLeft, ChevronRight, Clock, X, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, Field } from "@/components/ui/Modal";
import { useApp } from "@/lib/store";
import type { Appointment } from "@/lib/data";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_OPTIONS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];
// Fabricated current week (Mon 15 Jun 2026 .. Sun 21 Jun 2026)
const DATES = [15, 16, 17, 18, 19, 20, 21];
const TODAY_INDEX = 2; // Wednesday 17th highlighted

// 07:00 .. 19:00 inclusive
const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i);

type EventType = Appointment["type"];

const TYPE_STYLES: Record<
  EventType,
  { label: string; dot: string; chip: string }
> = {
  session: {
    label: "Session",
    dot: "bg-brand-500",
    chip: "border-brand-200 bg-brand-500/15 text-brand-800",
  },
  "check-in": {
    label: "Check-in",
    dot: "bg-accent-500",
    chip: "border-accent-200 bg-accent-500/15 text-accent-800",
  },
  consult: {
    label: "Consult",
    dot: "bg-amber-500",
    chip: "border-amber-200 bg-amber-500/15 text-amber-800",
  },
  class: {
    label: "Class",
    dot: "bg-purple-500",
    chip: "border-purple-200 bg-purple-500/15 text-purple-800",
  },
};

const TYPE_OPTIONS: EventType[] = ["session", "check-in", "consult", "class"];

function hourOf(time: string) {
  return parseInt(time.slice(0, 2), 10);
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
  const [weekOffset, setWeekOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    clientId: "",
    day: 0,
    start: "09:00",
    end: "10:00",
    type: "session" as EventType,
  });

  if (!app.hydrated) return <Loading />;

  const appointments = app.appointments;

  function EventChip({ appt }: { appt: Appointment }) {
    const client = appt.clientId ? app.clients.find((c) => c.id === appt.clientId) : undefined;
    const style = TYPE_STYLES[appt.type];
    return (
      <div
        className={cn(
          "group/chip relative flex items-start gap-2 rounded-lg border p-2 text-left shadow-sm transition hover:shadow-md",
          style.chip,
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold leading-tight">
            {appt.title}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] opacity-80">
            <Clock className="h-3 w-3" />
            {appt.start}–{appt.end}
          </div>
        </div>
        {client && <Avatar initials={client.avatar} size="sm" className="ring-1" />}
        <button
          type="button"
          onClick={() => app.removeAppointment(appt.id)}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-100 text-ink-400 shadow-soft ring-1 ring-ink-100 opacity-0 transition hover:text-rose-400 group-hover/chip:opacity-100"
          aria-label="Delete event"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Sort upcoming by day then start time
  const upcoming = [...appointments].sort(
    (a, b) => a.day - b.day || a.start.localeCompare(b.start),
  );

  function resetForm() {
    setForm({
      title: "",
      clientId: "",
      day: 0,
      start: "09:00",
      end: "10:00",
      type: "session",
    });
  }

  function submit() {
    if (!form.title.trim()) return;
    app.addAppointment({
      title: form.title.trim(),
      clientId: form.clientId || "",
      day: form.day,
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
        subtitle="Manage sessions, classes and check-ins"
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New event
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendar */}
        <div className="card p-4 sm:p-6 lg:col-span-3">
          {/* Week nav + legend */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="btn-ghost h-9 w-9 !px-0"
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-ink-900">
                {weekOffset === 0 ? "This week" : `Week ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
                <span className="ml-2 font-normal text-ink-500">Jun 15 – 21, 2026</span>
              </span>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="btn-ghost h-9 w-9 !px-0"
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
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

          {appointments.length === 0 && (
            <p className="mb-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-3 text-center text-xs text-ink-400">
              No events scheduled — add one
            </p>
          )}

          {/* Desktop / tablet grid */}
          <div className="hidden md:block">
            <div className="overflow-x-auto scroll-thin">
              <div className="min-w-[720px]">
                {/* Day header */}
                <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-ink-100">
                  <div />
                  {DAYS.map((d, i) => (
                    <div
                      key={d}
                      className={cn(
                        "px-2 pb-2 text-center",
                        i === TODAY_INDEX && "rounded-t-lg bg-brand-500/15",
                      )}
                    >
                      <div className="text-xs font-medium text-ink-500">{d}</div>
                      <div
                        className={cn(
                          "mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                          i === TODAY_INDEX
                            ? "bg-brand-600 text-white"
                            : "text-ink-900",
                        )}
                      >
                        {DATES[i]}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hour rows */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-ink-50"
                  >
                    <div className="py-3 pr-2 text-right text-[11px] font-medium text-ink-400">
                      {String(hour).padStart(2, "0")}:00
                    </div>
                    {DAYS.map((_, dayIdx) => {
                      const cellAppts = appointments.filter(
                        (a) => a.day === dayIdx && hourOf(a.start) === hour,
                      );
                      return (
                        <div
                          key={dayIdx}
                          className={cn(
                            "min-h-[56px] space-y-1 border-l border-ink-50 p-1",
                            dayIdx === TODAY_INDEX && "bg-brand-50/40",
                          )}
                        >
                          {cellAppts.map((a) => (
                            <EventChip key={a.id} appt={a} />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: day-agenda list */}
          <div className="space-y-5 md:hidden">
            {DAYS.map((d, dayIdx) => {
              const dayAppts = appointments
                .filter((a) => a.day === dayIdx)
                .sort((a, b) => a.start.localeCompare(b.start));
              if (dayAppts.length === 0) return null;
              return (
                <div key={d}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink-900">{d}</span>
                    <span className="text-xs text-ink-400">Jun {DATES[dayIdx]}</span>
                  </div>
                  <div className="space-y-2">
                    {dayAppts.map((a) => (
                      <EventChip key={a.id} appt={a} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming mini-list */}
        <div className="card h-fit p-6">
          <h2 className="font-semibold text-ink-900">Upcoming</h2>
          <p className="mt-1 text-sm text-ink-500">Next on your schedule</p>
          <div className="mt-4 space-y-2">
            {upcoming.length === 0 && (
              <p className="text-sm text-ink-400">Nothing scheduled yet.</p>
            )}
            {upcoming.map((a) => {
              const client = a.clientId ? app.clients.find((c) => c.id === a.clientId) : undefined;
              const style = TYPE_STYLES[a.type];
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-ink-100 p-3"
                >
                  <span className={cn("h-9 w-1 rounded-full", style.dot)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink-900">
                      {a.title}
                    </div>
                    <div className="text-xs text-ink-500">
                      {DAYS[a.day]} · {a.start}–{a.end}
                    </div>
                  </div>
                  {client && <Avatar initials={client.avatar} size="sm" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="New event"
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Cancel
            </button>
            <button className="btn-primary" disabled={!form.title.trim()} onClick={submit}>
              Add event
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <input
              autoFocus
              className="input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. 1:1 strength session"
            />
          </Field>

          <Field label="Client (optional)">
            <select
              className="input"
              value={form.clientId}
              onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
            >
              <option value="">No client</option>
              {app.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Day">
            <select
              className="input"
              value={form.day}
              onChange={(e) => setForm((f) => ({ ...f, day: Number(e.target.value) }))}
            >
              {DAY_OPTIONS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start">
              <input
                type="time"
                className="input"
                value={form.start}
                onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
              />
            </Field>
            <Field label="End">
              <input
                type="time"
                className="input"
                value={form.end}
                onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Type">
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EventType }))}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {TYPE_STYLES[t].label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>
    </>
  );
}
