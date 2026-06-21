import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/storage";
import { getSessionUser } from "@/lib/auth/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Single-gym workspace document. Coaches/owner/admin read & write the whole
// record; members receive a scoped copy of only their own data.
const WORKSPACE_KEY = "ffkc:workspace";

interface Workspace {
  clients?: { id: string; email: string }[];
  conversations?: { clientId: string }[];
  appointments?: { clientId: string }[];
  checkins?: { clientId: string }[];
  clientPlans?: Record<string, unknown>;
  completions?: Record<string, unknown>;
  photos?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  [k: string]: unknown;
}

// Build a privacy-scoped view for a signed-in member: only their own client,
// conversations, appointments and check-ins, the shared library, and settings
// with the coach's AI key stripped out. The member is linked to their client
// record by id (falling back to email).
function scopeForMember(ws: Workspace, user: { email: string; clientId?: string }): Workspace {
  const mine =
    (user.clientId && (ws.clients ?? []).find((c) => c.id === user.clientId)) ||
    (ws.clients ?? []).find((c) => c.email?.toLowerCase() === user.email.toLowerCase());
  const myId = mine?.id ?? null;
  const settings = { ...(ws.settings ?? {}) };
  delete (settings as Record<string, unknown>).aiApiKey;

  return {
    ...ws,
    clients: mine ? [mine] : [],
    conversations: (ws.conversations ?? []).filter((c) => c.clientId === myId),
    appointments: (ws.appointments ?? []).filter((a) => a.clientId === myId),
    checkins: (ws.checkins ?? []).filter((c) => c.clientId === myId),
    users: [],
    broadcasts: [],
    aiSuggestions: [],
    kanban: [],
    // Coach-private documentation is never sent to members.
    formReviews: {},
    clientNotes: {},
    recoveryNotes: {},
    // Only the member's own assignment plan, completed sessions and photos.
    clientPlans: myId && ws.clientPlans?.[myId] ? { [myId]: ws.clientPlans[myId] } : {},
    completions: myId && ws.completions?.[myId] ? { [myId]: ws.completions[myId] } : {},
    photos: myId && ws.photos?.[myId] ? { [myId]: ws.photos[myId] } : {},
    settings,
    currentClientId: myId,
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const raw = (await kvGet<Workspace>(WORKSPACE_KEY)) ?? null;
  const workspace = raw && user.role === "member" ? scopeForMember(raw, user) : raw;
  return NextResponse.json({ workspace, session: user });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  // Members must not overwrite the shared workspace — their writes go through
  // /api/member/activity. Only staff roles may persist the full document.
  if (user.role === "member") {
    return NextResponse.json({ error: "Members cannot modify the workspace." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid workspace payload." }, { status: 400 });
  }

  await kvSet(WORKSPACE_KEY, body);
  return NextResponse.json({ ok: true });
}
