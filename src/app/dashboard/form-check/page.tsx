"use client";

import { useMemo, useState } from "react";
import {
  ScanLine, Film, Sparkles, Save, AlertTriangle, Activity, Trash2,
  ClipboardList, Clock, CheckCircle2, X, Send,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState, Field } from "@/components/ui/Modal";
import { VideoPreview } from "@/components/ui/VideoUpload";
import { useApp, useMyClients } from "@/lib/store";
import { askAI, aiConfigured } from "@/lib/ai";
import { cn } from "@/lib/utils";

const DEFAULT_LIFTS = ["Squat", "Bench Press", "Deadlift", "Overhead Press"];

const COMMON_FAULTS = [
  "Knees cave in",
  "Heels rise",
  "Back rounds",
  "Bar drifts forward",
  "Shallow depth",
  "Elbow flare",
  "Hips shoot up early",
  "Loss of bracing / core",
  "Bar path inconsistent",
  "Uneven shift to one side",
];

/** Maps a fault to likely weak / overactive muscles for the local fallback. */
const FAULT_MUSCLES: Record<string, string[]> = {
  "Knees cave in": ["Weak Glute Medius", "Weak Glutes", "Overactive Adductors"],
  "Heels rise": ["Tight/Overactive Calves", "Weak Anterior Tibialis", "Limited Ankle Mobility"],
  "Back rounds": ["Weak Spinal Erectors", "Weak Lats", "Overactive Hip Flexors"],
  "Bar drifts forward": ["Weak Upper Back", "Weak Lats", "Overactive Anterior Delts"],
  "Shallow depth": ["Weak Glutes", "Limited Ankle Mobility", "Overactive Hip Flexors"],
  "Elbow flare": ["Weak Lats", "Overactive Pec Major", "Weak Lower Traps"],
  "Hips shoot up early": ["Weak Quads", "Weak Spinal Erectors", "Overactive Hamstrings"],
  "Loss of bracing / core": ["Weak Transverse Abdominis", "Weak Obliques", "Overactive Hip Flexors"],
  "Bar path inconsistent": ["Weak Scapular Stabilizers", "Weak Rear Delts", "Overactive Upper Traps"],
  "Uneven shift to one side": ["Weak Glute Medius", "Weak Obliques", "Overactive Quadratus Lumborum"],
};

interface SavedReview {
  id: string;
  date: string;
  exercise: string;
  faults: string[];
  notes: string;
  weaknessSummary: string[];
  videoName?: string;
}

function makeId() {
  return `fc_${Math.random().toString(36).slice(2, 9)}`;
}

/** Derive exactly 3 weakness bullets locally from checked faults. */
function localWeaknessBullets(faults: string[]): string[] {
  const tally = new Map<string, number>();
  faults.forEach((f) => {
    (FAULT_MUSCLES[f] ?? []).forEach((m, i) => {
      tally.set(m, (tally.get(m) ?? 0) + (3 - i));
    });
  });
  let ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m);
  if (ranked.length === 0) {
    ranked = ["Weak Glutes", "Weak Upper Back", "Overactive Hip Flexors"];
  }
  while (ranked.length < 3) {
    const filler = ["Weak Core Stabilizers", "Weak Lower Traps", "Overactive Upper Traps"];
    const next = filler.find((f) => !ranked.includes(f));
    if (!next) break;
    ranked.push(next);
  }
  const rationale: Record<string, string> = {};
  faults.forEach((f) => {
    (FAULT_MUSCLES[f] ?? []).forEach((m) => {
      if (!rationale[m]) rationale[m] = f.toLowerCase();
    });
  });
  return ranked.slice(0, 3).map((m) => {
    const why = rationale[m] ? `linked to "${rationale[m]}"` : "common compensation pattern";
    return `${m} — ${why}.`;
  });
}

/** Templated paragraph analysis from faults for the local fallback. */
function localAnalysis(exercise: string, faults: string[], notes: string): string {
  if (faults.length === 0 && !notes.trim()) {
    return `No faults were flagged for this ${exercise}. The movement appears technically sound. Continue reinforcing bracing cues, controlled tempo, and consistent bar path. Re-assess under heavier load to confirm positions hold up at intensity.`;
  }
  const list = faults.length ? faults.map((f) => `"${f}"`).join(", ") : "the noted concerns";
  return `On this ${exercise}, the key technique breakdowns observed are ${list}. These suggest a combination of stability and mobility limitations rather than a pure strength ceiling. Prioritise targeted accessory work for the under-active muscle groups, add positional drills to reinforce a neutral, braced trunk, and reduce load until the pattern is consistent rep-to-rep. Film from a side angle next session to track depth and bar path.${notes.trim() ? ` Coach context: ${notes.trim()}` : ""}`;
}

