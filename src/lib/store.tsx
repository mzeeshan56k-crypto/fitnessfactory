"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import type {
  Client, Exercise, Workout, Program, MealPlan, Conversation, Message,
  Appointment, ClientNote, FormReview, ClientPlan, WorkoutCompletion, ProgressPhoto, NutritionLog,
} from "@/lib/data";
import type {
  KanbanColumn, KanbanCard, Challenge, PlatformUser, AISuggestion,
} from "@/lib/platform";
import type { SessionUser } from "@/lib/auth/session";
import { seedExercises, seedWorkouts, seedPrograms, prebuiltForms } from "@/lib/seed-content";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface AppSettings {
  trainerName: string;
  trainerEmail: string;
  businessName: string;
  brandColor: string;
  profilePhoto?: string;
  brandLogo?: string;
  aiProvider?: "openai" | "anthropic" | "gemini";
  aiModel?: string;
  aiApiKey?: string;
  autoUpdates?: { workouts: boolean; nutrition: boolean; checkins: boolean };
}

export interface Broadcast {
  id: string;
  title: string;
  audience: string;
  sent: string;
  reach: string;
}

export interface CheckIn {
  id: string;
  clientId: string;
  date: string;
  answers: Record<string, string | number>;
}

export interface FormField {
  id: string;
  label: string;
  type: "short" | "long" | "number" | "scale" | "yesno" | "choice";
  options?: string[];
  required?: boolean;
}

export interface CoachForm {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
}

export interface DB {
  clients: Client[];
  exercises: Exercise[];
  workouts: Workout[];
  programs: Program[];
  mealPlans: MealPlan[];
  conversations: Conversation[];
  appointments: Appointment[];
  kanban: KanbanColumn[];
  challenges: Challenge[];
  aiSuggestions: AISuggestion[];
  users: PlatformUser[];
  broadcasts: Broadcast[];
  checkins: CheckIn[];
  forms: CoachForm[];
  // Coach documentation, keyed by client id.
  formReviews: Record<string, FormReview[]>;
  clientNotes: Record<string, ClientNote[]>;
  recoveryNotes: Record<string, string>;
  // What the coach has assigned to each client, keyed by client id.
  clientPlans: Record<string, ClientPlan>;
  // Completed training sessions logged by members, keyed by client id.
  completions: Record<string, WorkoutCompletion[]>;
  // Progress photos, keyed by client id (shared between coach and member).
  photos: Record<string, ProgressPhoto[]>;
  // Members' nutrition diaries, keyed by client id.
  nutritionLogs: Record<string, NutritionLog>;
  settings: AppSettings;
  currentClientId: string | null;
  seeded: boolean;
}

const emptyKanban: KanbanColumn[] = [
  { id: "onboarding", title: "Onboarding queue", cards: [] },
  { id: "formcheck", title: "Form check reviews", cards: [] },
  { id: "support", title: "Support inquiries", cards: [] },
  { id: "done", title: "Completed", cards: [] },
];

const emptyDB: DB = {
  clients: [], exercises: [], workouts: [], programs: [], mealPlans: [],
  conversations: [], appointments: [], kanban: emptyKanban, challenges: [],
  aiSuggestions: [], users: [], broadcasts: [], checkins: [], forms: [],
  formReviews: {}, clientNotes: {}, recoveryNotes: {}, clientPlans: {}, completions: {}, photos: {},
  nutritionLogs: {},
  settings: {
    trainerName: "Your Name",
    trainerEmail: "you@email.com",
    businessName: "Fitness Factory KC",
    brandColor: "#1b82f5",
    autoUpdates: { workouts: false, nutrition: false, checkins: false },
  },
  currentClientId: null,
  seeded: false,
};

