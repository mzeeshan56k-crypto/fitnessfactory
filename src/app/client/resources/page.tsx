"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Play, Clock, BookOpen, Upload, Video, Share2, Instagram, Twitter, Facebook, Check,
} from "lucide-react";
import { useLocalState } from "@/lib/useLocalState";
import { courses, mediaVault, type MediaItem } from "@/lib/platform";

export default function ResourcesPage() {
  const [media, setMedia, mediaHydrated] = useLocalState<MediaItem[]>("ffkc-media", mediaVault);
  const [shared, setShared] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    const id = `mv-${Date.now()}`;
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const item: MediaItem = {
      id,
      title: file.name,
      type: "Form check",
      date,
      status: "Pending",
    };
    setMedia((m) => [item, ...m]);
  };

  const share = (network: string) => {
    setShared(network);
    window.setTimeout(() => setShared((cur) => (cur === network ? null : cur)), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <p className="text-sm text-brand-100">Learn, submit, celebrate</p>
        <h1 className="text-2xl font-bold">Resource Library</h1>
        <p className="mt-1 text-sm text-brand-100">
          Masterclasses, form-check reviews and your milestones.
        </p>
      </section>

      {/* Your courses */}
      <section>
        <h2 className="mb-3 font-semibold text-ink-900">Your courses</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <div key={c.id} className="card overflow-hidden">
              {/* Gradient header */}
              <div className={`relative flex h-28 items-end bg-gradient-to-br ${c.color} p-4`}>
                <span className="absolute right-3 top-3">
                  <span className="badge bg-white/20 text-white backdrop-blur">{c.category}</span>
                </span>
                <Link
                  href={`/client/resources/${c.id}`}
                  aria-label={`Open ${c.title}`}
                  className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 backdrop-blur transition hover:scale-105"
                >
                  <Play className="h-5 w-5 fill-white text-white" />
                </Link>
                <h3 className="relative z-10 text-sm font-bold leading-tight text-white">{c.title}</h3>
              </div>
              {/* Body */}
              <div className="p-4">
                <div className="flex items-center gap-3 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> {c.lessons} lessons
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {c.durationMin} min
                  </span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-ink-400">
                  <span>{c.progress}% complete</span>
                  <Link
                    href={`/client/resources/${c.id}`}
                    className="font-semibold text-brand-400 hover:text-brand-400"
                  >
                    {c.progress === 100 ? "Review" : "Continue"}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Media vault */}
      <section className="card p-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
            <Video className="h-4 w-4" />
          </span>
          <h2 className="font-semibold text-ink-900">Media vault — form checks</h2>
        </div>
        <p className="mb-4 text-sm text-ink-500">Submit lifts for review and track feedback.</p>

        {/* Dropzone-style upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/50 p-5 text-center transition hover:border-brand-300 hover:bg-brand-50/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
            <Upload className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-ink-800">Upload form check video</span>
          <span className="text-xs text-ink-400">MP4 or MOV · tap to add</span>
        </button>

        <div className="mt-4 space-y-2.5">
          {mediaHydrated &&
            media.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                  <Play className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink-900">{m.title}</div>
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <span className="badge bg-ink-100 text-ink-600">{m.type}</span>
                    {m.date}
                  </div>
                </div>
                <span
                  className={`badge ${
                    m.status === "Reviewed" ? "bg-accent-500/15 text-accent-400" : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {m.status}
                </span>
              </div>
            ))}
        </div>
      </section>

      {/* Share your milestone */}
      <section className="card p-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
            <Share2 className="h-4 w-4" />
          </span>
          <h2 className="font-semibold text-ink-900">Share your milestone</h2>
        </div>
        <p className="mb-4 text-sm text-ink-500">Celebrate the wins with your community.</p>

        {/* Milestone preview */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-center text-white shadow-glow">
          <div className="text-4xl">🔥</div>
          <div className="mt-2 text-xl font-bold">30-day streak</div>
          <div className="text-sm text-brand-100">A full month of showing up. Keep it rolling!</div>
        </div>

        {/* Share buttons */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <ShareButton
            icon={Instagram}
            label="Instagram"
            tint="text-pink-400 bg-pink-500/15 hover:bg-pink-500/20"
            onClick={() => share("Instagram")}
          />
          <ShareButton
            icon={Twitter}
            label="X"
            tint="text-ink-800 bg-ink-100 hover:bg-ink-200"
            onClick={() => share("X")}
          />
          <ShareButton
            icon={Facebook}
            label="Facebook"
            tint="text-blue-600 bg-blue-500/15 hover:bg-blue-100"
            onClick={() => share("Facebook")}
          />
        </div>

        {shared && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-accent-500/15 p-3 text-sm font-semibold text-accent-400">
            <Check className="h-4 w-4" /> Shared to {shared}! ✅
          </div>
        )}
      </section>
    </div>
  );
}

function ShareButton({
  icon: Icon,
  label,
  tint,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tint: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-semibold transition ${tint}`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
