"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft, Clock, BookOpen, Play, FileText, HelpCircle, Check,
  CheckCircle2, ArrowRight,
} from "lucide-react";
import { courses, courseLessons, type Lesson } from "@/lib/platform";
import { sampleVideo, toEmbedUrl } from "@/lib/media";
import { useLocalState } from "@/lib/useLocalState";
import { cn } from "@/lib/utils";

function LessonVideo({ lesson }: { lesson: Lesson }) {
  const src = lesson.video || sampleVideo(lesson.id);
  const embed = toEmbedUrl(src);
  if (embed) {
    return (
      <iframe
        key={lesson.id}
        src={embed}
        title={lesson.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full bg-black"
      />
    );
  }
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video key={lesson.id} src={src} controls playsInline className="aspect-video w-full bg-black" />
  );
}

const typeMeta: Record<
  Lesson["type"],
  { icon: React.ComponentType<{ className?: string }>; badge: string }
> = {
  Video: { icon: Play, badge: "bg-brand-500/15 text-brand-400" },
  Article: { icon: FileText, badge: "bg-purple-500/15 text-purple-400" },
  Quiz: { icon: HelpCircle, badge: "bg-amber-500/15 text-amber-400" },
};

export default function Page({ params }: { params: { id: string } }) {
  const course = courses.find((c) => c.id === params.id);
  if (!course) notFound();
  const c = course;

  const lessons = courseLessons[c.id] ?? [];

  const [completed, setCompleted, hydrated] = useLocalState<string[]>(
    `ffkc-course-${c.id}`,
    [],
  );
  const [selectedId, setSelectedId] = useState<string>(lessons[0]?.id ?? "");

  const selectedIndex = Math.max(
    0,
    lessons.findIndex((l) => l.id === selectedId),
  );
  const selectedLesson = lessons[selectedIndex];

  const total = lessons.length;
  const doneCount = lessons.filter((l) => completed.includes(l.id)).length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const isDone = (id: string) => completed.includes(id);

  const markCompleteAndNext = () => {
    if (!selectedLesson) return;
    setCompleted((prev) =>
      prev.includes(selectedLesson.id) ? prev : [...prev, selectedLesson.id],
    );
    const next = lessons[selectedIndex + 1];
    if (next) setSelectedId(next.id);
  };

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        href="/client/resources"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ChevronLeft className="h-4 w-4" /> Resource library
      </Link>

      {/* Course header */}
      <section className={cn("overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-glow", c.color)}>
        <span className="badge bg-white/15 text-white backdrop-blur">{c.category}</span>
        <h1 className="mt-2 text-2xl font-bold leading-tight">{c.title}</h1>
        <div className="mt-1 flex items-center gap-3 text-sm text-white/80">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" /> {total} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> {c.durationMin} min
          </span>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>{doneCount} of {total} complete</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-ink-100/80 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Player */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card overflow-hidden">
            {selectedLesson ? (
              <>
                <LessonVideo lesson={selectedLesson} />
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="eyebrow">
                        Lesson {selectedIndex + 1} of {total}
                      </div>
                      <h2 className="mt-1 text-lg font-bold text-ink-900">
                        {selectedLesson.title}
                      </h2>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-500">
                        <span className={cn("badge", typeMeta[selectedLesson.type].badge)}>
                          {selectedLesson.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {selectedLesson.durationMin} min
                        </span>
                      </div>
                    </div>
                    {isDone(selectedLesson.id) && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-accent-400">
                        <CheckCircle2 className="h-5 w-5" /> Completed
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={markCompleteAndNext}
                    className="btn-primary mt-4 w-full sm:w-auto"
                  >
                    {selectedIndex + 1 < total ? (
                      <>
                        <Check className="h-4 w-4" /> Mark complete &amp; next
                        <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Mark complete
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-sm text-ink-400">
                No lessons available for this course yet.
              </div>
            )}
          </div>
        </div>

        {/* Lesson list */}
        <div className="card p-4 lg:col-span-1">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-ink-900">Lessons</h2>
            <span className="badge bg-ink-100 text-ink-600">
              {doneCount}/{total}
            </span>
          </div>
          <div className="space-y-2">
            {lessons.map((l, i) => {
              const active = l.id === selectedId;
              const done = hydrated && isDone(l.id);
              const TypeIcon = typeMeta[l.type].icon;
              return (
                <button
                  key={l.id}
                  onClick={() => setSelectedId(l.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                    active
                      ? "border-brand-300 bg-brand-50/60"
                      : "border-ink-100 hover:border-brand-200 hover:bg-brand-50/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      done
                        ? "bg-accent-500 text-white"
                        : active
                          ? "bg-brand-500 text-white"
                          : "bg-ink-100 text-ink-500",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink-900">
                      {l.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
                          typeMeta[l.type].badge,
                        )}
                      >
                        <TypeIcon className="h-3 w-3" /> {l.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {l.durationMin}m
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
