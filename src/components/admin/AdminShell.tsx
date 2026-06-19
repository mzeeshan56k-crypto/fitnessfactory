"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, CreditCard, Megaphone, Workflow,
  ShieldCheck, Library, Menu, X, Bell,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { PortalSwitcher } from "@/components/PortalSwitcher";
import { AskAIButton } from "@/components/AIAssistant";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Identity & Access", icon: Users },
  { href: "/admin/billing", label: "Billing & Tiers", icon: CreditCard },
  { href: "/admin/communications", label: "Communications", icon: Megaphone },
  { href: "/admin/automation", label: "Automation", icon: Workflow },
  { href: "/admin/library", label: "Global Library", icon: Library },
  { href: "/admin/security", label: "Security & PII", icon: ShieldCheck },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-64 flex-col border-r border-ink-100 bg-black text-white">
      <div className="flex h-16 items-center gap-2 px-6">
        <Logo dark />
        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-200">
          Admin
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scroll-thin">
        {nav.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-brand-600 text-white" : "text-ink-500 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-3 text-xs text-ink-500">
          <div className="font-semibold text-white">Platform status</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-400" /> All systems operational
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-ink-50/40">
      <div className="hidden lg:block">
        <Nav />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-50/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <button
              className="absolute -right-12 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-ink-700"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <Nav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-ink-100 bg-ink-100/80 px-4 backdrop-blur-xl sm:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6 text-ink-700" />
          </button>
          <div className="hidden max-w-sm flex-1 sm:block">
            <AskAIButton />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <PortalSwitcher />
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-ink-100" />
            </button>
            <Avatar initials="FF" size="sm" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scroll-thin">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
