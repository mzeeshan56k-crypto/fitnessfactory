"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, CheckCircle2, CalendarDays, UserPlus } from "lucide-react";
import { checkinQuestions } from "@/lib/platform";
import { useApp, useCurrentClient } from "@/lib/store";
import { EmptyState } from "@/components/ui/Modal";

export default function ClientCheckinPage() {
  const app = useApp();
  const currentClient = useCurrentClient();

  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!app.hydrated)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );

  if (!currentClient)
    return (
      <EmptyState
        icon={UserPlus}
        title="No client selected"
        description="Add a client in the Trainer portal, then preview their experience here."
        action={<Link href="/dashboard/clients" className="btn-primary">Go to Clients</Link>}
      />
    );

  const history = app.checkins.filter((c) => c.clientId === currentClient.id);

  const setAnswer = (id: string, value: string | number) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Light validation: require the numeric and scale questions to be filled.
    const missing = checkinQuestions.filter(
      (q) =>
        q.type !== "text" &&
        (answers[q.id] === undefined || answers[q.id] === ""),
    );
    if (missing.length > 0) {
      setError(`Please complete: ${missing.map((m) => m.label).join(", ")}.`);
      return;
    }
    app.addCheckin(currentClient.id, answers);
    setSubmitted(true);
    setError("");
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500 via-brand-600 to-ink-50 p-6 text-white shadow-glow">
        <div className="flex items-center gap-2 text-sm text-brand-100">
          <ClipboardCheck className="h-4 w-4" /> Weekly check-in
        </div>
        <h1 className="mt-1 text-2xl font-bold">
          Help your coach keep your plan dialed in
        </h1>
        <p className="mt-2 text-sm text-brand-100">
          Takes a minute. Your honest answers shape next week&apos;s program.
        </p>
      </section>

      {submitted ? (
        /* Success confirmation */
        <section className="card p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-500/15 text-accent-400">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-ink-900">
            Check-in submitted! ✅
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Your coach will review it and adjust your plan if needed.
          </p>
          <button onClick={reset} className="btn-primary mt-5">
            Start a new check-in
          </button>
        </section>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="card space-y-5 p-5">
          {checkinQuestions.map((q) => (
            <div key={q.id}>
              <label className="label" htmlFor={q.id}>
                {q.label}
              </label>

              {q.type === "number" && (
                <div className="relative">
                  <input
                    id={q.id}
                    type="number"
                    inputMode="decimal"
                    className="input pr-12"
                    value={(answers[q.id] as number | string) ?? ""}
                    onChange={(e) =>
                      setAnswer(
                        q.id,
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    placeholder="0"
                  />
                  {q.unit && (
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-ink-400">
                      {q.unit}
                    </span>
                  )}
                </div>
              )}

              {q.type === "scale" && (
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const selected = answers[q.id] === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswer(q.id, n)}
                        aria-pressed={selected}
                        className={
                          selected
                            ? "flex h-12 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white shadow-glow transition active:scale-95"
                            : "flex h-12 items-center justify-center rounded-xl border border-ink-200 bg-ink-100 text-base font-bold text-ink-600 transition hover:border-brand-300 hover:bg-brand-500/15 active:scale-95"
                        }
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === "text" && (
                <textarea
                  id={q.id}
                  rows={3}
                  className="input resize-none"
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder="Optional notes for your coach…"
                />
              )}
            </div>
          ))}

          {error && (
            <p className="rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm font-medium text-rose-400">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full">
            Submit check-in
          </button>
        </form>
      )}

      {/* Past check-ins */}
      {history.length > 0 && (
        <section>
          <h2 className="mb-3 px-1 font-semibold text-ink-900">Past check-ins</h2>
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="card flex items-center gap-4 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink-900">
                    {fmtDate(h.date)}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-500">
                    {h.answers.weight !== undefined && h.answers.weight !== "" && (
                      <span>Weight: {h.answers.weight} lb</span>
                    )}
                    {h.answers.energy !== undefined && (
                      <span>Energy: {h.answers.energy}/5</span>
                    )}
                    {h.answers.sleep !== undefined && (
                      <span>Sleep: {h.answers.sleep}/5</span>
                    )}
                  </div>
                </div>
                <span className="badge bg-accent-500/15 text-accent-400">
                  <CheckCircle2 className="h-3 w-3" /> Submitted
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
