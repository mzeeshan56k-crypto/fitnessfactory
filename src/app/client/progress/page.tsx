"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingDown, Target, Scale, Flame, Plus, Award,
  Dumbbell, CheckCircle2, ArrowDown, ArrowUp, X, UserPlus, LineChart,
} from "lucide-react";
import { weightTrend, strengthTrend } from "@/lib/data";
import { WeightChart, StrengthChart } from "@/components/dashboard/Charts";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { PhotoCompare } from "@/components/PhotoCompare";
import { useLocalState } from "@/lib/useLocalState";
import { useApp, useCurrentClient } from "@/lib/store";
import { EmptyState } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface CheckIn {
  weight: number;
  date: string;
}

interface ProgressPhoto {
  id: string;
  label: string;
  dataUrl: string;
}

const measurements = [
  { name: "Chest", value: 40.5, unit: "in", change: -0.5 },
  { name: "Waist", value: 32.0, unit: "in", change: -1.5 },
  { name: "Hips", value: 38.0, unit: "in", change: -0.8 },
  { name: "Arms", value: 14.2, unit: "in", change: 0.4 },
  { name: "Thighs", value: 22.5, unit: "in", change: -0.6 },
];

const achievements = [
  { label: "First workout", icon: Dumbbell },
  { label: "10 workouts", icon: CheckCircle2 },
  { label: "5 lb down", icon: TrendingDown },
  { label: "30-day streak", icon: Flame },
];

