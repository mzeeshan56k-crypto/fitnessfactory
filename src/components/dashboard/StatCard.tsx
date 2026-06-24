import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  positive = true,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  positive?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
          <Icon className="h-5 w-5" />
        </span>
        {delta && (
          <span
            className={cn(
              "badge",
              positive ? "bg-accent-500/15 text-accent-400" : "bg-rose-500/15 text-rose-400",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4 text-2xl font-bold text-ink-900">{value}</div>
      <div className="mt-1 text-sm text-ink-500">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-400">{hint}</div>}
    </div>
  );
}
