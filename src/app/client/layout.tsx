"use client";

import { ClientShell } from "@/components/client/ClientShell";
import { useApp, useCurrentClient } from "@/lib/store";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hydrated } = useApp();
  const client = useCurrentClient();
  return (
    <ClientShell
      clientName={hydrated && client ? client.name : "Member"}
      clientInitials={hydrated && client ? client.avatar : "—"}
    >
      {children}
    </ClientShell>
  );
}
