"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Apple, CalendarDays,
  MessageSquare, LineChart, Sparkles, Settings, LogOut,
  TrafficCone, KanbanSquare, ClipboardList, FileSpreadsheet, UsersRound, Megaphone,
  ScanLine, HeartPulse, LibraryBig,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/auditing", label: "Auditing", icon: TrafficCone },
  { href: "/dashboard/workouts", label: "Master Libraries", icon: LibraryBig },
  { href: "/dashboard/form-check", label: "Form Check", icon: ScanLine },
  { href: "/dashboard/program-builder", label: "Program Builder", icon: ClipboardList },
  { href: "/dashboard/nutrition", label: "Nutrition", icon: Apple },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/kanban", label: "Workflow", icon: KanbanSquare },
  { href: "/dashboard/form-builder", label: "Form Builder", icon: FileSpreadsheet },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/progress", label: "Progress", icon: LineChart },
  { href: "/dashboard/recovery", label: "Recovery", icon: HeartPulse },
  { href: "/dashboard/team", label: "Team", icon: UsersRound },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/ai-coach", label: "AI Co-Pilot", icon: Sparkles },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { signOut } = useApp();
  return (
    <aside className="flex h-full w-64 flex-col border-r border-ink-100 bg-ink-100">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scroll-thin">
        {nav.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-brand-500/15 text-brand-400"
                  : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-ink-100 p-3">
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
        >
          <Settings className="h-5 w-5" /> Settings
        </Link>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-rose-500/15 hover:text-rose-400"
        >
          <LogOut className="h-5 w-5" /> Log out
        </button>
      </div>
    </aside>
  );
}
