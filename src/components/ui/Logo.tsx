import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-orange-500 shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
          <path
            d="M6.5 9v6M9.5 7v10M14.5 7v10M17.5 9v6M4 12h2M18 12h2"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          "text-lg font-bold tracking-tight",
          dark ? "text-white" : "text-ink-900",
        )}
      >
Fitness Factory <span className="text-brand-400">KC</span>
      </span>
    </Link>
  );
}
