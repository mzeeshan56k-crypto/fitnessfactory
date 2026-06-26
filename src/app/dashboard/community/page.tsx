"use client";

import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useApp } from "@/lib/store";
import { CommunityFeed } from "@/components/CommunityFeed";

function initialsOf(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "ME";
}

export default function DashboardCommunityPage() {
  const app = useApp();

  if (!app.hydrated) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const name = app.settings.trainerName || app.session?.name || "Coach";
  const avatar = initialsOf(name);
  // Must match the id the store records in likedBy for staff (session email).
  const meId = app.session?.email ?? "coach";

  return (
    <>
      <PageHeader
        title="Community"
        subtitle="Post wins and announcements — every client sees this shared feed"
      />
      <CommunityFeed meId={meId} meName={name} meAvatar={avatar} canDelete />
    </>
  );
}
