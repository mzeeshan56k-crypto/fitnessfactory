"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X, Send, Loader2, Settings, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { askAI, aiConfigured, type AIChatMessage } from "@/lib/ai";

const SUGGESTIONS = [
  "Write a 3-day full-body program for a beginner",
  "Draft a motivating weekly check-in message",
  "Suggest a 2,000 kcal high-protein meal plan",
  "How do I fix a client's plateau?",
];

export function AIAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useApp();
  const configured = aiConfigured(settings);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your Fitness Factory KC AI Copilot. Ask me to build programs, write check-ins, plan nutrition or analyze a client. " +
        "Connect your own OpenAI, Claude or Gemini key in Settings for live answers.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    const next: AIChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");

    if (!configured) {
      setTimeout(() => {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "AI isn't connected yet. Open **Settings → AI Copilot**, pick a provider " +
              "(OpenAI, Claude or Gemini) and paste your API key. Once connected, I'll generate programs, " +
              "meal plans and coaching replies live.",
          },
        ]);
      }, 400);
      return;
    }

    setLoading(true);
    try {
      const reply = await askAI(settings, next);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-ink-200 bg-ink-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-orange-500 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <div className="font-semibold text-ink-900">AI Copilot</div>
              <div className="text-xs text-ink-400">
                {configured ? `${settings.aiProvider} · ${settings.aiModel || "default"}` : "Not connected"}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 hover:bg-ink-200 hover:text-ink-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!configured && (
          <Link
            href="/dashboard/settings?tab=ai"
            onClick={onClose}
            className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-400 hover:bg-brand-500/20"
          >
            <Settings className="h-4 w-4" /> Connect your AI provider key to enable live answers
          </Link>
        )}

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 scroll-thin">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex gap-2.5"}>
              {m.role === "assistant" && (
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-orange-500 text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
              )}
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-2.5 text-sm text-white"
                    : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-800"
                }
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-ink-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {messages.length <= 1 && (
            <div className="space-y-2 pt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="block w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-left text-sm text-ink-600 transition hover:border-brand-500/40 hover:text-ink-900"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-ink-200 p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask the AI Copilot…"
              className="max-h-32 flex-1 resize-none rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/20"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-500 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** A top-bar trigger button + mounted assistant panel with ⌘K / ⌘J shortcut. */
export function AskAIButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "j")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          compact
            ? "flex items-center gap-2 rounded-full border border-ink-200 bg-ink-100 px-3 py-1.5 text-sm text-ink-500 hover:border-ink-300 hover:text-ink-900"
            : "flex w-full max-w-xs items-center gap-2 rounded-full border border-ink-200 bg-ink-100 px-3.5 py-2 text-sm text-ink-400 hover:border-ink-300"
        }
      >
        <Sparkles className="h-4 w-4 text-brand-400" />
        <span className={compact ? "" : "flex-1 text-left"}>Ask AI Assistant…</span>
        {!compact && <kbd className="rounded border border-ink-300 px-1.5 text-[10px] text-ink-400">⌘K</kbd>}
      </button>
      <AIAssistant open={open} onClose={() => setOpen(false)} />
    </>
  );
}
