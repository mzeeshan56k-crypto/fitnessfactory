"use client";

import { Calendar, Clock, Check, CalendarCheck, X, Apple } from "lucide-react";
import { useLocalState } from "@/lib/useLocalState";
import { bookingSlots } from "@/lib/platform";

export default function SchedulePage() {
  const [sync, setSync, syncHydrated] = useLocalState<{ google: boolean; apple: boolean }>(
    "ffkc-cal-sync",
    { google: false, apple: false }
  );
  const [booked, setBooked, bookedHydrated] = useLocalState<string[]>("ffkc-bookings", []);

  const hydrated = syncHydrated && bookedHydrated;

  const book = (id: string) => setBooked((b) => (b.includes(id) ? b : [...b, id]));
  const cancel = (id: string) => setBooked((b) => b.filter((x) => x !== id));

  const upcoming = bookingSlots.filter((s) => booked.includes(s.id));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <p className="text-sm text-brand-100">Plan your week</p>
        <h1 className="text-2xl font-bold">Scheduling &amp; Booking</h1>
        <p className="mt-1 text-sm text-brand-100">
          Sync your calendars and lock in sessions with your coach.
        </p>
      </section>

      {/* Sync calendars */}
      <section className="card p-5">
        <h2 className="mb-1 font-semibold text-ink-900">Sync calendars</h2>
        <p className="mb-4 text-sm text-ink-500">Two-way sync so bookings land on your phone automatically.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => setSync((s) => ({ ...s, google: !s.google }))}
            className={sync.google ? "btn-accent" : "btn-secondary"}
          >
            {sync.google ? <Check className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
            {sync.google ? "Google Calendar connected" : "Connect Google Calendar"}
          </button>
          <button
            onClick={() => setSync((s) => ({ ...s, apple: !s.apple }))}
            className={sync.apple ? "btn-accent" : "btn-secondary"}
          >
            {sync.apple ? <Check className="h-4 w-4" /> : <Apple className="h-4 w-4" />}
            {sync.apple ? "Apple Calendar connected" : "Connect Apple Calendar"}
          </button>
        </div>
      </section>

      {/* My upcoming bookings */}
      <section className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
            <CalendarCheck className="h-4 w-4" />
          </span>
          <h2 className="font-semibold text-ink-900">My upcoming bookings</h2>
        </div>
        {!hydrated ? null : upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 p-4 text-center text-sm text-ink-400">
            No sessions booked yet. Grab one below.
          </p>
        ) : (
          <div className="space-y-2.5">
            {upcoming.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-accent-100 bg-accent-50/40 p-3"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/20 text-accent-400">
                  <Check className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ink-900">{s.type}</div>
                  <div className="text-xs text-ink-500">
                    {s.day} · {s.time}
                  </div>
                </div>
                <button
                  onClick={() => cancel(s.id)}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/15"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Available sessions */}
      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-ink-900">Available sessions</h2>
        <div className="space-y-2.5">
          {bookingSlots.map((s) => {
            const isBooked = booked.includes(s.id);
            const available = s.open && !isBooked;
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-ink-100 p-3"
              >
                <span className="flex h-11 w-11 flex-col items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ink-900">{s.type}</div>
                  <div className="flex items-center gap-1 text-xs text-ink-500">
                    <Clock className="h-3 w-3" /> {s.day} · {s.time}
                  </div>
                </div>
                {isBooked ? (
                  <span className="badge bg-accent-500/15 text-accent-400">
                    <Check className="h-3.5 w-3.5" /> Booked
                  </span>
                ) : available ? (
                  <button onClick={() => book(s.id)} className="btn-primary px-4 py-2 text-sm">
                    Book
                  </button>
                ) : (
                  <button disabled className="btn-secondary px-4 py-2 text-sm">
                    Booked
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
