"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Dumbbell, Apple, CalendarDays,
  MessageSquare, LineChart, Sparkles, Settings, LogOut,
  TrafficCone, KanbanSquare, ClipboardList, FileSpreadsheet, UsersRound, Megaphone,
  ScanLine, HeartPulse, Library, GraduationCap, MessagesSquare,
  Search, ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Icon = React.ComponentType<{ className?: string }>;
type NavItem = { href: string; label: string; icon: Icon };
type NavGroup = { label: string; icon: Icon; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

const isGroup = (e: NavEntry): e is NavGroup => "items" in e;

// Grouped, collapsible navigation — mirrors Trainerize's "Master Libraries"
// style with categorized, expandable sections.
const nav: NavEntry[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  {
    label: "Master Libraries", icon: Library,
    items: [
      { href: "/dashboard/workouts", label: "Training", icon: Dumbbell },
      { href: "/dashboard/program-builder", label: "Program Builder", icon: ClipboardList },
      { href: "/dashboard/nutrition", label: "Nutrition", icon: Apple },
      { href: "/dashboard/form-builder", label: "Forms", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Coaching", icon: GraduationCap,
    items: [
      { href: "/dashboard/form-check", label: "Form Check", icon: ScanLine },
      { href: "/dashboard/auditing", label: "Auditing", icon: TrafficCone },
      { href: "/dashboard/progress", label: "Progress", icon: LineChart },
      { href: "/dashboard/recovery", label: "Recovery", icon: HeartPulse },
    ],
  },
  {
    label: "Scheduling", icon: CalendarDays,
    items: [
      { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/dashboard/kanban", label: "Workflow", icon: KanbanSquare },
    ],
  },
  {
    label: "Communication", icon: MessagesSquare,
    items: [
      { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
      { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  { href: "/dashboard/team", label: "Team", icon: UsersRound },
  { href: "/dashboard/ai-coach", label: "AI Co-Pilot", icon: Sparkles },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

function NavLink({
  item, onNavigate, nested = false,
}: {
  item: NavItem;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const isActive = useIsActive();
  const active = isActive(item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        nested && "py-2",
        active
          ? "bg-brand-500/15 text-brand-400"
          : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />
      )}
      <item.icon className={cn("shrink-0", nested ? "h-4 w-4" : "h-5 w-5")} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavGroupBlock({
  group, open, onToggle, onNavigate,
}: {
  group: NavGroup;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const isActive = useIsActive();
  const hasActive = group.items.some((it) => isActive(it.href));
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
          hasActive && !open
            ? "text-brand-400"
            : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
        )}
      >
        <group.icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 truncate text-left">{group.label}</span>
        <ChevronRight
          className={cn("h-4 w-4 shrink-0 text-ink-400 transition-transform duration-300", open && "rotate-90")}
        />
      </button>

      {/* Smoothly collapsible children (grid-rows trick) */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-3 mt-1 space-y-0.5 border-l border-ink-200/70 pl-3">
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} onNavigate={onNavigate} nested />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useApp();
  // Groups start expanded so every destination is visible at a glance; the
  // coach can collapse any group they don't use.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(nav.filter(isGroup).map((g) => [g.label, true])),
  );
  const [search, setSearch] = useState("");

  // Auto-expand whichever group contains the active route as you navigate.
  useEffect(() => {
    const active = nav.find(
      (e): e is NavGroup =>
        isGroup(e) &&
        e.items.some((it) =>
          it.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(it.href),
        ),
    );
    if (active) setOpenGroups((o) => (o[active.label] ? o : { ...o, [active.label]: true }));
  }, [pathname]);

  const toggle = (label: string) =>
    setOpenGroups((o) => ({ ...o, [label]: !o[label] }));

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/dashboard/clients?q=${encodeURIComponent(q)}` : "/dashboard/clients");
    onNavigate?.();
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-ink-100 bg-ink-100">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>

      {/* Find a client */}
      <div className="px-3 pb-3 pt-1">
        <form onSubmit={onSearch} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a client"
            aria-label="Find a client"
            className="w-full rounded-xl border border-ink-200 bg-ink-50 py-2.5 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/20"
          />
        </form>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 scroll-thin">
        {nav.map((entry) =>
          isGroup(entry) ? (
            <NavGroupBlock
              key={entry.label}
              group={entry}
              open={!!openGroups[entry.label]}
              onToggle={() => toggle(entry.label)}
              onNavigate={onNavigate}
            />
          ) : (
            <NavLink key={entry.href} item={entry} onNavigate={onNavigate} />
          ),
        )}
      </nav>

      <div className="border-t border-ink-100 p-3">
        <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
          Other
        </p>
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            pathname.startsWith("/dashboard/settings")
              ? "bg-brand-500/15 text-brand-400"
              : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
          )}
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
