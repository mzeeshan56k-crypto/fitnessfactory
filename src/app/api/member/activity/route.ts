import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/storage";
import { getSessionUser } from "@/lib/auth/accounts";

export const runtime = "nodejs";

const WORKSPACE_KEY = "ffkc:workspace";

interface Message { id: string; fromClient: boolean; text: string; time: string }
interface Conversation { clientId: string; unread: number; messages: Message[] }
interface CheckIn { id: string; clientId: string; date: string; answers: Record<string, string | number> }
interface Completion {
  id: string; workoutId: string; workoutName: string; date: string;
  setsLogged: number; volume: number; avgRpe: number;
}
interface Workspace {
  clients?: { id: string; email: string }[];
  conversations?: Conversation[];
  checkins?: CheckIn[];
  completions?: Record<string, Completion[]>;
  [k: string]: unknown;
}

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

// Lets a signed-in member persist their own activity (coach messages,
// check-ins) without exposing or overwriting the rest of the workspace.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "member") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let body: {
    kind?: "message" | "checkin" | "workout";
    text?: string;
    answers?: Record<string, string | number>;
    completion?: Partial<Completion>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const ws = (await kvGet<Workspace>(WORKSPACE_KEY)) ?? {};
  const mine =
    (user.clientId && (ws.clients ?? []).find((c) => c.id === user.clientId)) ||
    (ws.clients ?? []).find((c) => c.email?.toLowerCase() === user.email.toLowerCase());
  if (!mine) {
    return NextResponse.json({ error: "No client record is linked to your account yet." }, { status: 404 });
  }

  if (body.kind === "message") {
    const text = (body.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "Message is empty." }, { status: 400 });
    const msg: Message = {
      id: uid("msg"),
      fromClient: true,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const conversations = ws.conversations ?? [];
    const existing = conversations.find((c) => c.clientId === mine.id);
    ws.conversations = existing
      ? conversations.map((c) =>
          c.clientId === mine.id ? { ...c, unread: c.unread + 1, messages: [...c.messages, msg] } : c,
        )
      : [...conversations, { clientId: mine.id, unread: 1, messages: [msg] }];
  } else if (body.kind === "checkin") {
    const ci: CheckIn = {
      id: uid("ci"),
      clientId: mine.id,
      date: new Date().toISOString(),
      answers: body.answers ?? {},
    };
    ws.checkins = [ci, ...(ws.checkins ?? [])];
  } else if (body.kind === "workout") {
    const c = body.completion ?? {};
    const completion: Completion = {
      id: uid("wc"),
      workoutId: String(c.workoutId ?? ""),
      workoutName: String(c.workoutName ?? "Workout"),
      date: new Date().toISOString(),
      setsLogged: Number(c.setsLogged ?? 0),
      volume: Number(c.volume ?? 0),
      avgRpe: Number(c.avgRpe ?? 0),
    };
    const all = ws.completions ?? {};
    ws.completions = { ...all, [mine.id]: [completion, ...(all[mine.id] ?? [])] };
  } else {
    return NextResponse.json({ error: "Unknown activity." }, { status: 400 });
  }

  await kvSet(WORKSPACE_KEY, ws);
  return NextResponse.json({ ok: true });
}
