"use client";

import { Play, ExternalLink, FileText } from "lucide-react";
import type { TrainingMedia } from "@/lib/data";

/** Turns common video links into an embeddable URL; returns null if we can't. */
function toEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (host.endsWith("loom.com") && u.pathname.includes("/share/")) {
      return url.replace("/share/", "/embed/");
    }
    return null;
  } catch {
    return null;
  }
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export function MediaGallery({ media }: { media?: TrainingMedia[] }) {
  if (!media || media.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {media.map((m) => {
        if (m.type === "image") {
          return (
            <div key={m.id} className="overflow-hidden rounded-2xl border border-ink-200 bg-ink-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.caption || "Training image"} className="w-full object-cover" />
            </div>
          );
        }
        if (m.type === "pdf") {
          return (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-ink-50/60 p-4 transition hover:border-brand-300"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500">
                <FileText className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink-900">{m.name || "View PDF"}</span>
                <span className="block text-xs text-ink-400">Tap to open</span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-ink-400" />
            </a>
          );
        }
        const embed = toEmbed(m.url);
        if (embed) {
          return (
            <div key={m.id} className="overflow-hidden rounded-2xl border border-ink-200 bg-black">
              <iframe
                src={embed}
                title="Training video"
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        if (isDirectVideo(m.url)) {
          return (
            <div key={m.id} className="overflow-hidden rounded-2xl border border-ink-200 bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={m.url} controls className="aspect-video w-full" />
            </div>
          );
        }
        // Unknown link → show a tappable card.
        return (
          <a
            key={m.id}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-ink-50/60 p-4 transition hover:border-brand-300"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
              <Play className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink-900">Watch video</span>
              <span className="block truncate text-xs text-ink-400">{m.url}</span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-ink-400" />
          </a>
        );
      })}
    </div>
  );
}
