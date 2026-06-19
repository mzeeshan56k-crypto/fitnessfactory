"use client";

import { recoveryMuscles, recoveryHeatmap } from "@/lib/platform";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Intensity 0 (faint) → 4 (strong brand red).
const INTENSITY: string[] = [
  "bg-ink-100",
  "bg-brand-500/20",
  "bg-brand-500/40",
  "bg-brand-500/65",
  "bg-brand-600",
];

function cellClass(v: number) {
  const idx = Math.max(0, Math.min(4, Math.round(v)));
  return INTENSITY[idx];
}

export function FatigueHeatMap({
  muscles = recoveryMuscles,
  data = recoveryHeatmap,
}: {
  muscles?: string[];
  data?: number[][];
}) {
  return (
    <div>
      <div className="overflow-x-auto scroll-thin">
        <div className="min-w-[420px]">
          {/* Header row */}
          <div className="flex items-center gap-1.5">
            <div className="w-20 shrink-0" />
            {DAYS.map((d) => (
              <div
                key={d}
                className="flex-1 text-center text-[11px] font-medium text-ink-400"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Muscle rows */}
          <div className="mt-2 space-y-1.5">
            {muscles.map((muscle, r) => (
              <div key={muscle} className="flex items-center gap-1.5">
                <div className="w-20 shrink-0 truncate text-xs font-medium text-ink-600">
                  {muscle}
                </div>
                {DAYS.map((_, c) => {
                  const v = data[r]?.[c] ?? 0;
                  return (
                    <div
                      key={c}
                      title={`${muscle} · ${DAYS[c]} · fatigue ${v}/4`}
                      className={cn(
                        "h-7 flex-1 rounded-md transition",
                        cellClass(v),
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-ink-400">Areas of accumulated fatigue</p>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-ink-400">Less</span>
          {INTENSITY.map((c, i) => (
            <span key={i} className={cn("h-3 w-4 rounded-sm", c)} />
          ))}
          <span className="text-[11px] text-ink-400">More</span>
        </div>
      </div>
    </div>
  );
}
