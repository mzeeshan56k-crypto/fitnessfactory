"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Dumbbell, User, Shield, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const portals = [
  { id: "trainer", label: "Trainer portal", href: "/dashboard", icon: Dumbbell, match: "/dashboard" },
  { id: "client", label: "Client portal", href: "/client", icon: User, match: "/client" },
  { id: "admin", label: "Super Admin", href: "/admin", icon: Shield, match: "/admin" },
];

export function PortalSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current =
    portals.find((p) => pathname.startsWith(p.match)) ?? portals[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-300",
          compact && "px-2.5 py-1.5",
        )}
      >
        <current.icon className="h-4 w-4 text-brand-400" />
        {!compact && <span>{current.label}</span>}
        <ChevronDown className="h-4 w-4 text-ink-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-ink-100 bg-ink-100 p-1.5 shadow-soft">
            <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Switch portal
            </div>
            {portals.map((p) => (
              <Link
                key={p.id}
                href={p.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition",
                  p.id === current.id
                    ? "bg-brand-500/15 text-brand-400"
                    : "text-ink-700 hover:bg-ink-50",
                )}
              >
                <p.icon className="h-4 w-4" />
                <span className="flex-1">{p.label}</span>
                {p.id === current.id && <Check className="h-4 w-4" />}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
