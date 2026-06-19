"use client";

import { useState } from "react";
import {
  Loader2, Plus, Trash2, ClipboardList, Save, ArrowUp, ArrowDown, FileText,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/ui/Modal";
import { useApp } from "@/lib/store";
import { useLocalState } from "@/lib/useLocalState";
import { uid } from "@/lib/store";
import { cn } from "@/lib/utils";

type FieldType = "short" | "long" | "number" | "scale" | "yesno" | "choice";

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  options: string; // comma-separated for choice
  required: boolean;
}

interface SavedForm {
  id: string;
  name: string;
  fields: FormField[];
}

const typeLabels: Record<FieldType, string> = {
  short: "Short text",
  long: "Long text",
  number: "Number",
  scale: "Scale 1–10",
  yesno: "Yes / No",
  choice: "Multiple choice",
};

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

function newField(): FormField {
  return { id: uid("fld"), label: "", type: "short", options: "", required: false };
}

function FieldPreview({ field }: { field: FormField }) {
  const opts = field.options.split(",").map((o) => o.trim()).filter(Boolean);
  return (
    <div>
      <span className="label">
        {field.label || "Untitled question"}
        {field.required && <span className="ml-1 text-rose-400">*</span>}
      </span>
      {field.type === "short" && <input className="input" placeholder="Short answer" disabled />}
      {field.type === "long" && (
        <textarea className="input min-h-[72px]" placeholder="Long answer" disabled />
      )}
      {field.type === "number" && <input type="number" className="input" placeholder="0" disabled />}
      {field.type === "scale" && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 bg-ink-100 text-xs text-ink-600"
            >
              {i + 1}
            </span>
          ))}
        </div>
      )}
      {field.type === "yesno" && (
        <div className="flex gap-2">
          <span className="badge bg-accent-500/15 text-accent-400">Yes</span>
          <span className="badge bg-rose-500/15 text-rose-400">No</span>
        </div>
      )}
      {field.type === "choice" && (
        <div className="space-y-1.5">
          {(opts.length ? opts : ["Option 1", "Option 2"]).map((o, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-ink-700">
              <span className="h-4 w-4 rounded-full border border-ink-300" />
              {o}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FormBuilderPage() {
  const app = useApp();

  const [forms, setForms] = useLocalState<SavedForm[]>("ffkc-forms", []);
  const [name, setName] = useState("Weekly check-in");
  const [fields, setFields] = useState<FormField[]>([newField()]);

  if (!app.hydrated) return <Loading />;

  function patchField(id: string, patch: Partial<FormField>) {
    setFields((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function removeField(id: string) {
    setFields((fs) => fs.filter((f) => f.id !== id));
  }
  function moveField(id: string, dir: -1 | 1) {
    setFields((fs) => {
      const i = fs.findIndex((f) => f.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= fs.length) return fs;
      const copy = [...fs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function saveForm() {
    const cleaned = fields.filter((f) => f.label.trim());
    if (!cleaned.length) return;
    const form: SavedForm = {
      id: uid("form"),
      name: name.trim() || "Untitled form",
      fields: cleaned,
    };
    setForms((fs) => [form, ...fs]);
    setName("Weekly check-in");
    setFields([newField()]);
  }

  return (
    <>
      <PageHeader
        title="Form builder"
        subtitle="Design custom check-in and intake forms for your clients"
        action={
          <button type="button" className="btn-primary" onClick={saveForm}>
            <Save className="h-4 w-4" />
            Save form
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Builder */}
        <div className="card space-y-4 p-5">
          <p className="eyebrow">Build form</p>

          <label className="block">
            <span className="label">Form name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekly check-in"
            />
          </label>

          <div className="space-y-3">
            {fields.map((f, idx) => (
              <div key={f.id} className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-400">Field {idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveField(f.id, -1)}
                      disabled={idx === 0}
                      className="rounded p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(f.id, 1)}
                      disabled={idx === fields.length - 1}
                      className="rounded p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeField(f.id)}
                      className="rounded p-1 text-ink-400 transition hover:bg-rose-500/15 hover:text-rose-400"
                      aria-label="Remove field"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  className="input mb-2"
                  value={f.label}
                  onChange={(e) => patchField(f.id, { label: e.target.value })}
                  placeholder="Question label, e.g. How was your energy?"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="input"
                    value={f.type}
                    onChange={(e) => patchField(f.id, { type: e.target.value as FieldType })}
                  >
                    {(Object.keys(typeLabels) as FieldType[]).map((t) => (
                      <option key={t} value={t}>{typeLabels[t]}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-100 px-3 text-sm text-ink-700">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => patchField(f.id, { required: e.target.checked })}
                      className="h-4 w-4 accent-brand-500"
                    />
                    Required
                  </label>
                </div>

                {f.type === "choice" && (
                  <input
                    className="input mt-2"
                    value={f.options}
                    onChange={(e) => patchField(f.id, { options: e.target.value })}
                    placeholder="Comma-separated options, e.g. Great, Okay, Poor"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFields((fs) => [...fs, newField()])}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-200 py-3 text-sm font-medium text-ink-400 transition hover:border-brand-300 hover:text-brand-400"
          >
            <Plus className="h-4 w-4" /> Add field
          </button>
        </div>

        {/* Live preview */}
        <div className="card h-fit space-y-4 p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Live preview</p>
            <span className="badge bg-brand-500/15 text-brand-400">{fields.length} fields</span>
          </div>

          <h3 className="text-lg font-bold text-ink-900">{name.trim() || "Untitled form"}</h3>

          {fields.length === 0 ? (
            <p className="text-sm text-ink-400">Add a field to see it here.</p>
          ) : (
            <div className="space-y-4">
              {fields.map((f) => (
                <FieldPreview key={f.id} field={f} />
              ))}
            </div>
          )}

          <button type="button" className="btn-secondary w-full opacity-60" disabled>
            Submit (preview)
          </button>
        </div>
      </div>

      {/* Saved forms */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
          Saved forms ({forms.length})
        </h2>
        {forms.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No saved forms yet"
            description="Build a form on the left and hit Save form to add it to your library."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <div key={form.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-ink-900">{form.name}</p>
                      <p className="text-xs text-ink-500">{form.fields.length} fields</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForms((fs) => fs.filter((x) => x.id !== form.id))}
                    className="rounded-md p-1.5 text-ink-400 transition hover:bg-rose-500/15 hover:text-rose-400"
                    aria-label="Delete form"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {form.fields.slice(0, 4).map((f) => (
                    <span key={f.id} className={cn("badge bg-ink-100 text-ink-600")}>
                      {typeLabels[f.type]}
                    </span>
                  ))}
                  {form.fields.length > 4 && (
                    <span className="badge bg-ink-100 text-ink-500">+{form.fields.length - 4}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
