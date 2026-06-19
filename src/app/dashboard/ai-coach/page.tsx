"use client";

import { useRef, useState } from "react";
import {
  Sparkles, Send, Check, X, Pencil, ShieldCheck,
  Dumbbell, ClipboardCheck, LineChart, AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import type { AISuggestion } from "@/lib/platform";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/* --------------------------- Suggestion config -------------------------- */

const typeStyles: Record<AISuggestion["type"], string> = {
  Program: "bg-brand-500/15 text-brand-400",
  Nutrition: "bg-amber-500/15 text-amber-400",
  Recovery: "bg-purple-500/15 text-purple-400",
  Message: "bg-accent-500/15 text-accent-400",
};

/* ------------------------------- Chat config ---------------------------- */

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}

const quickActions = [
  { id: "trends", icon: LineChart, label: "Analyze progress trends", prompt: "Analyze progress trends across my roster this month." },
  { id: "program", icon: Dumbbell, label: "Optimize a program", prompt: "Optimize a program — build a periodized training block for an intermediate client." },
  { id: "checkin", icon: ClipboardCheck, label: "Draft a check-in", prompt: "Draft a friendly weekly check-in message for a consistent client." },
  { id: "atrisk", icon: AlertTriangle, label: "Find at-risk clients", prompt: "Find at-risk clients and tell me who needs attention." },
];

function generateReply(input: string): string {
  const text = input.toLowerCase();

  if (text.includes("optimize") || text.includes("program") || text.includes("split") || text.includes("periodiz")) {
    return [
      "Here's a 4-week periodized block you can assign right away:",
      "",
      "Week 1 — Accumulation (volume): 4×8 @ RPE 7",
      "Week 2 — Accumulation+ : 4×8 @ RPE 8, +2.5–5 lb",
      "Week 3 — Intensification : 5×5 @ RPE 8–9",
      "Week 4 — Deload : 3×5 @ RPE 6, −40% volume",
      "",
      "Anchor lifts: Back Squat, Bench Press, Deadlift. Add 2 accessory slots per session for weak points. Want me to map this to a specific client's current numbers?",
    ].join("\n");
  }

  if (text.includes("at risk") || text.includes("at-risk") || text.includes("drop") || text.includes("attention")) {
    return [
      "Scanning your traffic-light board, two clients are flagged red:",
      "",
      "• Liam Patel — 12% workout, 0% diet logging. Never completed onboarding. Action: welcome call + intake today.",
      "• Noah Kim — inactive 3 weeks, habit streak broken. Action: re-engagement call to reset the plan.",
      "",
      "Two more are on the watch list (Sofia, Ava) with slipping nutrition. Want me to draft outreach messages for the red flags?",
    ].join("\n");
  }

  if (text.includes("trend") || text.includes("analyz") || text.includes("progress") || text.includes("summar")) {
    return [
      "Roster-wide trends this month:",
      "",
      "• Workout compliance: 88% (steady, strongest signal)",
      "• Diet logging: 81% (dips on weekends — worth a template)",
      "• Habits: 76% (sleep streaks are the soft spot)",
      "",
      "Top performer: Emma Wilson (95%+ across the board — request a testimonial). Biggest drag: weekend nutrition adherence. Want a deeper dive on any single metric?",
    ].join("\n");
  }

  if (text.includes("check-in") || text.includes("checkin") || text.includes("message") || text.includes("draft")) {
    return [
      "Here's a warm weekly check-in you can send:",
      "",
      "\"Hey! Incredible week — you hit every session and your consistency is really showing. How are recovery and energy feeling? If you're up for it we can nudge the working weights slightly next week. Proud of you 💪\"",
      "",
      "Want a gentler version for a client who missed a few sessions?",
    ].join("\n");
  }

  if (text.includes("meal") || text.includes("nutrition") || text.includes("diet")) {
    return [
      "Here's a high-protein day at ~1,900 kcal (180g protein):",
      "",
      "• Breakfast — Egg white omelette, oats & berries (430 kcal)",
      "• Lunch — Grilled chicken, quinoa, greens (560 kcal)",
      "• Snack — Greek yogurt + almonds (280 kcal)",
      "• Dinner — Baked salmon, sweet potato, broccoli (580 kcal)",
      "",
      "High protein preserves muscle in a deficit. I can swap meals for any dietary restrictions.",
    ].join("\n");
  }

  return [
    "I'm your AI co-pilot — I can analyze roster trends, optimize programs, draft client messages, and surface at-risk clients.",
    "",
    "Tell me a client, goal, or metric and I'll give you something you can action right away.",
  ].join("\n");
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `m${idCounter}`;
}

/* -------------------------------- Page ---------------------------------- */

