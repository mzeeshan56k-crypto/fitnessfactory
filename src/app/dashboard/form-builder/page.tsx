"use client";

import { useState } from "react";
import {
  Loader2, Plus, Trash2, ClipboardList, Save, ArrowUp, ArrowDown, FileText,
  Eye, Pencil, Sparkles, LayoutTemplate, X, CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/ui/Modal";
import { useApp, uid } from "@/lib/store";
import type { CoachForm, FormField, FormFieldType } from "@/lib/store";
import { prebuiltForms } from "@/lib/seed-content";
import { cn } from "@/lib/utils";

/* A field while it's being edited — options held as a comma-separated string. */
interface DraftField {
  id: string;
  label: string;
  type: FormFieldType;
  options: string;
  required: boolean;
}

const typeLabels: Record<FormFieldType, string> = {
  short: "Short text",
  long: "Long text",
  number: "Number",
  scale: "Scale 1–10",
  yesno: "Yes / No",
  choice: "Single choice",
  checkbox: "Checkboxes",
};

const needsOptions = (t: FormFieldType) => t === "choice" || t === "checkbox";

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

function newField(): DraftField {
  return { id: uid("fld"), label: "", type: "short", options: "", required: false };
}

/* --- conversions between the editing draft and the stored form shape --- */
function toDraft(fields: FormField[]): DraftField[] {
  return fields.map((f) => ({
    id: f.id || uid("fld"),
    label: f.label,
    type: f.type,
    options: (f.options ?? []).join(", "),
    required: !!f.required,
  }));
}
function toStored(fields: DraftField[]): FormField[] {
  return fields
    .filter((f) => f.label.trim())
    .map((f) => {
      const field: FormField = { id: f.id, label: f.label.trim(), type: f.type, required: f.required };
      if (needsOptions(f.type)) {
        field.options = f.options.split(",").map((o) => o.trim()).filter(Boolean);
      }
      return field;
    });
}

/* -------------------------------------------------------------------------- */
/*  A single rendered field (used in the live preview + full preview modal)    */
/* -------------------------------------------------------------------------- */
function FieldPreview({ field }: { field: FormField }) {
  const opts = field.options ?? [];
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-ink-800">
        {field.label || "Untitled question"}
        {field.required && <span className="ml-1 text-brand-400">*</span>}
      </span>

      {field.type === "short" && <input className="input" placeholder="Short answer" disabled />}
      {field.type === "long" && <textarea className="input min-h-[80px] resize-none" placeholder="Long answer" disabled />}
      {field.type === "number" && <input type="number" className="input" placeholder="0" disabled />}

      {field.type === "scale" && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-ink-50 text-xs font-semibold text-ink-600"
            >
              {i + 1}
            </span>
          ))}
        </div>
      )}

      {field.type === "yesno" && (
        <div className="flex gap-2">
          <span className="flex-1 rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm text-ink-600">Yes</span>
          <span className="flex-1 rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm text-ink-600">No</span>
        </div>
      )}

      {(field.type === "choice" || field.type === "checkbox") && (
        <div className="space-y-2">
          {(opts.length ? opts : ["Option 1", "Option 2"]).map((o, i) => (
            <label key={i} className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm text-ink-700">
              <span className={cn("h-4 w-4 border border-ink-300", field.type === "choice" ? "rounded-full" : "rounded")} />
              {o}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Full-screen "Form Preview" modal (Trainerize-style)                        */
/* -------------------------------------------------------------------------- */
function PreviewModal({ form, onClose }: { form: CoachForm; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm scroll-thin" onClick={onClose}>
      <div
        className="my-6 w-full max-w-2xl rounded-2xl border border-ink-200/70 bg-ink-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-200/60 px-5 py-4">
          <span className="text-sm font-semibold text-ink-500">Form Preview</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 hover:bg-ink-50 hover:text-ink-700"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-8 sm:px-10">
          <h2 className="text-center text-2xl font-bold text-ink-900">{form.name}</h2>
          {form.description && (
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-ink-500">{form.description}</p>
          )}
          <div className="mt-8 space-y-7">
            {form.fields.map((f) => (
              <FieldPreview key={f.id} field={f} />
            ))}
          </div>
          <button type="button" disabled className="btn-primary mt-9 w-full cursor-default opacity-90">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                        */
/* -------------------------------------------------------------------------- */
export default function FormBuilderPage() {
  const app = useApp();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("Weekly check-in");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<DraftField[]>([newField()]);
  const [preview, setPreview] = useState<CoachForm | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  if (!app.hydrated) return <Loading />;

  function patchField(id: string, patch: Partial<DraftField>) {
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

  function startBlank() {
    setEditingId(null);
    setName("Weekly check-in");
    setDescription("");
    setFields([newField()]);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Load a template (always creates a NEW form) or a saved form (edits in place).
  function loadForm(form: CoachForm, asEdit: boolean) {
    setEditingId(asEdit ? form.id : null);
    setName(asEdit ? form.name : `${form.name} (copy)`);
    setDescription(form.description ?? "");
    setFields(toDraft(form.fields));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveForm() {
    const cleaned = toStored(fields);
    if (!cleaned.length) return;
    const payload = { name: name.trim() || "Untitled form", description: description.trim() || undefined, fields: cleaned };
    if (editingId) {
      app.updateForm(editingId, payload);
    } else {
      app.addForm(payload);
    }
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
    startBlank();
  }

  // The live form being assembled (for the preview button on the builder).
  const draftForm: CoachForm = {
    id: "draft",
    name: name.trim() || "Untitled form",
    description: description.trim() || undefined,
    fields: toStored(fields),
  };

  const savedForms = app.forms;

  return (
    <>
      <PageHeader
        title="Forms"
        subtitle="Use a ready-made template or build your own custom check-in & intake forms"
        action={
          <div className="flex items-center gap-2">
            {editingId && (
              <button type="button" className="btn-secondary" onClick={startBlank}>
                <Plus className="h-4 w-4" /> New form
              </button>
            )}
            <button type="button" className="btn-primary" onClick={saveForm}>
              {justSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {justSaved ? "Saved!" : editingId ? "Update form" : "Save form"}
            </button>
          </div>
        }
      />

      {/* ---- Templates gallery (Trainerize-style ready-made forms) ---- */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-brand-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
            Form templates
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prebuiltForms.map((form) => (
            <div key={form.id} className="card group flex flex-col p-4 transition hover:border-brand-500/40">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 text-brand-400">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900">{form.name}</p>
                  <p className="text-xs text-ink-500">{form.fields.length} questions</p>
                </div>
              </div>
              {form.description && (
                <p className="mt-3 line-clamp-2 text-sm text-ink-500">{form.description}</p>
              )}
              <div className="mt-4 flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => loadForm(form, false)}
                  className="btn-primary flex-1 px-3 py-2 text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Use template
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(form)}
                  className="btn-secondary px-3 py-2 text-xs"
                  aria-label={`Preview ${form.name}`}
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Builder + live preview ---- */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Builder */}
        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">{editingId ? "Edit form" : "Build form"}</p>
            {editingId && <span className="badge bg-amber-500/15 text-amber-400">Editing</span>}
          </div>

          <label className="block">
            <span className="label">Form name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekly check-in"
            />
          </label>

          <label className="block">
            <span className="label">Description <span className="font-normal text-ink-400">(optional)</span></span>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short note shown to your client at the top of the form"
            />
          </label>

          <div className="space-y-3">
            {fields.map((f, idx) => (
              <div key={f.id} className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-400">Question {idx + 1}</span>
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
                      aria-label="Remove question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  className="input mb-2"
                  value={f.label}
                  onChange={(e) => patchField(f.id, { label: e.target.value })}
                  placeholder="Question label, e.g. How was your energy this week?"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="input"
                    value={f.type}
                    onChange={(e) => patchField(f.id, { type: e.target.value as FormFieldType })}
                  >
                    {(Object.keys(typeLabels) as FormFieldType[]).map((t) => (
                      <option key={t} value={t}>{typeLabels[t]}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-100 px-3 text-sm text-ink-700">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => patchField(f.id, { required: e.target.checked })}
                      className="h-4 w-4 accent-brand-500"
                    />
                    Required
                  </label>
                </div>

                {needsOptions(f.type) && (
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
            <Plus className="h-4 w-4" /> Add question
          </button>
        </div>

        {/* Live preview */}
        <div className="card h-fit space-y-4 p-5 lg:sticky lg:top-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Live preview</p>
            <div className="flex items-center gap-2">
              <span className="badge bg-brand-500/15 text-brand-400">{draftForm.fields.length} questions</span>
              <button
                type="button"
                onClick={() => setPreview(draftForm)}
                disabled={draftForm.fields.length === 0}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
              >
                <Eye className="h-3.5 w-3.5" /> Full preview
              </button>
            </div>
          </div>

          <h3 className="text-lg font-bold text-ink-900">{draftForm.name}</h3>
          {draftForm.description && <p className="-mt-2 text-sm text-ink-500">{draftForm.description}</p>}

          {draftForm.fields.length === 0 ? (
            <p className="text-sm text-ink-400">Add a question to see it here.</p>
          ) : (
            <div className="space-y-5">
              {draftForm.fields.map((f) => (
                <FieldPreview key={f.id} field={f} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---- Saved forms (your library) ---- */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
          Your forms ({savedForms.length})
        </h2>
        {savedForms.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No saved forms yet"
            description="Use a template above or build your own, then hit Save form to add it to your library."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedForms.map((form) => (
              <div key={form.id} className="card flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900">{form.name}</p>
                      <p className="text-xs text-ink-500">{form.fields.length} questions</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => app.removeForm(form.id)}
                    className="rounded-md p-1.5 text-ink-400 transition hover:bg-rose-500/15 hover:text-rose-400"
                    aria-label="Delete form"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {form.fields.slice(0, 4).map((f) => (
                    <span key={f.id} className="badge bg-ink-100 text-ink-600">
                      {typeLabels[f.type]}
                    </span>
                  ))}
                  {form.fields.length > 4 && (
                    <span className="badge bg-ink-100 text-ink-500">+{form.fields.length - 4}</span>
                  )}
                </div>

                <div className="mt-4 flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreview(form)}
                    className="btn-secondary flex-1 px-3 py-2 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => loadForm(form, true)}
                    className="btn-secondary flex-1 px-3 py-2 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && <PreviewModal form={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
