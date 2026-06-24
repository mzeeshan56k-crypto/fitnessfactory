"use client";

import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import type { Toast } from "@/lib/store";
import { cn } from "@/lib/utils";

const toneStyles: Record<Toast["tone"], { icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  success: { icon: CheckCircle2, cls: "border-accent-500/40 bg-accent-500/15 text-accent-300" },
  info: { icon: Info, cls: "border-brand-500/40 bg-brand-500/15 text-brand-300" },
  error: { icon: AlertTriangle, cls: "border-rose-500/40 bg-rose-500/15 text-rose-300" },
};

/**
 * Fixed, bottom-right stack of transient notifications. Gives instant feedback
 * when a coach assigns training (or any other action calls `notify`).
 */
export function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[min(92vw,22rem)] flex-col gap-2">
      {toasts.map((t) => {
        const { icon: Icon, cls } = toneStyles[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border bg-ink-100 px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur",
              "animate-[toastIn_0.18s_ease-out]",
              cls,
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1 text-ink-900">{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className="shrink-0 text-ink-400 transition hover:text-ink-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      <style jsx>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
