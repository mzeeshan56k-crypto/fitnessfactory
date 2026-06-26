"use client";

import Link from "next/link";
import { Plus, Menu } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { PortalSwitcher } from "@/components/PortalSwitcher";
import { AskAIButton } from "@/components/AIAssistant";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";
import { useApp } from "@/lib/store";

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "FF"
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { settings } = useApp();
  const name = settings.trainerName?.trim() || "Coach";
  const business = settings.businessName?.trim() || "Fitness Factory KC";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-ink-100 bg-ink-100/80 px-4 backdrop-blur-xl sm:px-6">
      <button className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-6 w-6 text-ink-700" />
      </button>
      <div className="hidden max-w-md flex-1 sm:block">
        <AskAIButton />
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <PortalSwitcher />
        <Link href="/dashboard/clients?new=1" className="btn-primary hidden sm:inline-flex">
          <Plus className="h-4 w-4" /> Add client
        </Link>
        <ThemeToggle />
        <NotificationsBell />
        <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-ink-50">
          {settings.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.profilePhoto} alt={name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <Avatar initials={initialsOf(name)} size="sm" />
          )}
          <div className="hidden text-left sm:block">
            <div className="text-sm font-semibold leading-tight text-ink-900">{name}</div>
            <div className="text-xs text-ink-400">{business}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
