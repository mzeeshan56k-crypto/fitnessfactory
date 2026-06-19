"use client";

import { useState } from "react";
import {
  Megaphone, Send, MessageSquare, Users2, Bell,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useApp } from "@/lib/store";

const audiences = ["All users", "All trainers", "All clients"] as const;
const channels = ["Push", "Email", "In-app"] as const;

const reachByAudience: Record<string, string> = {
  "All users": "189,390",
  "All trainers": "5,070",
  "All clients": "184,320",
};

const channelStatus = [
  { name: "1:1 messaging", icon: MessageSquare },
  { name: "Group threads", icon: Users2 },
  { name: "Push notifications", icon: Bell },
];

export default function CommunicationsPage() {
  const app = useApp();
  const [audience, setAudience] = useState<(typeof audiences)[number]>("All users");
  const [activeChannels, setActiveChannels] = useState<string[]>(["Push"]);
  const [message, setMessage] = useState("");

  function toggleChannel(c: string) {
    setActiveChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  function sendBroadcast() {
    if (!message.trim()) return;
    app.addBroadcast(message.trim(), audience);
    setMessage("");
    setActiveChannels(["Push"]);
    setAudience("All users");
  }

  return (
    <>
      <PageHeader
        title="Communications"
        subtitle="Reach the network across push, email and in-app channels"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-semibold text-ink-900">Compose broadcast</h2>
          <p className="text-sm text-ink-500">Send an announcement to a targeted audience</p>

          <div className="mt-5">
            <label className="label">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as (typeof audiences)[number])}
              className="input"
            >
              {audiences.map((a) => (
                <option key={a} value={a}>
                  {a} · {reachByAudience[a]} reach
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="label">Channels</label>
            <div className="flex flex-wrap gap-2">
              {channels.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleChannel(c)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    activeChannels.includes(c)
                      ? "bg-brand-600 text-white shadow-glow"
                      : "bg-ink-50 text-ink-600 hover:bg-ink-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="label">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Write your announcement…"
              className="input resize-none"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={sendBroadcast} disabled={!message.trim()} className="btn-primary">
              <Send className="h-4 w-4" /> Send broadcast
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-ink-900">Channels</h2>
          <p className="text-sm text-ink-500">Delivery infrastructure</p>
          <div className="mt-5 space-y-3">
            {channelStatus.map((c) => (
              <div key={c.name} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                  <c.icon className="h-5 w-5" />
                </span>
                <div className="flex-1 text-sm font-semibold text-ink-900">{c.name}</div>
                <span className="badge bg-accent-500/15 text-accent-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-500" /> Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6">
        <h2 className="font-semibold text-ink-900">Sent broadcasts</h2>
        <p className="text-sm text-ink-500">Recent announcements across the network</p>

        {!app.hydrated ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
          </div>
        ) : app.broadcasts.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-10 text-center text-sm text-ink-400">
            No broadcasts sent yet. Compose one above to reach your network.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {app.broadcasts.map((b) => (
              <div key={b.id} className="flex items-center gap-4 rounded-xl border border-ink-100 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                  <Megaphone className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink-900">{b.title}</div>
                  <div className="text-xs text-ink-500">{b.audience} · {b.reach} reached</div>
                </div>
                <span className="shrink-0 text-xs text-ink-400">{b.sent}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