interface AppContextValue extends DB {
  hydrated: boolean;
  session: SessionUser | null;
  signOut: () => Promise<void>;
  // generic
  set: (patch: Partial<DB>) => void;
  loadStarterContent: () => void;
  resetAll: () => void;
  // forms
  addForm: (f: Partial<CoachForm>) => void;
  updateForm: (id: string, patch: Partial<CoachForm>) => void;
  removeForm: (id: string) => void;
  // clients
  addClient: (c: Partial<Client>) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  removeClient: (id: string) => void;
  setCurrentClient: (id: string | null) => void;
  // exercises
  addExercise: (e: Partial<Exercise>) => Exercise;
  removeExercise: (id: string) => void;
  // workouts
  addWorkout: (w: Partial<Workout>) => Workout;
  updateWorkout: (id: string, patch: Partial<Workout>) => void;
  removeWorkout: (id: string) => void;
  // programs
  addProgram: (p: Partial<Program>) => Program;
  removeProgram: (id: string) => void;
  // meal plans
  addMealPlan: (m: Partial<MealPlan>) => MealPlan;
  removeMealPlan: (id: string) => void;
  // messaging
  sendMessage: (clientId: string, text: string, fromClient: boolean) => void;
  // appointments
  addAppointment: (a: Partial<Appointment>) => Appointment;
  removeAppointment: (id: string) => void;
  // kanban
  addCard: (columnId: string, title: string, clientId?: string) => void;
  moveCard: (cardId: string, toColumnId: string) => void;
  removeCard: (cardId: string) => void;
  // challenges
  addChallenge: (c: Partial<Challenge>) => void;
  toggleJoinChallenge: (id: string) => void;
  // ai
  resolveSuggestion: (id: string, status: "approved" | "dismissed" | "pending") => void;
  // checkins
  addCheckin: (clientId: string, answers: Record<string, string | number>) => void;
  // coach documentation
  addFormReview: (clientId: string, review: FormReview) => void;
  deleteFormReview: (clientId: string, id: string) => void;
  addClientNote: (clientId: string, note: ClientNote) => void;
  setRecoveryNote: (clientId: string, text: string) => void;
  // assignment (coach → client)
  toggleAssignedWorkout: (clientId: string, workoutId: string) => void;
  setClientProgram: (clientId: string, programId: string) => void;
  setClientMealPlan: (clientId: string, mealPlanId: string) => void;
  // member logs a completed session
  completeWorkout: (clientId: string, summary: Omit<WorkoutCompletion, "id" | "date">) => void;
  // progress photos (shared coach ↔ member)
  addPhoto: (clientId: string, url: string) => void;
  removePhoto: (clientId: string, id: string) => void;
  // member nutrition diary
  setNutritionLog: (clientId: string, log: NutritionLog) => void;
  // users (admin)
  addUser: (u: Partial<PlatformUser>) => void;
  updateUser: (id: string, patch: Partial<PlatformUser>) => void;
  removeUser: (id: string) => void;
  // broadcasts
  addBroadcast: (title: string, audience: string) => void;
  // settings
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(emptyDB);
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(null);
  const lastSaved = useRef<string | null>(null);
  const loaded = useRef(false);
  const sessionRef = useRef<SessionUser | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Load the workspace + session from the server on boot.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/workspace");
        if (res.ok) {
          const data = await res.json();
          if (!active) return;
          setSession(data.session ?? null);
          const merged: DB = data.workspace ? { ...emptyDB, ...data.workspace } : emptyDB;
          setDb(merged);
          lastSaved.current = JSON.stringify(merged);
        }
      } catch {
        /* offline / unauthenticated */
      } finally {
        if (active) {
          loaded.current = true;
          setHydrated(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist the workspace to the server when it changes (debounced).
  // Members never overwrite the shared workspace — their writes go through
  // dedicated endpoints — so only staff roles bulk-save.
  useEffect(() => {
    if (!hydrated || !loaded.current || !session || session.role === "member") return;
    const snapshot = JSON.stringify(db);
    if (snapshot === lastSaved.current) return;
    const t = setTimeout(() => {
      lastSaved.current = snapshot;
      fetch("/api/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: snapshot,
      }).catch(() => {
        /* will retry on next change */
      });
    }, 600);
    return () => clearTimeout(t);
  }, [db, hydrated, session]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    window.location.href = "/login";
  }, []);

  const set = useCallback((patch: Partial<DB>) => setDb((d) => ({ ...d, ...patch })), []);

  // Loads the pre-built library (exercises, workouts, programs, forms) WITHOUT
  // demo clients — gives a coach a ready-to-use catalog on an empty workspace.
  const loadStarterContent = useCallback(() => {
    setDb((d) => ({
      ...d,
      exercises: seedExercises,
      workouts: seedWorkouts,
      programs: seedPrograms,
      forms: prebuiltForms,
    }));
  }, []);

  const resetAll = useCallback(() => {
    setDb({ ...emptyDB, seeded: false });
  }, []);

  /* ----- forms ----- */
  const addForm = useCallback((f: Partial<CoachForm>) => {
    const form: CoachForm = {
      id: uid("form"), name: f.name ?? "New Form",
      description: f.description, fields: f.fields ?? [],
    };
    setDb((d) => ({ ...d, forms: [form, ...d.forms] }));
  }, []);
  const updateForm = useCallback((id: string, patch: Partial<CoachForm>) =>
    setDb((d) => ({ ...d, forms: d.forms.map((f) => (f.id === id ? { ...f, ...patch } : f)) })), []);
  const removeForm = useCallback((id: string) =>
    setDb((d) => ({ ...d, forms: d.forms.filter((f) => f.id !== id) })), []);

  /* ----- clients ----- */
  const addClient = useCallback((c: Partial<Client>): Client => {
    const initials =
      (c.name ?? "New Client").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    const client: Client = {
      id: uid("c"), name: c.name ?? "New Client", email: c.email ?? "",
      avatar: c.avatar ?? initials, status: c.status ?? "active",
      program: c.program ?? "Unassigned", goal: c.goal ?? "General fitness",
      progress: c.progress ?? 0, lastActive: "Just now",
      startWeight: c.startWeight ?? 0, currentWeight: c.currentWeight ?? c.startWeight ?? 0,
      goalWeight: c.goalWeight ?? 0, adherence: c.adherence ?? 0,
      joinedAt: new Date().toISOString().slice(0, 10), phone: c.phone ?? "",
      tags: c.tags ?? [],
    };
    setDb((d) => ({
      ...d,
      clients: [client, ...d.clients],
      currentClientId: d.currentClientId ?? client.id,
    }));
    return client;
  }, []);
  const updateClient = useCallback((id: string, patch: Partial<Client>) =>
    setDb((d) => ({ ...d, clients: d.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })), []);
  const removeClient = useCallback((id: string) =>
    setDb((d) => ({
      ...d,
      clients: d.clients.filter((c) => c.id !== id),
      conversations: d.conversations.filter((c) => c.clientId !== id),
      currentClientId: d.currentClientId === id ? (d.clients.find((c) => c.id !== id)?.id ?? null) : d.currentClientId,
    })), []);
  const setCurrentClient = useCallback((id: string | null) =>
    setDb((d) => ({ ...d, currentClientId: id })), []);

  /* ----- exercises ----- */
  const addExercise = useCallback((e: Partial<Exercise>): Exercise => {
    const ex: Exercise = {
      id: uid("e"), name: e.name ?? "New Exercise", muscle: e.muscle ?? "Full body",
      equipment: e.equipment ?? "Bodyweight", level: e.level ?? "Beginner",
      type: e.type ?? "Strength", videoThumb: e.videoThumb ?? "demo",
      video: e.video,
    };
    setDb((d) => ({ ...d, exercises: [ex, ...d.exercises] }));
    return ex;
  }, []);
  const removeExercise = useCallback((id: string) =>
    setDb((d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== id) })), []);

  /* ----- workouts ----- */
  const addWorkout = useCallback((w: Partial<Workout>): Workout => {
    const workout: Workout = {
      id: uid("w"), name: w.name ?? "New Workout", category: w.category ?? "Strength",
      durationMin: w.durationMin ?? 45, difficulty: w.difficulty ?? "Beginner",
      exercises: w.exercises ?? [],
    };
    setDb((d) => ({ ...d, workouts: [workout, ...d.workouts] }));
    return workout;
  }, []);
  const updateWorkout = useCallback((id: string, patch: Partial<Workout>) =>
    setDb((d) => ({ ...d, workouts: d.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)) })), []);
  const removeWorkout = useCallback((id: string) =>
    setDb((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) })), []);

  /* ----- programs ----- */
  const addProgram = useCallback((p: Partial<Program>): Program => {
    const program: Program = {
      id: uid("p"), name: p.name ?? "New Program", weeks: p.weeks ?? 8,
      workoutsPerWeek: p.workoutsPerWeek ?? 3, focus: p.focus ?? "General",
      clientsAssigned: p.clientsAssigned ?? 0, color: p.color ?? "from-brand-500 to-brand-700",
      workoutIds: p.workoutIds ?? [],
    };
    setDb((d) => ({ ...d, programs: [program, ...d.programs] }));
    return program;
  }, []);
  const removeProgram = useCallback((id: string) =>
    setDb((d) => ({ ...d, programs: d.programs.filter((p) => p.id !== id) })), []);

  /* ----- meal plans ----- */
  const addMealPlan = useCallback((m: Partial<MealPlan>): MealPlan => {
    const plan: MealPlan = {
      id: uid("m"), name: m.name ?? "New Meal Plan", calories: m.calories ?? 2000,
      protein: m.protein ?? 150, carbs: m.carbs ?? 200, fat: m.fat ?? 60,
      meals: m.meals ?? [], tag: m.tag ?? "Custom",
    };
    setDb((d) => ({ ...d, mealPlans: [plan, ...d.mealPlans] }));
    return plan;
  }, []);
  const removeMealPlan = useCallback((id: string) =>
    setDb((d) => ({ ...d, mealPlans: d.mealPlans.filter((m) => m.id !== id) })), []);

  /* ----- messaging ----- */
  const sendMessage = useCallback((clientId: string, text: string, fromClient: boolean) => {
    const msg: Message = {
      id: uid("msg"), fromClient, text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setDb((d) => {
      const exists = d.conversations.find((c) => c.clientId === clientId);
      const conversations = exists
        ? d.conversations.map((c) =>
            c.clientId === clientId
              ? { ...c, messages: [...c.messages, msg], unread: fromClient ? c.unread + 1 : c.unread }
              : c,
          )
        : [...d.conversations, { clientId, unread: fromClient ? 1 : 0, messages: [msg] }];
      return { ...d, conversations };
    });
    // A member's outgoing message is persisted server-side safely.
    if (fromClient && sessionRef.current?.role === "member") {
      fetch("/api/member/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "message", text }),
      }).catch(() => {});
    }
  }, []);

  /* ----- appointments ----- */
  const addAppointment = useCallback((a: Partial<Appointment>): Appointment => {
    const appt: Appointment = {
      id: uid("a"), title: a.title ?? "New Event", clientId: a.clientId ?? "",
      day: a.day ?? 0, start: a.start ?? "09:00", end: a.end ?? "10:00",
      type: a.type ?? "session",
    };
    setDb((d) => ({ ...d, appointments: [...d.appointments, appt] }));
    return appt;
  }, []);
  const removeAppointment = useCallback((id: string) =>
    setDb((d) => ({ ...d, appointments: d.appointments.filter((a) => a.id !== id) })), []);

  /* ----- kanban ----- */
  const addCard = useCallback((columnId: string, title: string, clientId?: string) => {
    const card: KanbanCard = { id: uid("k"), title, clientId, tag: "Task", due: "Today" };
    setDb((d) => ({
      ...d,
      kanban: d.kanban.map((col) => (col.id === columnId ? { ...col, cards: [...col.cards, card] } : col)),
    }));
  }, []);
  const moveCard = useCallback((cardId: string, toColumnId: string) =>
    setDb((d) => {
      let moved: KanbanCard | undefined;
      const stripped = d.kanban.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => {
          if (c.id === cardId) { moved = c; return false; }
          return true;
        }),
      }));
      if (!moved) return d;
      return {
        ...d,
        kanban: stripped.map((col) => (col.id === toColumnId ? { ...col, cards: [...col.cards, moved!] } : col)),
      };
    }), []);
  const removeCard = useCallback((cardId: string) =>
    setDb((d) => ({
      ...d,
      kanban: d.kanban.map((col) => ({ ...col, cards: col.cards.filter((c) => c.id !== cardId) })),
    })), []);

  /* ----- challenges ----- */
  const addChallenge = useCallback((c: Partial<Challenge>) => {
    const ch: Challenge = {
      id: uid("ch"), name: c.name ?? "New Challenge", desc: c.desc ?? "",
      metric: c.metric ?? "Workouts", daysLeft: c.daysLeft ?? 30,
      participants: c.participants ?? 1, joined: c.joined ?? true,
      color: c.color ?? "from-brand-500 to-brand-700",
    };
    setDb((d) => ({ ...d, challenges: [ch, ...d.challenges] }));
  }, []);
  const toggleJoinChallenge = useCallback((id: string) =>
    setDb((d) => ({
      ...d,
      challenges: d.challenges.map((c) =>
        c.id === id
          ? { ...c, joined: !c.joined, participants: c.participants + (c.joined ? -1 : 1) }
          : c,
      ),
    })), []);

  /* ----- ai ----- */
  const resolveSuggestion = useCallback((id: string, status: "approved" | "dismissed" | "pending") =>
    setDb((d) => ({
      ...d,
      aiSuggestions: d.aiSuggestions.map((s) => (s.id === id ? { ...s, status } : s)),
    })), []);

  /* ----- checkins ----- */
  const addCheckin = useCallback((clientId: string, answers: Record<string, string | number>) => {
    const ci: CheckIn = { id: uid("ci"), clientId, date: new Date().toISOString(), answers };
    setDb((d) => ({ ...d, checkins: [ci, ...d.checkins] }));
    if (sessionRef.current?.role === "member") {
      fetch("/api/member/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "checkin", answers }),
      }).catch(() => {});
    }
  }, []);

  /* ----- coach documentation ----- */
  const addFormReview = useCallback((clientId: string, review: FormReview) =>
    setDb((d) => ({
      ...d,
      formReviews: { ...d.formReviews, [clientId]: [review, ...(d.formReviews[clientId] ?? [])] },
    })), []);
  const deleteFormReview = useCallback((clientId: string, id: string) =>
    setDb((d) => ({
      ...d,
      formReviews: { ...d.formReviews, [clientId]: (d.formReviews[clientId] ?? []).filter((r) => r.id !== id) },
    })), []);
  const addClientNote = useCallback((clientId: string, note: ClientNote) =>
    setDb((d) => ({
      ...d,
      clientNotes: { ...d.clientNotes, [clientId]: [note, ...(d.clientNotes[clientId] ?? [])] },
    })), []);
  const setRecoveryNote = useCallback((clientId: string, text: string) =>
    setDb((d) => ({ ...d, recoveryNotes: { ...d.recoveryNotes, [clientId]: text } })), []);

  /* ----- assignment (coach → client) ----- */
  const toggleAssignedWorkout = useCallback((clientId: string, workoutId: string) =>
    setDb((d) => {
      const plan = d.clientPlans[clientId] ?? { workoutIds: [] };
      const has = plan.workoutIds.includes(workoutId);
      const workoutIds = has
        ? plan.workoutIds.filter((id) => id !== workoutId)
        : [...plan.workoutIds, workoutId];
      return { ...d, clientPlans: { ...d.clientPlans, [clientId]: { ...plan, workoutIds } } };
    }), []);
  const setClientProgram = useCallback((clientId: string, programId: string) =>
    setDb((d) => {
      const program = d.programs.find((p) => p.id === programId);
      const current = d.clientPlans[clientId] ?? { workoutIds: [] };
      // Assigning a program auto-fills the client's workouts from that program.
      const workoutIds = program?.workoutIds?.length ? [...program.workoutIds] : current.workoutIds;
      return {
        ...d,
        clientPlans: { ...d.clientPlans, [clientId]: { ...current, programId, workoutIds } },
        // Keep the client's display program name in sync.
        clients: program ? d.clients.map((c) => (c.id === clientId ? { ...c, program: program.name } : c)) : d.clients,
      };
    }), []);
  const setClientMealPlan = useCallback((clientId: string, mealPlanId: string) =>
    setDb((d) => ({
      ...d,
      clientPlans: { ...d.clientPlans, [clientId]: { ...(d.clientPlans[clientId] ?? { workoutIds: [] }), mealPlanId } },
    })), []);

  const completeWorkout = useCallback((clientId: string, summary: Omit<WorkoutCompletion, "id" | "date">) => {
    const completion: WorkoutCompletion = { id: uid("wc"), date: new Date().toISOString(), ...summary };
    setDb((d) => ({
      ...d,
      completions: { ...d.completions, [clientId]: [completion, ...(d.completions[clientId] ?? [])] },
    }));
    // Members persist via the dedicated endpoint (they can't bulk-save).
    if (sessionRef.current?.role === "member") {
      fetch("/api/member/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "workout", completion: summary }),
      }).catch(() => {});
    }
  }, []);

  /* ----- progress photos ----- */
  const addPhoto = useCallback((clientId: string, url: string) => {
    const photo: ProgressPhoto = {
      id: uid("pp"),
      label: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      date: new Date().toISOString(),
      url,
    };
    setDb((d) => ({ ...d, photos: { ...d.photos, [clientId]: [...(d.photos[clientId] ?? []), photo] } }));
    if (sessionRef.current?.role === "member") {
      fetch("/api/member/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "photo", photo }),
      }).catch(() => {});
    }
  }, []);
  const removePhoto = useCallback((clientId: string, id: string) => {
    setDb((d) => ({ ...d, photos: { ...d.photos, [clientId]: (d.photos[clientId] ?? []).filter((p) => p.id !== id) } }));
    if (sessionRef.current?.role === "member") {
      fetch("/api/member/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "photo-remove", photoId: id }),
      }).catch(() => {});
    }
  }, []);

  /* ----- member nutrition diary ----- */
  const setNutritionLog = useCallback((clientId: string, log: NutritionLog) => {
    setDb((d) => ({ ...d, nutritionLogs: { ...d.nutritionLogs, [clientId]: log } }));
    if (sessionRef.current?.role === "member") {
      fetch("/api/member/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "nutrition", log }),
      }).catch(() => {});
    }
  }, []);

  /* ----- users ----- */
  const addUser = useCallback((u: Partial<PlatformUser>) => {
    const initials = (u.name ?? "New User").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    const user: PlatformUser = {
      id: uid("u"), name: u.name ?? "New User", avatar: u.avatar ?? initials,
      role: u.role ?? "Client", email: u.email ?? "", status: u.status ?? "invited",
      mfa: u.mfa ?? false,
    };
    setDb((d) => ({ ...d, users: [user, ...d.users] }));
  }, []);
  const updateUser = useCallback((id: string, patch: Partial<PlatformUser>) =>
    setDb((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })), []);
  const removeUser = useCallback((id: string) =>
    setDb((d) => ({ ...d, users: d.users.filter((u) => u.id !== id) })), []);

  /* ----- broadcasts ----- */
  const addBroadcast = useCallback((title: string, audience: string) => {
    const b: Broadcast = { id: uid("bc"), title, audience, sent: "Just now", reach: "—" };
    setDb((d) => ({ ...d, broadcasts: [b, ...d.broadcasts] }));
  }, []);

  /* ----- settings ----- */
  const updateSettings = useCallback((patch: Partial<AppSettings>) =>
    setDb((d) => ({ ...d, settings: { ...d.settings, ...patch } })), []);

  const value = useMemo<AppContextValue>(() => ({
    ...db, hydrated, session, signOut,
    set, loadStarterContent, resetAll,
    addForm, updateForm, removeForm,
    addClient, updateClient, removeClient, setCurrentClient,
    addExercise, removeExercise,
    addWorkout, updateWorkout, removeWorkout,
    addProgram, removeProgram,
    addMealPlan, removeMealPlan,
    sendMessage,
    addAppointment, removeAppointment,
    addCard, moveCard, removeCard,
    addChallenge, toggleJoinChallenge,
    resolveSuggestion,
    addCheckin,
    addFormReview, deleteFormReview, addClientNote, setRecoveryNote,
    toggleAssignedWorkout, setClientProgram, setClientMealPlan, completeWorkout,
    addPhoto, removePhoto, setNutritionLog,
    addUser, updateUser, removeUser,
    addBroadcast,
    updateSettings,
  }), [
    db, hydrated, session, signOut, set, loadStarterContent, resetAll, addForm, updateForm, removeForm,
    addClient, updateClient, removeClient,
    setCurrentClient, addExercise, removeExercise, addWorkout, updateWorkout, removeWorkout,
    addProgram, removeProgram, addMealPlan, removeMealPlan, sendMessage, addAppointment,
    removeAppointment, addCard, moveCard, removeCard, addChallenge, toggleJoinChallenge,
    resolveSuggestion, addCheckin, addFormReview, deleteFormReview, addClientNote, setRecoveryNote,
    toggleAssignedWorkout, setClientProgram, setClientMealPlan, completeWorkout,
    addPhoto, removePhoto, setNutritionLog,
    addUser, updateUser, removeUser, addBroadcast, updateSettings,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

/** Convenience: the client currently being viewed in the client portal. */
export function useCurrentClient() {
  const { clients, currentClientId, session } = useApp();
  // A signed-in member is linked to their own client record by id (or email).
  if (session?.role === "member") {
    return (
      clients.find((c) => c.id === session.clientId) ??
      clients.find((c) => c.email.toLowerCase() === session.email.toLowerCase()) ??
      null
    );
  }
  return clients.find((c) => c.id === currentClientId) ?? clients[0] ?? null;
}
