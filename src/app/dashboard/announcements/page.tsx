"use client";

import { useState } from "react";
import {
  Loader2, Megaphone, Send, Users, UsersRound, Globe, Pin,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/ui/Modal";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const audiences = [
  { value: "All clients", icon: Users },
  { value: "All team", icon: UsersRound },
  { value: "Everyone", icon: Globe },
];

const audienceBadge: Record<string, string> = {
  "All clients": "bg-brand-500/15 text-brand-400",
  "All team": "bg-indigo-500/15 text-indigo-400",
  Everyone: "bg-accent-500/15 text-accent-400",
};

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export default function AnnouncementsPage() {
  const app = useApp();
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("All clients");
  const [message, setMessage] = useState("");

  if (!app.hydrated) return <Loading />;

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    app.addBroadcast(title.trim(), audience);
    setTitle("");
    setMessage("");
    setAudience("All clients");
  }

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Broadcast updates to your clients and team"
      />

      {/* Pinned tip */}
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
          <Pin className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">Pinned tip</p>
          <p className="text-sm text-ink-600">
            Keep announcements short and action-oriented — they appear at the top of every recipient&apos;s feed.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        {/* Compose */}
        <form onSubmit={send} className="card h-fit space-y-4 p-5">
          <p className="eyebrow">Compose</p>

          <label className="block">
            <span className="label">Title</span>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New program drop this Monday"
              required
            />
          </label>

          <div className="block">
            <span className="label">Audience</span>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {audiences.map((a) => {
                const Icon = a.icon;
                const active = audience === a.value;
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAudience(a.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition",
                      active
                        ? "border-brand-500 bg-brand-500/15 text-brand-400"
                        : "border-ink-200 bg-ink-100 text-ink-600 hover:border-ink-300 hover:bg-ink-50",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {a.value}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="label">Message</span>
            <textarea
              className="input min-h-[120px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share the details of your announcement…"
            />
          </label>

          <button type="submit" className="btn-primary w-full">
            <Send className="h-4 w-4" />
            Send announcement
          </button>
        </form>

        {/* Sent list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
              Sent ({app.broadcasts.length})
            </h2>
          </div>

          {app.broadcasts.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              description="Your broadcasts will show up here. Compose one on the left to get started."
            />
          ) : (
            <div className="space-y-3">
              {app.broadcasts.map((b) => (
                <div key={b.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                      <Megaphone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink-900">{b.title}</p>
                        <span className={cn("badge", audienceBadge[b.audience] ?? "bg-ink-100 text-ink-600")}>
                          {b.audience}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-400">
                        <span>Sent {b.sent}</span>
                        <span>Reach: {b.reach}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
