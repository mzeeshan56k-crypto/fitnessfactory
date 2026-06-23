"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, UserPlus } from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { EmptyState } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

export default function ClientMessagesPage() {
  const app = useApp();
  const member = useCurrentClient();

  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const conversation = member
    ? app.conversations.find((c) => c.clientId === member.id)
    : undefined;
  const messages = conversation?.messages ?? [];
  const coachName = member?.coachName?.trim() || app.settings.trainerName?.trim() || "";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!app.hydrated)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );

  if (!member)
    return (
      <EmptyState
        icon={UserPlus}
        title="No client selected"
        description="Add a client in the Trainer portal, then preview their experience here."
        action={<Link href="/dashboard/clients" className="btn-primary">Go to Clients</Link>}
      />
    );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    const text = draft.trim();
    if (!text) return;

    // Real chat: the message goes to the trainer, who replies for real.
    app.sendMessage(member.id, text, true);
    setDraft("");
  }

  return (
    <div className="space-y-4">
      {/* Coach header */}
      <section className="card flex items-center gap-4 p-4">
        <div className="relative">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-glow">
            {(coachName || "Coach")
              .split(" ")
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-accent-500" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-ink-900">{coachName || "Your Coach"}</h1>
          <p className="text-xs text-ink-500">
            {app.settings.businessName?.trim() || "Fitness Factory KC"} · Usually replies in a few hours
          </p>
        </div>
      </section>

      {/* Message thread */}
      <section className="card flex h-[calc(100vh-16rem)] flex-col overflow-hidden">
        <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-ink-400">
              No messages yet. Say hi to your coach!
            </p>
          )}
          {messages.map((m) =>
            m.fromClient ? (
              // Member (you) — right aligned, brand bubble
              <div key={m.id} className="flex flex-col items-end">
                <div className="max-w-[78%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-sm text-white shadow-soft">
                  {m.text}
                </div>
                <span className="mt-1 pr-1 text-[11px] text-ink-400">{m.time}</span>
              </div>
            ) : (
              // Coach — left aligned, white/gray bubble with avatar
              <div key={m.id} className="flex items-end gap-2">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[10px] font-bold text-white">
                  AC
                </span>
                <div className="flex flex-col items-start">
                  <div className="max-w-[78%] rounded-2xl rounded-bl-md border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm text-ink-900">
                    {m.text}
                  </div>
                  <span className="mt-1 pl-1 text-[11px] text-ink-400">{m.time}</span>
                </div>
              </div>
            )
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-ink-100 bg-ink-100 p-3"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message Coach Alex…"
            className="input flex-1"
            aria-label="Message"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className={cn("btn-primary px-4")}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </section>
    </div>
  );
}