export default function ClientProgressPage() {
  const app = useApp();
  const c = useCurrentClient();
  const baseWeight = c?.currentWeight ?? 0;

  const [checkIns, setCheckIns] = useState<CheckIn[]>([
    { weight: baseWeight, date: "Jun 16" },
    { weight: baseWeight + 1, date: "Jun 9" },
    { weight: baseWeight + 2, date: "Jun 2" },
  ]);
  const [entry, setEntry] = useState("");

  const [photos, setPhotos, photosHydrated] = useLocalState<ProgressPhoto[]>(
    "ffkc-progress-photos",
    [],
  );

  const addPhoto = (dataUrl: string | undefined) => {
    if (!dataUrl) return;
    const label = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    setPhotos((prev) => [...prev, { id: `pp-${Date.now()}`, label, dataUrl }]);
  };

  const updatePhoto = (id: string, dataUrl: string | undefined) => {
    if (!dataUrl) {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, dataUrl } : p)));
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const addCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(entry);
    if (Number.isNaN(value) || value <= 0) return;
    const date = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    setCheckIns((prev) => [{ weight: value, date }, ...prev]);
    setEntry("");
  };

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

  const lost = c.startWeight - c.currentWeight;
  const toGoal = Math.abs(c.currentWeight - c.goalWeight);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <p className="text-sm text-brand-100">Your journey</p>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="mt-1 text-sm text-brand-100">
          {c.program} · {c.goal}
        </p>
      </section>

      {/* Quick stat tiles */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Scale} label="Current" value={`${c.currentWeight} lb`} tint="text-brand-400 bg-brand-500/15" />
        <StatTile icon={TrendingDown} label="Change" value={`${lost >= 0 ? "-" : "+"}${Math.abs(lost)} lb`} tint="text-accent-400 bg-accent-500/15" />
        <StatTile icon={Target} label="To goal" value={`${toGoal} lb`} tint="text-amber-400 bg-amber-500/15" />
        <StatTile icon={Flame} label="Streak" value="23 days" tint="text-orange-500 bg-orange-500/15" />
      </section>

      {/* Log weight */}
      <section className="card p-5">
        <h2 className="font-semibold text-ink-900">Log your weight</h2>
        <form onSubmit={addCheckIn} className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="weight" className="label">
              Weight (lb)
            </label>
            <input
              id="weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="138.0"
              className="input"
            />
          </div>
          <button type="submit" className="btn-primary">
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
        <div className="mt-5">
          <div className="text-xs uppercase tracking-wide text-ink-400">
            Recent check-ins
          </div>
          <ul className="mt-2 space-y-2">
            {checkIns.map((ci, i) => (
              <li
                key={`${ci.date}-${i}`}
                className="flex items-center justify-between rounded-xl border border-ink-100 p-3"
              >
                <span className="text-sm text-ink-500">{ci.date}</span>
                <span className="text-sm font-semibold text-ink-900">
                  {ci.weight} lb
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {app.seeded ? (
        <>
          {/* Body weight chart */}
          <section className="card p-5">
            <h2 className="font-semibold text-ink-900">Body weight</h2>
            <div className="mt-2">
              <WeightChart data={weightTrend} />
            </div>
          </section>

          {/* Strength chart */}
          <section className="card p-5">
            <h2 className="font-semibold text-ink-900">Strength</h2>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <LegendDot colorClass="bg-brand-500" label="Squat" />
              <LegendDot colorClass="bg-accent-500" label="Bench" />
              <LegendDot colorClass="bg-amber-500" label="Deadlift" />
            </div>
            <div className="mt-2">
              <StrengthChart data={strengthTrend} />
            </div>
          </section>

          {/* Measurements */}
          <section className="card p-5">
            <h2 className="font-semibold text-ink-900">Measurements</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {measurements.map((m) => {
                const down = m.change < 0;
                return (
                  <div
                    key={m.name}
                    className="rounded-xl border border-ink-100 p-3"
                  >
                    <div className="text-xs text-ink-400">{m.name}</div>
                    <div className="mt-1 text-lg font-bold text-ink-900">
                      {m.value}
                      <span className="text-xs font-normal text-ink-400"> {m.unit}</span>
                    </div>
                    <div
                      className={cn(
                        "mt-1 flex items-center gap-0.5 text-xs font-medium",
                        down ? "text-accent-400" : "text-amber-400"
                      )}
                    >
                      {down ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUp className="h-3 w-3" />
                      )}
                      {Math.abs(m.change)} {m.unit}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        /* No trend data — keep logging tools working, show empty trend state */
        <section className="card p-5">
          <h2 className="font-semibold text-ink-900">Trends</h2>
          <div className="mt-4">
            <EmptyState
              icon={LineChart}
              title="No trend data yet"
              description="Keep logging your weight and check-ins. Load example data in the Trainer portal to preview charts."
            />
          </div>
        </section>
      )}

      {/* Progress photos */}
      <section className="card p-5">
        <h2 className="font-semibold text-ink-900">Progress photos</h2>
        <p className="mt-1 text-sm text-ink-500">
          Snap a photo to track your transformation over time.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photosHydrated &&
            photos.map((p) => (
              <div key={p.id} className="space-y-1.5">
                <div className="relative">
                  <ImageUpload
                    value={p.dataUrl}
                    aspect="tall"
                    onChange={(url) => updatePhoto(p.id, url)}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    title="Remove photo"
                    className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-ink-100/80 text-rose-400 shadow-soft transition hover:bg-ink-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-center text-xs font-medium text-ink-500">
                  {p.label}
                </div>
              </div>
            ))}
          <div className="space-y-1.5">
            <ImageUpload
              aspect="tall"
              label="Add photo"
              onChange={addPhoto}
            />
            <div className="flex items-center justify-center gap-1 text-center text-xs font-medium text-ink-400">
              <Plus className="h-3 w-3" /> New photo
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-side comparison */}
      <section className="card p-5">
        <h2 className="font-semibold text-ink-900">Side-by-side comparison</h2>
        <p className="mt-1 text-sm text-ink-500">
          Pick two photos to see your transformation side by side.
        </p>
        <div className="mt-4">
          {photosHydrated ? (
            <PhotoCompare photos={photos} />
          ) : (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
            </div>
          )}
        </div>
      </section>

      {/* Achievements */}
      <section className="card p-5">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          <h2 className="font-semibold text-ink-900">Achievements</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {achievements.map((a) => {
            const Icon = a.icon;
            return (
              <span
                key={a.label}
                className="badge border border-amber-100 bg-amber-500/15 text-amber-400"
              >
                <Icon className="h-3.5 w-3.5" />
                {a.label}
              </span>
            );
          })}
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
      <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${text}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="mt-2 text-base font-bold text-ink-900">{value}</div>
      <div className="text-[11px] text-ink-400">{label}</div>
    </div>
  );
}

function LegendDot({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-ink-500">
      <span className={cn("h-2.5 w-2.5 rounded-full", colorClass)} />
      {label}
    </span>
  );
}
