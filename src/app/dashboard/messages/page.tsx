"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Send, ExternalLink, Search, MessageSquare, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Modal";
import { useApp, useMyClients } from "@/lib/store";
import type { Conversation, Message } from "@/lib/data";
import { cn } from "@/lib/utils";

function lastMessage(c: Conversation | undefined): Message | undefined {
  if (!c) return undefined;
  return c.messages[c.messages.length - 1];
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export default function MessagesPage() {
  const app = useApp();
  const myClients = useMyClients();
  const [activeId, setActiveId] = useState<string>("");
  const [draft, setDraft] = useState("");

  // Build the left list: only my clients, plus any conversation for them.
  const list = useMemo(() => {
    if (!app.hydrated) return [] as { clientId: string; conversation?: Conversation }[];
    const byId = new Map(app.conversations.map((c) => [c.clientId, c]));
    return myClients.map((cl) => ({ clientId: cl.id, conversation: byId.get(cl.id) }));
  }, [app.hydrated, app.conversations, myClients]);

  // Default-select the first entry once hydrated.
  useEffect(() => {
    if (!app.hydrated) return;
    if (!activeId && list.length > 0) setActiveId(list[0].clientId);
  }, [app.hydrated, list, activeId]);

  if (!app.hydrated) return <Loading />;

  const activeClient = activeId ? myClients.find((c) => c.id === activeId) : undefined;
  const activeConvo = activeId
    ? app.conversations.find((c) => c.clientId === activeId)
    : undefined;

  function send() {
    const text = draft.trim();
    if (!text || !activeClient) return;
    app.sendMessage(activeClient.id, text, false);
    setDraft("");
  }

  return (
    <>
      <PageHeader title="Messages" subtitle="Stay in touch with your clients" />

      {myClients.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No clients yet"
          description="Add clients in the Clients page to message them."
        />
      ) : (
        <div className="card flex h-[calc(100vh-10rem)] overflow-hidden">
          {/* Conversation list */}
          <aside className="flex w-full max-w-xs flex-col border-r border-ink-100 sm:w-80">
            <div className="border-b border-ink-100 p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input className="input pl-9" placeholder="Search conversations" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin">
              {list.map(({ clientId, conversation }) => {
                const client = myClients.find((c) => c.id === clientId);
                if (!client) return null;
                const last = lastMessage(conversation);
                const isActive = clientId === activeId;
                const unread = conversation?.unread ?? 0;
                return (
                  <button
                    key={clientId}
                    onClick={() => setActiveId(clientId)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-ink-50 p-4 text-left transition hover:bg-ink-50",
                      isActive && "bg-brand-50/60 hover:bg-brand-50/60",
                    )}
                  >
                    <Avatar initials={client.avatar} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-ink-900">
                          {client.name}
                        </span>
                        <span className="shrink-0 text-[11px] text-ink-400">
                          {last?.time}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-ink-500">
                          {last
                            ? `${last.fromClient ? "" : "You: "}${last.text}`
                            : "No messages yet"}
                        </span>
                        {unread > 0 && (
                          <span className="badge shrink-0 bg-brand-600 text-white">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Active conversation */}
          <section className="flex min-w-0 flex-1 flex-col">
            {activeClient ? (
              <>
                {/* Header */}
                <header className="flex items-center justify-between gap-3 border-b border-ink-100 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar initials={activeClient.avatar} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-ink-900">
                        {activeClient.name}
                      </div>
                      <div className="truncate text-xs text-ink-500">
                        {activeClient.program}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/clients/${activeClient.id}`}
                    className="btn-secondary shrink-0"
                  >
                    View profile
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </header>

                {/* Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto scroll-thin bg-ink-50/40 p-4 sm:p-6">
                  {activeConvo && activeConvo.messages.length > 0 ? (
                    activeConvo.messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "flex flex-col",
                          m.fromClient ? "items-start" : "items-end",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                            m.fromClient
                              ? "rounded-bl-sm bg-ink-100 text-ink-900 ring-1 ring-ink-100"
                              : "rounded-br-sm bg-brand-600 text-white",
                          )}
                        >
                          {m.text}
                        </div>
                        <span className="mt-1 px-1 text-[11px] text-ink-400">
                          {m.time}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-ink-400">
                      No messages yet — say hello to {activeClient.name.split(" ")[0]}.
                    </div>
                  )}
                </div>

                {/* Composer */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  className="flex items-center gap-3 border-t border-ink-100 p-4"
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Message ${activeClient.name.split(" ")[0]}…`}
                    className="input flex-1"
                  />
                  <button type="submit" disabled={!draft.trim()} className="btn-primary">
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-ink-400">
                Select a client to start messaging
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
