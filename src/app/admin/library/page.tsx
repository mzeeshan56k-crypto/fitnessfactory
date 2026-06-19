"use client";

import { useState } from "react";
import {
  Plus, Dumbbell, GraduationCap, Clock, BookOpen, Pencil, Upload, Trash2, CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { useApp } from "@/lib/store";
import { useLocalState } from "@/lib/useLocalState";
import { courses as seedCourses, type Course } from "@/lib/platform";

const colorPresets = ["from-brand-500 to-brand-700", "from-accent-400 to-accent-600", "from-purple-500 to-indigo-600", "from-amber-400 to-orange-500"];

export default function LibraryPage() {
  const app = useApp();

  // Courses are platform content — managed here, persisted locally.
  const [courses, setCourses, coursesHydrated] = useLocalState<Course[]>("ffkc-admin-courses", seedCourses);
  const [published, setPublished, pubHydrated] = useLocalState<string[]>("ffkc-published-courses", []);

  const [assetModal, setAssetModal] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Training");
  const [lessons, setLessons] = useState("8");
  const [duration, setDuration] = useState("60");

  function openNew() {
    setEditing(null);
    setTitle(""); setCategory("Training"); setLessons("8"); setDuration("60");
    setAssetModal(true);
  }
  function openEdit(c: Course) {
    setEditing(c);
    setTitle(c.title); setCategory(c.category); setLessons(String(c.lessons)); setDuration(String(c.durationMin));
    setAssetModal(true);
  }
  function saveAsset() {
    if (!title.trim()) return;
    if (editing) {
      setCourses((prev) => prev.map((c) => c.id === editing.id
        ? { ...c, title: title.trim(), category, lessons: Number(lessons) || 0, durationMin: Number(duration) || 0 }
        : c));
    } else {
      const c: Course = {
        id: `co_${Math.random().toString(36).slice(2, 8)}`,
        title: title.trim(), category, lessons: Number(lessons) || 0,
        durationMin: Number(duration) || 0, progress: 0,
        color: colorPresets[courses.length % colorPresets.length],
      };
      setCourses((prev) => [c, ...prev]);
    }
    setAssetModal(false);
  }
  function removeCourse(id: string) {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setPublished((prev) => prev.filter((p) => p !== id));
  }
  function togglePublish(id: string) {
    setPublished((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }

  if (!app.hydrated || !coursesHydrated || !pubHydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Global library"
        subtitle="Master content library shared across every facility and coach"
        action={
          <button className="btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" /> Add asset
          </button>
        }
      />

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
              <Dumbbell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-ink-900">Exercise library</h2>
              <p className="text-sm text-ink-500">
                {app.exercises.length} master exercise{app.exercises.length === 1 ? "" : "s"} synced from coaches
              </p>
            </div>
          </div>
          <span className="badge bg-ink-100 text-ink-700">Synced to all coaches</span>
        </div>

        {app.exercises.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-5 text-center text-sm text-ink-500">
            No exercises in the global library yet. Coaches add exercises from the Training section,
            or use Load starter content in Settings → Data.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {app.exercises.slice(0, 12).map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                  <Dumbbell className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink-900">{e.name}</div>
                  <div className="text-xs text-ink-500">{e.muscle}{e.video ? " · video" : ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-ink-900">Educational courses</h2>
            <p className="text-sm text-ink-500">Published curriculum available to the network</p>
          </div>
        </div>

        {courses.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No courses yet"
            description="Add your first educational course to the global library."
            action={<button className="btn-primary" onClick={openNew}><Plus className="h-4 w-4" /> Add asset</button>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((c) => {
              const isPub = published.includes(c.id);
              return (
                <div key={c.id} className="card overflow-hidden">
                  <div className={`h-2 w-full bg-gradient-to-r ${c.color}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-ink-900">{c.title}</h3>
                      <span className={`badge shrink-0 ${isPub ? "bg-accent-500/15 text-accent-400" : "bg-brand-500/15 text-brand-400"}`}>
                        {isPub ? "Published" : c.category}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-ink-500">
                      <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {c.lessons} lessons</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {c.durationMin} min</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button className="btn-secondary flex-1" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                      <button
                        className={isPub ? "btn-secondary flex-1" : "btn-primary flex-1"}
                        onClick={() => togglePublish(c.id)}
                      >
                        {isPub ? <><CheckCircle2 className="h-4 w-4" /> Unpublish</> : <><Upload className="h-4 w-4" /> Publish</>}
                      </button>
                      <button
                        onClick={() => removeCourse(c.id)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-rose-500/15 hover:text-rose-400"
                        aria-label="Delete course"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Modal
        open={assetModal}
        onClose={() => setAssetModal(false)}
        title={editing ? "Edit course" : "Add course asset"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAssetModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveAsset} disabled={!title.trim()}>
              {editing ? "Save changes" : "Add to library"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Foundations of Strength" autoFocus />
          </Field>
          <Field label="Category">
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {["Training", "Nutrition", "Recovery", "Lifestyle"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Lessons">
              <input className="input" type="number" value={lessons} onChange={(e) => setLessons(e.target.value)} />
            </Field>
            <Field label="Duration (min)">
              <input className="input" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </Field>
          </div>
        </div>
      </Modal>
    </>
  );
}
