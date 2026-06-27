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
  nutritionLogs?: Record<string, unknown>;
  weightLogs?: Record<string, unknown>;
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
    // The member's own appointments plus any open slots (clientId === "") the
    // coach has published for booking.
    appointments: (ws.appointments ?? []).filter((a) => a.clientId === myId || !a.clientId),
    checkins: (ws.checkins ?? []).filter((c) => c.clientId === myId),
    // Shared templates + this member's own client-specific plans only.
    mealPlans: ((ws.mealPlans as Array<{ clientId?: string }> | undefined) ?? [])
      .filter((m) => !m.clientId || m.clientId === myId),
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
    nutritionLogs: myId && ws.nutritionLogs?.[myId] ? { [myId]: ws.nutritionLogs[myId] } : {},
    weightLogs: myId && ws.weightLogs?.[myId] ? { [myId]: ws.weightLogs[myId] } : {},
    settings,
    currentClientId: myId,
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let raw = (await kvGet<Workspace>(WORKSPACE_KEY)) ?? null;

  // Self-heal: a signed-in member with no linked client record (invited before
  // the trainer's save landed) gets one created from their account, persisted so
  // they immediately appear under the trainer's Clients and can be assigned to.
  if (user.role === "member") {
    const ws = (raw ?? {}) as Workspace & { clients?: Array<Record<string, unknown>> };
    const clients = ws.clients ?? [];
    const linked = clients.some(
      (c) => (user.clientId && c.id === user.clientId) ||
        String(c.email ?? "").toLowerCase() === user.email.toLowerCase(),
    );
    if (!linked) {
      const name = user.name || user.email;
      const created = {
        id: user.clientId || `c_${Math.random().toString(36).slice(2, 9)}`,
        name, email: user.email,
        avatar: name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
        status: "active", program: "Unassigned", goal: "General fitness",
        progress: 0, lastActive: "Just now", startWeight: 0, currentWeight: 0,
        goalWeight: 0, adherence: 0, joinedAt: new Date().toISOString().slice(0, 10),
        phone: "", tags: [],
      };
      ws.clients = [created, ...clients];
      await kvSet(WORKSPACE_KEY, ws);
      raw = ws as Workspace;
    }
  }

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