export default function AiCoachPage() {
  const app = useApp();
  const suggestions = app.aiSuggestions;
  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      role: "assistant",
      text: "Hi 👋 I'm your AI co-pilot. I can analyze progress trends, optimize programs, draft check-ins, and flag at-risk clients. What would you like to work on?",
    },
  ]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function send(raw?: string) {
    const value = (raw ?? input).trim();
    if (!value) return;
    const userMsg: ChatMessage = { id: nextId(), role: "user", text: value };
    const assistantMsg: ChatMessage = { id: nextId(), role: "assistant", text: generateReply(value) };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  }

  return (
    <>
      <PageHeader
        title="AI Co-Pilot"
        subtitle="AI-drafted corrections, reviewed and approved by you"
      />

      {/* Suggestions awaiting approval */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-400" />
          <h2 className="font-semibold text-ink-900">Suggestions awaiting approval</h2>
        </div>
        <span className="badge bg-brand-500/15 text-brand-400">{pendingCount} pending</span>
      </div>

      {!app.hydrated ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-400">
            <Sparkles className="h-6 w-6" />
          </span>
          <p className="mt-4 max-w-sm text-sm text-ink-500">
            No AI suggestions yet — load example data to see this in action.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {suggestions.map((s) => {
            const client = app.clients.find((c) => c.id === s.clientId);
            const resolved = s.status !== "pending";
            const approved = s.status === "approved";
            const dismissed = s.status === "dismissed";

            return (
              <div
                key={s.id}
                className={cn(
                  "card flex flex-col p-5 transition",
                  approved && "border-accent-200 bg-accent-50/40 ring-1 ring-accent-100",
                  dismissed && "opacity-55",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("badge", typeStyles[s.type])}>{s.type}</span>
                    {approved && (
                      <span className="badge bg-accent-500/20 text-accent-400">
                        <Check className="h-3 w-3" /> Approved
                      </span>
                    )}
                    {dismissed && <span className="badge bg-ink-100 text-ink-500">Dismissed</span>}
                  </div>
                  {client && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-ink-600">{client.name}</span>
                      <Avatar initials={client.avatar} size="sm" />
                    </div>
                  )}
                </div>

                <h3 className="mt-3 font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-500">
                  <span className="font-medium text-ink-600">Why: </span>
                  {s.rationale}
                </p>

                <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
                    Drafted change
                  </div>
                  <p className="text-sm leading-relaxed text-ink-700">{s.draft}</p>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-ink-500">AI confidence</span>
                    <span className="font-semibold tabular-nums text-ink-700">{s.confidence}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-ink-100">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        s.confidence >= 85 ? "bg-accent-500" : s.confidence >= 75 ? "bg-amber-500" : "bg-rose-500",
                      )}
                      style={{ width: `${s.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {resolved ? (
                    <button
                      type="button"
                      onClick={() => app.resolveSuggestion(s.id, "pending")}
                      className="btn-ghost px-3 py-1.5 text-xs"
                    >
                      Undo
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => app.resolveSuggestion(s.id, "approved")}
                        className="btn-primary px-4 py-1.5 text-xs"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => send(`Edit this draft for ${client?.name ?? "the client"}: ${s.draft}`)}
                        className="btn-secondary px-3 py-1.5 text-xs"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => app.resolveSuggestion(s.id, "dismissed")}
                        className="btn-ghost px-3 py-1.5 text-xs"
                      >
                        <X className="h-3.5 w-3.5" /> Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI chat */}
      <div className="mt-8 mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand-400" />
        <h2 className="font-semibold text-ink-900">Ask your co-pilot</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickActions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              setInput(a.prompt);
              inputRef.current?.focus();
            }}
            className="flex items-center gap-2 rounded-full border border-ink-200 bg-ink-100 px-3.5 py-1.5 text-sm font-medium text-ink-700 transition hover:border-brand-200 hover:bg-brand-500/15 hover:text-brand-400"
          >
            <a.icon className="h-4 w-4" /> {a.label}
          </button>
        ))}
      </div>

      <div className="mt-4 card flex h-[520px] flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold text-ink-900">AI Co-Pilot</div>
            <div className="text-xs text-accent-400">Online · ready to help</div>
          </div>
        </div>

        <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex items-end gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "assistant" && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-500 text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
              )}
              <div
                className={cn(
                  "max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "rounded-br-md bg-brand-600 text-white"
                    : "rounded-bl-md bg-ink-50 text-ink-800",
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-3 border-t border-ink-100 p-4"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI co-pilot anything…"
            className="input flex-1"
          />
          <button type="submit" className="btn-primary" disabled={!input.trim()}>
            <Send className="h-4 w-4" /> Send
          </button>
        </form>
      </div>
    </>
  );
}
