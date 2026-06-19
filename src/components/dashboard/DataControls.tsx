"use client";

import { useState } from "react";
import { Database, Trash2, Library } from "lucide-react";
import { useApp } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";

export function DataControls({ variant = "inline" }: { variant?: "inline" | "card" }) {
  const { loadStarterContent, resetAll, seeded, clients, exercises } = useApp();
  const [confirm, setConfirm] = useState<null | "reset">(null);

  const hasData = clients.length > 0 || exercises.length > 0;

  const buttons = (
    <div className="flex flex-wrap gap-3">
      <button onClick={() => loadStarterContent()} className="btn-primary">
        <Library className="h-4 w-4" /> Load starter content
      </button>
      <button
        onClick={() => setConfirm("reset")}
        disabled={!hasData && !seeded}
        className="btn border border-rose-200 text-rose-400 hover:bg-rose-500/15"
      >
        <Trash2 className="h-4 w-4" /> Clear all data
      </button>
    </div>
  );

  return (
    <>
      {variant === "card" ? (
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-brand-400" />
            <h3 className="font-semibold text-ink-900">Workspace data</h3>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Your data is stored locally in this browser. <strong className="text-ink-700">Load starter content</strong> to
            populate the pre-built exercise library, 20 workouts, 5 programs and 5 forms so you can start
            building right away — or clear everything to begin from scratch.
          </p>
          <div className="mt-4">{buttons}</div>
        </div>
      ) : (
        buttons
      )}

      <Modal
        open={confirm === "reset"}
        onClose={() => setConfirm(null)}
        title="Clear all data?"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
            <button
              className="btn border border-rose-200 bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => { resetAll(); setConfirm(null); }}
            >
              Yes, clear everything
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          This permanently removes all clients, programs, workouts and other data from
          this browser. This cannot be undone.
        </p>
      </Modal>
    </>
  );
}
