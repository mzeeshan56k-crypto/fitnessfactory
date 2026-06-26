import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet } from "@/lib/storage";
import { getSessionUser } from "@/lib/auth/accounts";

export const runtime = "nodejs";

const WORKSPACE_KEY = "ffkc:workspace";

interface Message { id: string; fromClient: boolean; text: string; time: string }
interface Conversation { clientId: string; unread: number; messages: Message[] }
interface CheckIn { id: string; clientId: string; date: string; answers: Record<string, string | number>; formId?: string; formName?: string }
interface Completion {
  id: string; workoutId: string; workoutName: string; date: string;
  setsLogged: number; volume: number; avgRpe: number;
}
interface Photo { id: string; label: string; date: string; url: string }
interface FoodEntry { id: string; name: string; kcal: number }
interface NutritionLog { water: number; foodLog: FoodEntry[]; logged: string[] }
interface WeightEntry { date: string; weight: number }
interface Appointment {
  id: string; title: string; clientId: string; day: number;
  start: string; end: string; type: string; requestedByClient?: boolean;
}
interface CommunityPost {
  id: string; author: string; avatar: string; coach: boolean;
  text: string; ts: number; likedBy: string[]; comments: unknown[];
}
interface WsClient {
  id: string; email: string;
  currentWeight?: number; startWeight?: number; goalWeight?: number;
  adherence?: number; progress?: number; lastActive?: string;
}
interface Workspace {
  clients?: WsClient[];
  conversations?: Conversation[];
  checkins?: CheckIn[];
  completions?: Record<string, Completion[]>;
  photos?: Record<string, Photo[]>;
  nutritionLogs?: Record<string, NutritionLog>;
  weightLogs?: Record<string, WeightEntry[]>;
  clientPlans?: Record<string, { workoutIds?: string[] }>;
  appointments?: Appointment[];
  communityPosts?: CommunityPost[];
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
    kind?:
      | "message" | "checkin" | "workout" | "photo" | "photo-remove" | "nutrition" | "weight"
      | "appointment" | "appointment-remove" | "community";
    text?: string;
    answers?: Record<string, string | number>;
    formId?: string;
    formName?: string;
    completion?: Partial<Completion>;
    photo?: Partial<Photo>;
    photoId?: string;
    log?: NutritionLog;
    weight?: number;
    appointment?: Partial<Appointment>;
    appointmentId?: string;
    communityPosts?: CommunityPost[];
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
    const answers = body.answers ?? {};
    const ci: CheckIn = {
      id: uid("ci"),
      clientId: mine.id,
      date: new Date().toISOString(),
      answers,
      ...(body.formId ? { formId: String(body.formId) } : {}),
      ...(body.formName ? { formName: String(body.formName) } : {}),
    };
    ws.checkins = [ci, ...(ws.checkins ?? [])];
    // If the check-in includes a body weight, also log it so the trainer's
    // weight chart and headline current weight stay in sync.
    const w = Number(answers.weight);
    if (Number.isFinite(w) && w > 0) {
      const entry: WeightEntry = { date: new Date().toISOString(), weight: w };
      const all = ws.weightLogs ?? {};
      ws.weightLogs = { ...all, [mine.id]: [entry, ...(all[mine.id] ?? [])].slice(0, 365) };
      ws.clients = (ws.clients ?? []).map((c) => (c.id === mine.id ? { ...c, currentWeight: w, lastActive: "Just now" } : c));
    }
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
    // Adherence/progress are derived live from completions on every portal.
    ws.clients = (ws.clients ?? []).map((c) => (c.id === mine.id ? { ...c, lastActive: "Just now" } : c));
  } else if (body.kind === "photo") {
    const p = body.photo ?? {};
    if (!p.url) return NextResponse.json({ error: "Missing photo." }, { status: 400 });
    const photo: Photo = {
      id: String(p.id || uid("pp")),
      label: String(p.label || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })),
      date: String(p.date || new Date().toISOString()),
      url: String(p.url),
    };
    const all = ws.photos ?? {};
    ws.photos = { ...all, [mine.id]: [...(all[mine.id] ?? []), photo] };
  } else if (body.kind === "photo-remove") {
    const all = ws.photos ?? {};
    ws.photos = { ...all, [mine.id]: (all[mine.id] ?? []).filter((p) => p.id !== body.photoId) };
  } else if (body.kind === "nutrition") {
    const log = body.log;
    if (!log) return NextResponse.json({ error: "Missing log." }, { status: 400 });
    const safe: NutritionLog = {
      water: Number(log.water) || 0,
      foodLog: Array.isArray(log.foodLog) ? log.foodLog.slice(0, 200) : [],
      logged: Array.isArray(log.logged) ? log.logged.slice(0, 100) : [],
    };
    ws.nutritionLogs = { ...(ws.nutritionLogs ?? {}), [mine.id]: safe };
  } else if (body.kind === "weight") {
    const weight = Number(body.weight);
    if (!Number.isFinite(weight) || weight <= 0) {
      return NextResponse.json({ error: "Invalid weight." }, { status: 400 });
    }
    const entry: WeightEntry = { date: new Date().toISOString(), weight };
    const all = ws.weightLogs ?? {};
    ws.weightLogs = { ...all, [mine.id]: [entry, ...(all[mine.id] ?? [])].slice(0, 365) };
    // Headline weight drives derived progress on every portal.
    ws.clients = (ws.clients ?? []).map((c) => (c.id === mine.id ? { ...c, currentWeight: weight, lastActive: "Just now" } : c));
  } else if (body.kind === "appointment") {
    const a = body.appointment ?? {};
    // Members may only create appointments for themselves.
    const appt: Appointment = {
      id: String(a.id || uid("a")),
      title: String(a.title || "Session"),
      clientId: mine.id,
      day: Number(a.day ?? 0),
      start: String(a.start || "09:00"),
      end: String(a.end || "10:00"),
      type: String(a.type || "session"),
      requestedByClient: true,
    };
    const existing = ws.appointments ?? [];
    ws.appointments = existing.some((x) => x.id === appt.id)
      ? existing.map((x) => (x.id === appt.id ? appt : x))
      : [...existing, appt];
  } else if (body.kind === "appointment-remove") {
    // Members may only remove their own appointments.
    ws.appointments = (ws.appointments ?? []).filter(
      (x) => !(x.id === body.appointmentId && x.clientId === mine.id),
    );
  } else if (body.kind === "community") {
    // The whole feed is shared; trust the client's merged copy but cap size.
    if (!Array.isArray(body.communityPosts)) {
      return NextResponse.json({ error: "Missing posts." }, { status: 400 });
    }
    ws.communityPosts = body.communityPosts.slice(0, 200);
  } else {
    return NextResponse.json({ error: "Unknown activity." }, { status: 400 });
  }

  await kvSet(WORKSPACE_KEY, ws);
  return NextResponse.json({ ok: true });
}
