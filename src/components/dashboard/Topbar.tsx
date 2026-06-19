"use client";

import Link from "next/link";
import { Bell, Plus, Menu } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { PortalSwitcher } from "@/components/PortalSwitcher";
import { AskAIButton } from "@/components/AIAssistant";

export function Topbar({ onMenu }: { onMenu: () => void }) {
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
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-ink-100" />
        </button>
        <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-ink-50">
          <Avatar initials="AC" size="sm" />
          <div className="hidden text-left sm:block">
            <div className="text-sm font-semibold leading-tight text-ink-900">Alex Coach</div>
            <div className="text-xs text-ink-400">Head Trainer</div>
          </div>
        </div>
      </div>
    </header>
  );
}