export default function FormCheckPage() {
  const app = useApp();
  const myClients = useMyClients();

  const [clientId, setClientId] = useState<string>("");
  const [exercise, setExercise] = useState<string>(DEFAULT_LIFTS[0]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [faults, setFaults] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [bullets, setBullets] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<string>("");
  const [loadingBullets, setLoadingBullets] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string>("");

  // Request-a-video mini form
  const [reqExercise, setReqExercise] = useState<string>(DEFAULT_LIFTS[0]);
  const [reqNote, setReqNote] = useState<string>("");

  const activeClientId = clientId || myClients[0]?.id || "";
  // Form-check reviews persist in the shared workspace, keyed by client.
  const reviews = app.formReviews[activeClientId] ?? [];
  const requests = app.formCheckRequests[activeClientId] ?? [];
  const pending = requests.filter((r) => r.status === "pending");
  const needsReview = requests.filter((r) => r.status === "submitted");
  const reviewed = requests.filter((r) => r.status === "reviewed");
  const activeRequest = requests.find((r) => r.id === activeRequestId) ?? null;

  const exerciseOptions = useMemo(() => {
    const fromStore = app.exercises.map((e) => e.name);
    const merged = [...DEFAULT_LIFTS];
    fromStore.forEach((n) => {
      if (!merged.includes(n)) merged.push(n);
    });
    return merged;
  }, [app.exercises]);

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );
  }

  if (myClients.length === 0) {
    return (
      <>
        <PageHeader title="Form Check" subtitle="Review client-submitted technique videos and flag weaknesses" />
        <EmptyState
          icon={ScanLine}
          title="No clients yet"
          description="Add a client to start requesting form-check videos and reviewing technique."
        />
      </>
    );
  }

  function toggleFault(f: string) {
    setFaults((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }

  function selectClient(id: string) {
    setClientId(id);
    setActiveRequestId(null);
    setFaults([]);
    setNotes("");
    setBullets([]);
    setAnalysis("");
  }

  function reviewSubmission(id: string) {
    const r = requests.find((x) => x.id === id);
    if (!r) return;
    setActiveRequestId(id);
    setExercise(r.exercise);
    setFaults([]);
    setNotes("");
    setBullets([]);
    setAnalysis("");
  }

  function sendRequest() {
    if (!activeClientId) return;
    app.requestFormCheck(activeClientId, reqExercise, reqNote.trim() || undefined);
    setReqNote("");
  }

  async function generateBullets() {
    setError("");
    setLoadingBullets(true);
    try {
      if (aiConfigured(app.settings)) {
        const prompt =
          `For a ${exercise} form check, the coach flagged these faults: ` +
          `${faults.length ? faults.join(", ") : "none specified"}. ` +
          `Coach notes: ${notes.trim() || "none"}. ` +
          `Return EXACTLY 3 bullet points naming a likely weak or overactive muscle ` +
          `(e.g. "Weak Traps", "Weak Delts", "Overactive Pec Minor") with a one-line rationale each. ` +
          `Format each as "Muscle — rationale". No preamble.`;
        const reply = await askAI(
          app.settings,
          [{ role: "user", content: prompt }],
          "You are a strength coach and corrective-exercise specialist. Be concise and specific.",
        );
        const parsed = reply
          .split("\n")
          .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
          .filter(Boolean)
          .slice(0, 3);
        setBullets(parsed.length ? parsed : localWeaknessBullets(faults));
      } else {
        setBullets(localWeaknessBullets(faults));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed");
      setBullets(localWeaknessBullets(faults));
    } finally {
      setLoadingBullets(false);
    }
  }

  async function generateAnalysis() {
    setError("");
    setLoadingAnalysis(true);
    try {
      if (aiConfigured(app.settings)) {
        const prompt =
          `Write a concise coaching analysis paragraph for a ${exercise} form check. ` +
          `Flagged faults: ${faults.length ? faults.join(", ") : "none"}. ` +
          `Coach notes: ${notes.trim() || "none"}. ` +
          `Cover likely root causes, corrective priorities, and a next-session action. One paragraph.`;
        const reply = await askAI(
          app.settings,
          [{ role: "user", content: prompt }],
          "You are an experienced strength and conditioning coach.",
        );
        setAnalysis(reply.trim() || localAnalysis(exercise, faults, notes));
      } else {
        setAnalysis(localAnalysis(exercise, faults, notes));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed");
      setAnalysis(localAnalysis(exercise, faults, notes));
    } finally {
      setLoadingAnalysis(false);
    }
  }

  function saveReview() {
    const summary = bullets.length ? bullets : localWeaknessBullets(faults);
    const review: SavedReview = {
      id: makeId(),
      date: new Date().toISOString(),
      exercise,
      faults: [...faults],
      notes: notes.trim(),
      weaknessSummary: summary,
      videoName: activeRequest?.videoName,
    };
    app.addFormReview(activeClientId, review);
    // Attach the feedback to the request itself so the client sees it in
    // their Form Check section.
    if (activeRequest) {
      app.markFormCheckReviewed(activeClientId, activeRequest.id, {
        date: review.date,
        faults: review.faults,
        notes: review.notes || undefined,
        weaknessSummary: summary,
        analysis: analysis.trim() || undefined,
      });
    }
    // reset the working session
    setActiveRequestId(null);
    setFaults([]);
    setNotes("");
    setBullets([]);
    setAnalysis("");
  }

  function deleteReview(id: string) {
    app.deleteFormReview(activeClientId, id);
  }

  const clientName = myClients.find((c) => c.id === activeClientId)?.name ?? "Client";

  return (
    <>
      <PageHeader title="Form Check" subtitle="Review client-submitted technique videos and flag weaknesses" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: review session */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-brand-400" />
              <h2 className="font-semibold text-ink-900">Review session</h2>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              Pick a client, then select a submitted clip from the queue on the right to review it.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Client">
                <select
                  className="input"
                  value={activeClientId}
                  onChange={(e) => selectClient(e.target.value)}
                >
                  {myClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Exercise / lift">
                <select
                  className="input"
                  value={exercise}
                  onChange={(e) => setExercise(e.target.value)}
                >
                  {exerciseOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Video under review — always the client's own submission, never uploaded by the coach */}
            <div className="mt-4">
              <span className="label">Client&rsquo;s clip</span>
              {activeRequest?.videoUrl ? (
                <div className="space-y-2">
                  <VideoPreview url={activeRequest.videoUrl} className="max-h-96" />
                  <p className="text-xs text-ink-500">
                    Submitted by {clientName} · {activeRequest.submittedAt ? new Date(activeRequest.submittedAt).toLocaleString() : ""}
                    {activeRequest.note && <> · Note to client: &ldquo;{activeRequest.note}&rdquo;</>}
                  </p>
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50 text-center text-ink-400">
                  <div className="flex flex-col items-center gap-2 px-4">
                    <Film className="h-8 w-8" />
                    <span className="text-xs">
                      Select a clip from &ldquo;Needs review&rdquo; on the right — clients upload their own videos, coaches review them here.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Faults checklist */}
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-ink-900">Form faults</h2>
            </div>
            <p className="mt-1 text-sm text-ink-500">Check every fault observed in the clip.</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {COMMON_FAULTS.map((f) => {
                const checked = faults.includes(f);
                return (
                  <label
                    key={f}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                      checked
                        ? "border-brand-500/40 bg-brand-500/15 text-ink-900"
                        : "border-ink-200 bg-ink-50 text-ink-600 hover:text-ink-900",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFault(f)}
                      className="h-4 w-4 accent-brand-500"
                    />
                    {f}
                  </label>
                );
              })}
            </div>

            <div className="mt-4">
              <Field label="Coach notes / areas to improve">
                <textarea
                  className="input min-h-[96px]"
                  placeholder="What stood out, cues given, what to drill next session…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button className="btn-secondary inline-flex items-center gap-2" onClick={generateAnalysis} disabled={loadingAnalysis}>
                <Sparkles className="h-4 w-4" />
                {loadingAnalysis ? "Analyzing…" : "AI Form Check Analysis"}
              </button>
              <button className="btn-primary inline-flex items-center gap-2" onClick={saveReview}>
                <Save className="h-4 w-4" />
                {activeRequest ? "Save review" : "Save review (no clip)"}
              </button>
            </div>

            {error && (
              <p className="mt-3 rounded-xl border border-brand-500/40 bg-brand-500/15 px-3 py-2 text-sm text-brand-400">
                {error}
              </p>
            )}

            {analysis && (
              <div className="mt-4 rounded-2xl border border-ink-200 bg-ink-50 p-4">
                <div className="eyebrow text-ink-400">AI Form Check Analysis</div>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">{analysis}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: request + queue + weakness summary */}
        <div className="space-y-6">
          {/* Request a video from the client — an assigned task, like check-ins */}
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-brand-400" />
              <h2 className="font-semibold text-ink-900">Request a video</h2>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              Assign {clientName} a form-check task — they&rsquo;ll upload the clip from their portal.
            </p>
            <div className="mt-3 space-y-3">
              <select className="input" value={reqExercise} onChange={(e) => setReqExercise(e.target.value)}>
                {exerciseOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <textarea
                className="input min-h-[64px] text-sm"
                placeholder="Filming notes for the client (optional) — e.g. film from the side, full depth"
                value={reqNote}
                onChange={(e) => setReqNote(e.target.value)}
              />
              <button className="btn-primary w-full" onClick={sendRequest}>
                <Send className="h-4 w-4" /> Request from {clientName.split(" ")[0]}
              </button>
            </div>
          </div>

          {/* Queue */}
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-accent-400" />
              <h2 className="font-semibold text-ink-900">Video queue</h2>
            </div>

            {needsReview.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Needs review</p>
                <div className="space-y-2">
                  {needsReview.map((r) => (
                    <div
                      key={r.id}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition",
                        activeRequestId === r.id
                          ? "border-brand-500/40 bg-brand-500/15"
                          : "border-ink-200 bg-ink-50 hover:border-brand-300",
                      )}
                    >
                      <button
                        onClick={() => reviewSubmission(r.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <Film className="h-4 w-4 shrink-0 text-brand-400" />
                        <span className="min-w-0 flex-1 truncate text-ink-800">{r.exercise}</span>
                        <span className="badge shrink-0 bg-brand-500/15 text-brand-400">New</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this submission and its video?")) {
                            if (activeRequestId === r.id) setActiveRequestId(null);
                            app.removeFormCheckRequest(activeClientId, r.id);
                          }
                        }}
                        className="shrink-0 text-ink-300 transition hover:text-rose-400"
                        aria-label="Delete submission"
                        title="Delete submission"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pending.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Pending upload</p>
                <div className="space-y-2">
                  {pending.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 rounded-xl border border-dashed border-ink-200 px-3 py-2 text-sm text-ink-500">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{r.exercise}</span>
                      <button
                        onClick={() => app.removeFormCheckRequest(activeClientId, r.id)}
                        className="shrink-0 text-ink-300 hover:text-rose-400"
                        aria-label="Cancel request"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reviewed.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Reviewed</p>
                <div className="space-y-2">
                  {reviewed.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center gap-2 rounded-xl border border-ink-100 px-3 py-2 text-sm text-ink-500">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-400" />
                      <span className="min-w-0 flex-1 truncate">{r.exercise}</span>
                      <button
                        onClick={() => {
                          if (confirm("Delete this reviewed submission and its video?")) {
                            app.removeFormCheckRequest(activeClientId, r.id);
                          }
                        }}
                        className="shrink-0 text-ink-300 transition hover:text-rose-400"
                        aria-label="Delete submission"
                        title="Delete submission"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {requests.length === 0 && (
              <p className="mt-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-4 text-center text-xs text-ink-400">
                No requests yet for {clientName}. Request a video above.
              </p>
            )}
          </div>

          {/* Weakness summary */}
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent-400" />
              <h2 className="font-semibold text-ink-900">Muscle weakness summary</h2>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              Exactly 3 likely weak / overactive muscles from the flagged faults.
            </p>

            <button
              className="btn-secondary mt-4 inline-flex w-full items-center justify-center gap-2"
              onClick={generateBullets}
              disabled={loadingBullets}
            >
              <Sparkles className="h-4 w-4" />
              {loadingBullets ? "Generating…" : "Generate weakness summary (AI)"}
            </button>

            {bullets.length > 0 && (
              <div className="mt-4 rounded-2xl border border-brand-500/40 bg-brand-500/15 p-4">
                <ul className="space-y-2">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm text-ink-900">
                      <span className="mt-0.5 text-brand-400">●</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!aiConfigured(app.settings) && (
              <p className="mt-3 text-xs text-ink-400">
                AI not configured — using local fault-to-muscle mapping. Add a provider in Settings to use AI.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Saved reviews */}
      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink-900">Saved reviews</h2>
            <p className="text-sm text-ink-500">Form check history for {clientName}.</p>
          </div>
          <span className="badge">{reviews.length} saved</span>
        </div>

        {reviews.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={ScanLine}
              title="No reviews yet"
              description="Flag faults, generate a weakness summary, and save a review to build a history."
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-ink-200 bg-ink-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink-900">{r.exercise}</span>
                    <span className="badge">{r.faults.length} faults</span>
                    <span className="text-xs text-ink-400">
                      {new Date(r.date).toLocaleDateString()} ·{" "}
                      {new Date(r.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <button
                    className="text-ink-400 hover:text-brand-400"
                    onClick={() => deleteReview(r.id)}
                    aria-label="Delete review"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {r.videoName && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
                    <Film className="h-3.5 w-3.5 text-brand-400" /> {r.videoName}
                  </div>
                )}

                {r.faults.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.faults.map((f) => (
                      <span key={f} className="badge bg-amber-500/15 text-amber-500">
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {r.weaknessSummary.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {r.weaknessSummary.map((b, i) => (
                      <li key={i} className="flex gap-2 text-sm text-ink-700">
                        <span className="mt-0.5 text-brand-400">●</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {r.notes && <p className="mt-2 text-sm text-ink-500">{r.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
