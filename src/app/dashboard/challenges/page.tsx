"use client";

import { useState } from "react";
import { Trophy, Plus, Users, Clock, Trash2, Loader2, CalendarCheck, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const metrics = ["Workouts", "Steps", "Nutrition", "Weight loss", "Habits"];
const colors = [
  { label: "Brand", value: "from-brand-500 to-brand-700" },
  { label: "Accent", value: "from-accent-500 to-emerald-600" },
  { label: "Violet", value: "from-violet-500 to-indigo-600" },
  { label: "Amber", value: "from-amber-500 to-orange-500" },
];

export default function DashboardChallengesPage() {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [metric, setMetric] = useState(metrics[0]);
  const [days, setDays] = useState("30");
  const [color, setColor] = useState(colors[0].value);

  function create() {
    if (!name.trim()) return;
    app.addChallenge({
      name: name.trim(),
      desc: desc.trim() || "Compete and stay accountable.",
      metric,
      daysLeft: Number(days) || 30,
      color,
      participants: 0,
      joined: false,
    });
    setName(""); setDesc(""); setMetric(metrics[0]); setDays("30"); setColor(colors[0].value);
    setOpen(false);
  }

  if (!app.hydrated) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Challenges"
        subtitle="Create challenges your clients can join from their app"
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New challenge
          </button>
        }
      />

      {app.challenges.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No challenges yet"
          description="Create a challenge and it instantly appears in every client's Challenges tab to join."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Create challenge</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {app.challenges.map((c) => (
            <div key={c.id} className="card overflow-hidden">
              <div className={`bg-gradient-to-br ${c.color} p-4 text-white`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold leading-tight">{c.name}</h3>
                  <button
                    onClick={() => app.removeChallenge(c.id)}
                    aria-label={`Delete ${c.name}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/90 transition hover:bg-white/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <span className="badge mt-2 bg-white/20 text-white">{c.metric}</span>
              </div>
              <div className="p-4">
                <p className="text-sm text-ink-600">{c.desc}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.daysLeft} days left</span>
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {(c.joinedBy?.length ?? c.participants).toLocaleString()} joined</span>
                </div>
                {/* Client daily marks */}
                {c.dailyMarks && Object.keys(c.dailyMarks).length > 0 && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:text-brand-600"
                    >
                      <CalendarCheck className="h-3.5 w-3.5" />
                      Client progress
                      {expanded === c.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {expanded === c.id && (
                      <div className="mt-2 space-y-1.5 rounded-xl border border-ink-200 bg-ink-50/40 p-3">
                        {Object.entries(c.dailyMarks).map(([clientId, dates]) => {
                          const cl = app.clients.find((x) => x.id === clientId);
                          if (!cl || dates.length === 0) return null;
                          return (
                            <div key={clientId} className="flex items-center justify-between text-xs">
                              <span className="font-medium text-ink-800">{cl.name}</span>
                              <span className={cn("badge", "bg-accent-500/15 text-accent-500")}>
                                {dates.length} day{dates.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New challenge"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={create} disabled={!name.trim()}>Create challenge</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="30-Day Step Challenge" autoFocus />
          </Field>
          <Field label="Description">
            <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Hit 10,000 steps every day" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Metric">
              <select className="input" value={metric} onChange={(e) => setMetric(e.target.value)}>
                {metrics.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Days">
              <input type="number" className="input" value={days} onChange={(e) => setDays(e.target.value)} />
            </Field>
          </div>
          <div>
            <span className="label">Color</span>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-9 w-9 rounded-lg bg-gradient-to-br ${c.value} ${color === c.value ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-ink-100" : ""}`}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
