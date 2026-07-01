"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ScanLine, Clock, CheckCircle2, UserPlus, Upload,
} from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { EmptyState, Field } from "@/components/ui/Modal";
import { VideoUpload, VideoPreview } from "@/components/ui/VideoUpload";
import { cn } from "@/lib/utils";

const DEFAULT_LIFTS = ["Squat", "Bench Press", "Deadlift", "Overhead Press"];

const STATUS_META = {
  pending: { label: "Upload needed", tint: "bg-amber-500/15 text-amber-500", icon: Clock },
  submitted: { label: "Submitted — awaiting review", tint: "bg-brand-500/15 text-brand-400", icon: Upload },
  reviewed: { label: "Reviewed by your coach", tint: "bg-accent-500/15 text-accent-500", icon: CheckCircle2 },
} as const;

export default function ClientFormCheckPage() {
  const app = useApp();
  const client = useCurrentClient();
  const [adHocExercise, setAdHocExercise] = useState(DEFAULT_LIFTS[0]);

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <EmptyState
        icon={UserPlus}
        title="No client selected"
        description="Add a client in the Trainer portal, then preview their experience here."
        action={<Link href="/dashboard/clients" className="btn-primary">Go to Clients</Link>}
      />
    );
  }

  const requests = app.formCheckRequests[client.id] ?? [];
  const pending = requests.filter((r) => r.status === "pending");
  const submitted = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <div className="flex items-center gap-2 text-sm text-brand-100">
          <ScanLine className="h-4 w-4" /> Form Check
        </div>
        <h1 className="mt-1 text-2xl font-bold">Upload a clip, get coached technique feedback</h1>
        <p className="mt-2 text-sm text-brand-100">
          Film your lift and upload it here. Your coach reviews it and gives you feedback — no need to send it anywhere else.
        </p>
        {pending.length > 0 && (
          <div className="mt-4 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
            {pending.length} video{pending.length === 1 ? "" : "s"} requested by your coach
          </div>
        )}
      </section>

      {/* Requested by coach — assigned tasks */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-bold text-ink-900">Requested by your coach</h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink-900">{r.exercise}</p>
                    {r.note && <p className="text-xs text-ink-500">{r.note}</p>}
                  </div>
                </div>
                <div className="mt-3">
                  <VideoUpload
                    pathPrefix={`formcheck/${client.id}`}
                    label="Upload your clip"
                    onUploaded={(url, name) => app.submitFormCheckVideo(client.id, r.id, { url, name, exercise: r.exercise })}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upload a video on your own — ad-hoc, not tied to a request */}
      <section className="card p-5">
        <h2 className="font-semibold text-ink-900">Upload a video</h2>
        <p className="mt-1 text-sm text-ink-500">
          Want feedback on something your coach hasn&rsquo;t asked for yet? Pick the lift and upload a clip anytime.
        </p>
        <div className="mt-3 space-y-3">
          <Field label="Exercise / lift">
            <select className="input" value={adHocExercise} onChange={(e) => setAdHocExercise(e.target.value)}>
              {[...new Set([...DEFAULT_LIFTS, ...app.workouts.flatMap((w) => w.exercises.map((ex) => ex.name))])].map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </Field>
          <VideoUpload
            pathPrefix={`formcheck/${client.id}`}
            label="Upload video"
            onUploaded={(url, name) => app.submitFormCheckVideo(client.id, null, { url, name, exercise: adHocExercise })}
          />
        </div>
      </section>

      {/* Your submissions */}
      <section>
        <h2 className="mb-3 text-base font-bold text-ink-900">Your submissions</h2>
        {submitted.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ink-400">
            No videos submitted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {submitted.map((r) => {
              const meta = STATUS_META[r.status];
              const Icon = meta.icon;
              return (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.tint)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink-900">{r.exercise}</p>
                        <p className="text-xs text-ink-400">
                          {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
                        </p>
                      </div>
                    </div>
                    <span className={cn("badge", meta.tint)}>{meta.label}</span>
                  </div>
                  {r.videoUrl && (
                    <div className="mt-3">
                      <VideoPreview url={r.videoUrl} className="max-h-72" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
