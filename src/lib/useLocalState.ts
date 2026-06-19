"use client";

import { useEffect, useState } from "react";

/**
 * useState that persists to localStorage (SSR-safe).
 * Lets the demo feel "real" — logged sets, messages, kanban moves,
 * approvals, biometrics etc. survive navigation and reloads.
 */
export function useLocalState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setState(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [key, state, hydrated]);

  return [state, setState, hydrated] as const;
}
