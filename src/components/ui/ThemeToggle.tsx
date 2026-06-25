"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useApp, type ThemeName } from "@/lib/store";

/** One-tap toggle between the Midnight (dark) and Trainerize (light) themes. */
export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useApp();
  const [theme, setLocal] = useState<ThemeName>("midnight");

  useEffect(() => {
    const t = (document.documentElement.dataset.theme as ThemeName) || "midnight";
    setLocal(t === "trainerize" ? "trainerize" : "midnight");
  }, []);

  const next: ThemeName = theme === "midnight" ? "trainerize" : "midnight";
  return (
    <button
      type="button"
      onClick={() => { setTheme(next); setLocal(next); }}
      className={className ?? "flex h-10 w-10 items-center justify-center rounded-full text-ink-600 transition hover:bg-ink-50"}
      title={`Switch to ${next === "trainerize" ? "Trainerize light" : "Midnight"} theme`}
      aria-label="Toggle theme"
    >
      {theme === "midnight" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
