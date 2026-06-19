import { cn } from "@/lib/utils";
import { avatarColors } from "@/lib/data";

export function Avatar({
  initials,
  size = "md",
  className,
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };
  const color = avatarColors[initials] ?? "bg-brand-500";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-ink-100",
        sizes[size],
        color,
        className,
      )}
    >
      {initials}
    </div>
  );
}
