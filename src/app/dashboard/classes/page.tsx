"use client";

import { useState } from "react";
import { Video, Plus, Clock, Trash2, Loader2, CalendarDays, Play, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const categories = ["Cardio", "Strength", "Mobility", "Core", "HIIT", "Yoga", "General"];

export default function DashboardClassesPage() {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "Cardio",
    durationMin: "30",
    type: "live" as "live" | "recorded",
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    videoUrl: "",
  });

  if (!app.hydrated) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  function create() {
    if (!form.title.trim()) return;
    app.addClass({
      title: form.title.trim(),
      category: form.category,
      durationMin: Number(form.durationMin) || 30,
      type: form.type,
      date: form.type === "live" ? new Date(form.date).toISOString() : undefined,
      videoUrl: form.type === "recorded" ? form.videoUrl.trim() || undefined : undefined,
    });
    setForm({ title: "", category: "Cardio", durationMin: "30", type: "live", date: new Date(Date.now() + 86400000).toISOString().slice(0, 16), videoUrl: "" });
    setOpen(false);
  }

  const live = app.classes.filter((c) => c.type === "live");
  const recorded = app.classes.filter((c) => c.type === "recorded");

  return (
    <>
      <PageHeader
        title="Classes"
        subtitle="Publish live and on-demand classes — clients see only what you add here"
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New class
          </button>
        }
      />

      {app.classes.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No classes yet"
          description="Add a live class or upload a recorded session — it instantly appears in every client's Classes tab."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Create class</button>}
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-semibold text-ink-900">Live classes</h2>
            {live.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-4 text-center text-sm text-ink-400">No live classes scheduled.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {live.map((c) => (
                  <div key={c.id} className="card p-5">
                    <div className="flex items-start justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                        <Video className="h-5 w-5" />
                      </span>
                      <button onClick={() => app.removeClass(c.id)} aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-rose-500/15 hover:text-rose-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <h3 className="mt-3 font-semibold text-ink-900">{c.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                      {c.date && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(c.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {c.durationMin} min</span>
                      <span className="badge bg-ink-100 text-ink-600">{c.category}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
                      <Users className="h-3.5 w-3.5" /> {(c.enrolledBy?.length ?? 0)} booked
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-semibold text-ink-900">On-demand / recorded</h2>
            {recorded.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-4 text-center text-sm text-ink-400">No recorded classes yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recorded.map((c) => (
                  <div key={c.id} className="card overflow-hidden">
                    <div className="flex h-24 items-center justify-center bg-gradient-to-br from-brand-500/20 to-ink-100">
                      <Play className="h-10 w-10 text-brand-400 opacity-60" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-ink-900">{c.title}</h3>
                        <button onClick={() => app.removeClass(c.id)} aria-label="Delete" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-rose-500/15 hover:text-rose-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-ink-500">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {c.durationMin} min</span>
                        <span className="badge bg-ink-100 text-ink-600">{c.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New class"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={create} disabled={!form.title.trim()}>Create class</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["live", "recorded"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={cn("flex-1 rounded-xl border px-3 py-2 text-sm font-medium capitalize transition", form.type === t ? "border-brand-300 bg-brand-500/10 text-brand-500" : "border-ink-200 text-ink-500")}
              >
                {t === "live" ? "Live class" : "Recorded"}
              </button>
            ))}
          </div>
          <Field label="Title">
            <input autoFocus className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Full Body HIIT" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Duration (min)">
              <input type="number" className="input" value={form.durationMin} onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))} />
            </Field>
          </div>
          {form.type === "live" ? (
            <Field label="Date & time">
              <input type="datetime-local" className="input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
          ) : (
            <Field label="Video link (YouTube, Vimeo, mp4…)">
              <input className="input" value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} placeholder="https://…" />
            </Field>
          )}
        </div>
      </Modal>
    </>
  );
}
