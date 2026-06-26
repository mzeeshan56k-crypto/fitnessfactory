"use client";

import { useApp, useCurrentClient } from "@/lib/store";
import { CommunityFeed } from "@/components/CommunityFeed";

function initialsOf(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "ME";
}

export default function ClientCommunityPage() {
  const app = useApp();
  const client = useCurrentClient();

  if (!app.hydrated)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );

  const name = client?.name ?? "You";
  const avatar = client?.avatar ?? initialsOf(name);
  const id = client?.id ?? "me";

  return <CommunityFeed meId={id} meName={name} meAvatar={avatar} />;
}
