"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingDown, Target, Scale, Dumbbell, Plus, X, UserPlus, LineChart, Activity,
} from "lucide-react";
import { WeightChart } from "@/components/dashboard/Charts";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { PhotoCompare } from "@/components/PhotoCompare";
import { useApp, useCurrentClient } from "@/lib/store";
import { EmptyState } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

export default function ClientProgressPage() {
  const app = useApp();
  const c = useCurrentClient();

  const [entry, setEntry] = useState("");
  const [uploading, setUploading] = useState(false);

  if (!app.hydrated)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );

  if (!c)
    return (
      <EmptyState
        icon={UserPlus}
        title="No client selected"
        description="Add a client in the Trainer portal, then preview their experience here."
        action={<Link href="/dashboard/clients" className="btn-primary">Go to Clients</Link>}
      />
    );

  const weightLog = app.weightLogs[c.id] ?? [];
  const sessions = app.completions[c.id] ?? [];
  const photos = app.photos[c.id] ?? [];
  const lost = c.startWeight - c.currentWeight;
  const toGoal = Math.abs(c.currentWeight - c.goalWeight);

  // Build an ascending series for the weight chart from logged entries.
  const chartData = [...weightLog]
    .slice(0, 30)
    .reverse()
    .map((w) => ({
      week: new Date(w.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight: w.weight,
      target: c.goalWeight,
    }));

  function addWeight(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(entry);
    if (Number.isNaN(value) || value <= 0 || !c) return;
    app.logWeight(c.id, value);
    setEntry("");
  }

  async function handleAddPhoto(dataUrl?: string) {
    if (!dataUrl || !c) return;
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (data.url) app.addPhoto(c.id, data.url);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <p className="text-sm text-brand-100">Your journey</p>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="mt-1 text-sm text-brand-100">{c.program} · {c.goal}</p>
      </section>

      {/* Quick stat tiles */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Scale} label="Current" value={`${c.currentWeight} lb`} tint="text-brand-400 bg-brand-500/15" />
        <StatTile icon={TrendingDown} label="Change" value={`${lost >= 0 ? "-" : "+"}${Math.abs(lost)} lb`} tint="text-accent-400 bg-accent-500/15" />
        <StatTile icon={Target} label="To goal" value={`${toGoal} lb`} tint="text-amber-400 bg-amber-500/15" />
        <StatTile icon={Activity} label="Workouts" value={`${sessions.length}`} tint="text-orange-500 bg-orange-500/15" />
      </section>

      {/* Log weight */}
      <section className="card p-5">
        <h2 className="font-semibold text-ink-900">Log your weight</h2>
        <form onSubmit={addWeight} className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="weight" className="label">Weight (lb)</label>
            <input
              id="weight" type="number" inputMode="decimal" step="0.1" min="0"
              value={entry} onChange={(e) => setEntry(e.target.value)}
              placeholder={String(c.currentWeight || "")} className="input"
            />
          </div>
          <button type="submit" className="btn-primary"><Plus className="h-4 w-4" /> Add</button>
        </form>
        {weightLog.length > 0 && (
          <div className="mt-5">
            <div className="text-xs uppercase tracking-wide text-ink-400">Recent entries</div>
            <ul className="mt-2 space-y-2">
              {weightLog.slice(0, 6).map((w, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
                  <span className="text-sm text-ink-500">
                    {new Date(w.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-sm font-semibold text-ink-900">{w.weight} lb</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Weight trend */}
      <section className="card p-5">
        <h2 className="font-semibold text-ink-900">Body weight trend</h2>
        {chartData.length >= 2 ? (
          <div className="mt-2"><WeightChart data={chartData} /></div>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon={LineChart}
              title="Not enough data yet"
              description="Log your weight a couple of times and your trend chart appears here."
            />
          </div>
        )}
      </section>

      {/* Progress photos */}
      <section className="card p-5">
        <h2 className="font-semibold text-ink-900">Progress photos</h2>
        <p className="mt-1 text-sm text-ink-500">Snap a photo to track your transformation. Your coach can see these too.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="space-y-1.5">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-ink-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.label} className="h-full w-full object-cover" />
                <button
                  type="button" onClick={() => app.removePhoto(c.id, p.id)} title="Remove photo"
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-ink-100/80 text-rose-400 shadow-soft transition hover:bg-ink-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="text-center text-xs font-medium text-ink-500">{p.label}</div>
            </div>
          ))}
          <div className="space-y-1.5">
            <ImageUpload aspect="tall" label={uploading ? "Uploading…" : "Add photo"} onChange={handleAddPhoto} />
            <div className="flex items-center justify-center gap-1 text-center text-xs font-medium text-ink-400">
              <Plus className="h-3 w-3" /> New photo
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-side comparison */}
      <section className="card p-5">
        <h2 className="font-semibold text-ink-900">Side-by-side comparison</h2>
        <p className="mt-1 text-sm text-ink-500">Pick two photos to see your transformation side by side.</p>
        <div className="mt-4">
          <PhotoCompare photos={photos.map((p) => ({ id: p.id, label: p.label, dataUrl: p.url }))} />
        </div>
      </section>
    </div>
  );
}

function StatTile({
  icon: Icon, label, value, tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tint: string;
}) {
  const [text, bg] = tint.split(" ");
  return (
    <div className="card p-4 text-center">
      <span className={cn("mx-auto flex h-9 w-9 items-center justify-center rounded-lg", bg, text)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="mt-2 text-base font-bold text-ink-900">{value}</div>
      <div className="text-[11px] text-ink-400">{label}</div>
    </div>
  );
}
