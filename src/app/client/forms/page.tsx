"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText, CheckCircle2, ChevronRight, ArrowLeft, ClipboardCheck, UserPlus, CalendarDays,
} from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import type { CoachForm, FormField } from "@/lib/store";
import { EmptyState } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

type AnswerMap = Record<string, string | number>;
type MultiMap = Record<string, string[]>;

function FormRunner({
  form, onSubmit, onCancel,
}: {
  form: CoachForm;
  onSubmit: (answers: AnswerMap) => void;
  onCancel: () => void;
}) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [multi, setMulti] = useState<MultiMap>({});
  const [error, setError] = useState("");

  const key = (f: FormField) => f.label || f.id;
  const setAnswer = (f: FormField, v: string | number) =>
    setAnswers((p) => ({ ...p, [key(f)]: v }));
  const toggleMulti = (f: FormField, opt: string) =>
    setMulti((p) => {
      const cur = p[key(f)] ?? [];
      return { ...p, [key(f)]: cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt] };
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Merge multi-selects into the answer map.
    const merged: AnswerMap = { ...answers };
    for (const f of form.fields) {
      if (f.type === "checkbox") {
        const sel = multi[key(f)] ?? [];
        if (sel.length) merged[key(f)] = sel.join(", ");
      }
    }
    // Validate required fields.
    const missing = form.fields.filter((f) => {
      if (!f.required) return false;
      const v = merged[key(f)];
      return v === undefined || v === "" ;
    });
    if (missing.length) {
      setError(`Please complete: ${missing.map((m) => m.label).join(", ")}.`);
      return;
    }
    onSubmit(merged);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> All forms
      </button>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <div className="flex items-center gap-2 text-sm text-brand-100">
          <FileText className="h-4 w-4" /> Form from your coach
        </div>
        <h1 className="mt-1 text-2xl font-bold">{form.name}</h1>
        {form.description && <p className="mt-2 text-sm text-brand-100">{form.description}</p>}
      </section>

      <div className="card space-y-6 p-5">
        {form.fields.map((f) => (
          <div key={f.id}>
            <label className="mb-2 block text-sm font-medium text-ink-800">
              {f.label}
              {f.required && <span className="ml-1 text-brand-400">*</span>}
            </label>

            {f.type === "short" && (
              <input className="input" value={(answers[key(f)] as string) ?? ""} onChange={(e) => setAnswer(f, e.target.value)} placeholder="Your answer" />
            )}
            {f.type === "long" && (
              <textarea rows={3} className="input resize-none" value={(answers[key(f)] as string) ?? ""} onChange={(e) => setAnswer(f, e.target.value)} placeholder="Your answer" />
            )}
            {f.type === "number" && (
              <input type="number" inputMode="decimal" className="input" value={(answers[key(f)] as number | string) ?? ""} onChange={(e) => setAnswer(f, e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" />
            )}

            {f.type === "scale" && (
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const n = i + 1;
                  const selected = answers[key(f)] === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAnswer(f, n)}
                      aria-pressed={selected}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition active:scale-95",
                        selected
                          ? "bg-brand-600 text-white shadow-glow"
                          : "border border-ink-200 bg-ink-100 text-ink-600 hover:border-brand-300",
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            )}

            {f.type === "yesno" && (
              <div className="flex gap-2">
                {["Yes", "No"].map((opt) => {
                  const selected = answers[key(f)] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(f, opt)}
                      className={cn(
                        "flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
                        selected ? "border-brand-500 bg-brand-600 text-white shadow-glow" : "border-ink-200 bg-ink-100 text-ink-700 hover:border-brand-300",
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {f.type === "choice" && (
              <div className="space-y-2">
                {(f.options ?? []).map((opt) => {
                  const selected = answers[key(f)] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(f, opt)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition active:scale-[0.99]",
                        selected ? "border-brand-500 bg-brand-500/15 text-ink-900" : "border-ink-200 bg-ink-100 text-ink-700 hover:border-brand-300",
                      )}
                    >
                      <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border", selected ? "border-brand-500" : "border-ink-300")}>
                        {selected && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {f.type === "checkbox" && (
              <div className="space-y-2">
                {(f.options ?? []).map((opt) => {
                  const selected = (multi[key(f)] ?? []).includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleMulti(f, opt)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition active:scale-[0.99]",
                        selected ? "border-brand-500 bg-brand-500/15 text-ink-900" : "border-ink-200 bg-ink-100 text-ink-700 hover:border-brand-300",
                      )}
                    >
                      <span className={cn("flex h-4 w-4 items-center justify-center rounded border", selected ? "border-brand-500 bg-brand-500 text-white" : "border-ink-300")}>
                        {selected && <CheckCircle2 className="h-3 w-3" />}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {error && (
          <p className="rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm font-medium text-rose-400">{error}</p>
        )}

        <button type="submit" className="btn-primary w-full">Submit form</button>
      </div>
    </form>
  );
}

export default function ClientFormsPage() {
  const app = useApp();
  const client = useCurrentClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState<string | null>(null);

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
        description="Add a client in the Trainer portal, then preview their experience here."
        action={<Link href="/dashboard/clients" className="btn-primary">Go to Clients</Link>}
      />
    );

  const assignedIds = app.clientPlans[client.id]?.formIds ?? [];
  const assignedForms = assignedIds
    .map((id) => app.forms.find((f) => f.id === id))
    .filter((f): f is CoachForm => Boolean(f));

  const active = assignedForms.find((f) => f.id === activeId) ?? null;
  const submissionsFor = (formId: string) =>
    app.checkins.filter((ci) => ci.clientId === client.id && ci.formId === formId);

  if (active) {
    return (
      <FormRunner
        form={active}
        onCancel={() => setActiveId(null)}
        onSubmit={(answers) => {
          app.addCheckin(client.id, answers, { formId: active.id, formName: active.name });
          setActiveId(null);
          setJustSubmitted(active.name);
          setTimeout(() => setJustSubmitted(null), 4000);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <div className="flex items-center gap-2 text-sm text-brand-100">
          <FileText className="h-4 w-4" /> Forms
        </div>
        <h1 className="mt-1 text-2xl font-bold">Forms from your coach</h1>
        <p className="mt-2 text-sm text-brand-100">
          Complete these so your coach can keep your plan dialed in.
        </p>
      </section>

      {justSubmitted && (
        <div className="flex items-center gap-2 rounded-2xl border border-accent-200 bg-accent-500/15 px-4 py-3 text-sm font-medium text-accent-400">
          <CheckCircle2 className="h-4 w-4" /> &ldquo;{justSubmitted}&rdquo; submitted — your coach can see it now.
        </div>
      )}

      {assignedForms.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No forms assigned yet"
          description="When your coach assigns a check-in or intake form, it'll show up here for you to fill out."
        />
      ) : (
        <div className="space-y-3">
          {assignedForms.map((f) => {
            const subs = submissionsFor(f.id);
            const last = subs[0];
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveId(f.id)}
                className="card flex w-full items-center gap-4 p-4 text-left transition hover:border-brand-500/40"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink-900">{f.name}</div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-ink-500">
                    <span>{f.fields.length} questions</span>
                    {last ? (
                      <span className="inline-flex items-center gap-1 text-accent-400">
                        <CalendarDays className="h-3 w-3" />
                        Last submitted {new Date(last.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    ) : (
                      <span className="text-amber-400">Not submitted yet</span>
                    )}
                  </div>
                </div>
                {subs.length > 0 && (
                  <span className="badge bg-accent-500/15 text-accent-400">
                    <ClipboardCheck className="h-3 w-3" /> {subs.length}
                  </span>
                )}
                <ChevronRight className="h-5 w-5 shrink-0 text-ink-400" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
