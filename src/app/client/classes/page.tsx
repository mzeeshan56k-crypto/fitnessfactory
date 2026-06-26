"use client";

import Link from "next/link";
import { Video, Clock, CalendarDays, UserPlus, Play, ExternalLink } from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { EmptyState } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff > 0 && diff < 86400000) return `Today ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diff >= 86400000 && diff < 2 * 86400000) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ClassesPage() {
  const app = useApp();
  const client = useCurrentClient();

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
        description="Add a client in the Trainer portal to preview their experience."
        action={<Link href="/dashboard/clients" className="btn-primary">Go to Clients</Link>}
      />
    );

  const upcoming = app.classes.filter((c) => c.type === "live");
  const recorded = app.classes.filter((c) => c.type === "recorded");
  const bookedCount = upcoming.filter((c) => (c.enrolledBy ?? []).includes(client.id)).length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <p className="text-sm text-brand-100">Join live or on-demand</p>
        <h1 className="text-2xl font-bold">Classes</h1>
        <p className="mt-1 text-sm text-brand-100">
          {bookedCount} upcoming booked · {recorded.length} recorded available
        </p>
      </section>

      {app.classes.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No classes yet"
          description="Your coach hasn't published any classes. Live sessions and recordings will show up here."
        />
      ) : (
        <>
          {/* Upcoming live */}
          <section>
            <h2 className="mb-3 text-base font-bold text-ink-900">Upcoming Live Classes</h2>
            {upcoming.length === 0 ? (
              <div className="card p-8 text-center text-sm text-ink-400">No upcoming classes scheduled.</div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((cls) => {
                  const enrolled = (cls.enrolledBy ?? []).includes(client.id);
                  return (
                    <div key={cls.id} className="card flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                        <Video className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink-900">{cls.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(cls.date)}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {cls.durationMin} min</span>
                          <span className="badge bg-ink-100 text-ink-600">{cls.category}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => app.toggleClassEnroll(cls.id)}
                        className={cn(
                          "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition",
                          enrolled
                            ? "bg-accent-500/15 text-accent-600 hover:bg-rose-500/15 hover:text-rose-400"
                            : "bg-brand-600 text-white hover:bg-brand-700",
                        )}
                      >
                        {enrolled ? "Booked ✓" : "Book"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recorded */}
          <section>
            <h2 className="mb-3 text-base font-bold text-ink-900">On-Demand / Recorded</h2>
            {recorded.length === 0 ? (
              <div className="card p-8 text-center text-sm text-ink-400">No recorded classes yet.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {recorded.map((cls) => (
                  <div key={cls.id} className="card overflow-hidden">
                    <div className="flex h-24 items-center justify-center bg-gradient-to-br from-brand-500/20 to-ink-100">
                      <Play className="h-10 w-10 text-brand-400 opacity-60" />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-ink-900">{cls.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-ink-500">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {cls.durationMin} min</span>
                        <span className="badge bg-ink-100 text-ink-600">{cls.category}</span>
                      </div>
                      {cls.videoUrl ? (
                        <a href={cls.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-3 w-full">
                          <Play className="h-4 w-4" /> Watch <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <button className="btn-secondary mt-3 w-full opacity-60" disabled>
                          <Play className="h-4 w-4" /> Coming soon
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
