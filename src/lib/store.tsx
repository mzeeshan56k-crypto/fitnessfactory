"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import type {
  Client, Exercise, Workout, Program, MealPlan, Conversation, Message,
  Appointment, ClientNote, FormReview, FormCheckRequest, ClientPlan, WorkoutCompletion, ProgressPhoto, NutritionLog,
  WeightEntry, CommunityPost, CommunityComment, GymClass,
} from "@/lib/data";
import type {
  KanbanColumn, KanbanCard, Challenge, PlatformUser, AISuggestion,
} from "@/lib/platform";
import type { SessionUser } from "@/lib/auth/session";
import { seedExercises, seedWorkouts, seedPrograms, prebuiltForms, prebuiltChallenges } from "@/lib/seed-content";
import { clientAdherence, clientProgress } from "@/lib/metrics";

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
  aiProvider?: "openai" | "anthropic" | "gemini" | "grok";
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
  formId?: string;
  formName?: string;
}

export type FormFieldType =
  | "short" | "long" | "number" | "scale" | "yesno" | "choice" | "checkbox";

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
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
  // Form-check video tasks (requested + submitted), keyed by client id. Visible
  // to the assigned client, unlike formReviews which stay coach-private.
  formCheckRequests: Record<string, FormCheckRequest[]>;
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
  // Bodyweight history, keyed by client id.
  weightLogs: Record<string, WeightEntry[]>;
  // Shared community feed (coach + all members see the same posts).
  communityPosts: CommunityPost[];
  // Gym classes (live + recorded) the trainer publishes.
  classes: GymClass[];
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
  formReviews: {}, formCheckRequests: {}, clientNotes: {}, recoveryNotes: {}, clientPlans: {}, completions: {}, photos: {},
  nutritionLogs: {}, weightLogs: {}, communityPosts: [], classes: [],
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
  updateExercise: (id: string, patch: Partial<Exercise>) => void;
  removeExercise: (id: string) => void;
  // workouts
  addWorkout: (w: Partial<Workout>) => Workout;
  updateWorkout: (id: string, patch: Partial<Workout>) => void;
  removeWorkout: (id: string) => void;
  // programs
  addProgram: (p: Partial<Program>) => Program;
  updateProgram: (id: string, patch: Partial<Program>) => void;
  removeProgram: (id: string) => void;
  // meal plans
  addMealPlan: (m: Partial<MealPlan>) => MealPlan;
  updateMealPlan: (id: string, patch: Partial<MealPlan>) => void;
  removeMealPlan: (id: string) => void;
  // messaging
  sendMessage: (clientId: string, text: string, fromClient: boolean) => void;
  // appointments
  addAppointment: (a: Partial<Appointment>) => Appointment;
  removeAppointment: (id: string) => void;
  bookAppointment: (id: string) => void;
  // kanban
  addCard: (columnId: string, title: string, clientId?: string) => void;
  moveCard: (cardId: string, toColumnId: string) => void;
  removeCard: (cardId: string) => void;
  // challenges
  addChallenge: (c: Partial<Challenge>) => void;
  toggleJoinChallenge: (id: string) => void;
  removeChallenge: (id: string) => void;
  markChallengeDay: (challengeId: string, clientId: string, date: string, remove?: boolean) => void;
  // community feed (shared)
  addCommunityPost: (text: string) => void;
  toggleCommunityLike: (postId: string) => void;
  addCommunityComment: (postId: string, text: string) => void;
  removeCommunityPost: (postId: string) => void;
  // classes (trainer-published)
  addClass: (c: Partial<GymClass>) => void;
  removeClass: (id: string) => void;
  toggleClassEnroll: (id: string) => void;
  // ai
  resolveSuggestion: (id: string, status: "approved" | "dismissed" | "pending") => void;
  // checkins
  addCheckin: (
    clientId: string,
    answers: Record<string, string | number>,
    meta?: { formId?: string; formName?: string },
  ) => void;
  // coach documentation
  addFormReview: (clientId: string, review: FormReview) => void;
  deleteFormReview: (clientId: string, id: string) => void;
  addClientNote: (clientId: string, note: ClientNote) => void;
  setRecoveryNote: (clientId: string, text: string) => void;
  // form-check video tasks
  requestFormCheck: (clientId: string, exercise: string, note?: string) => void;
  removeFormCheckRequest: (clientId: string, id: string) => void;
  // member submits a video for a specific request (or a new ad-hoc one when requestId is null)
  submitFormCheckVideo: (
    clientId: string,
    requestId: string | null,
    video: { url: string; name?: string; exercise: string },
  ) => void;
  markFormCheckReviewed: (clientId: string, id: string, review?: FormCheckRequest["review"]) => void;
  // assignment (coach → client)
  toggleAssignedWorkout: (clientId: string, workoutId: string) => void;
  toggleAssignedForm: (clientId: string, formId: string) => void;
  setClientProgram: (clientId: string, programId: string) => void;
  setClientMealPlan: (clientId: string, mealPlanId: string) => void;
  // member logs a completed session
  completeWorkout: (clientId: string, summary: Omit<WorkoutCompletion, "id" | "date">) => void;
  // progress photos (shared coach ↔ member)
  addPhoto: (clientId: string, url: string) => void;
  removePhoto: (clientId: string, id: string) => void;
  // member nutrition diary
  setNutritionLog: (clientId: string, log: NutritionLog) => void;
  // member bodyweight log
  logWeight: (clientId: string, weight: number) => void;
  // trainer assignment (admin)
  assignCoach: (clientId: string, coachEmail: string, coachName: string) => void;
  // pull the latest workspace from the server
  refresh: () => void;
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
  const dbRef = useRef<DB>(db);
  // Count of member writes currently in flight. While > 0 we don't let the
  // background poll overwrite the member's optimistic local state (otherwise a
  // join/like/booking briefly appears then "undoes itself" before the server
  // has persisted it).
  const pendingWrites = useRef(0);
  useEffect(() => {
    dbRef.current = db;
  }, [db]);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Pull the latest workspace from the server. Coach/member see each other's
  // updates live. When the trainer has unsaved local edits we don't replace the
  // whole document (that would lose the edit), but we DO merge in the
  // collections members write — completions, check-ins, weigh-ins, photos,
  // nutrition, messages — so client progress and the activity feed keep
  // updating in real time even mid-edit.
  // Collections members write that the trainer only reads — safe to fold in
  // live without risking the trainer's own unsaved edits.
  const MEMBER_COLLECTIONS = [
    "completions", "checkins", "weightLogs", "photos", "nutritionLogs",
  ] as const;
  const refresh = useCallback(async () => {
    const sess = sessionRef.current;
    if (!loaded.current || !sess) return;
    // Members: don't clobber optimistic state while a write is in flight.
    if (sess.role === "member" && pendingWrites.current > 0) return;

    const staffDirty =
      sess.role !== "member" && JSON.stringify(dbRef.current) !== lastSaved.current;
    try {
      const res = await fetch("/api/workspace");
      if (!res.ok) return;
      const data = await res.json();
      const merged: DB = data.workspace ? { ...emptyDB, ...data.workspace } : emptyDB;

      if (staffDirty) {
        // Keep the trainer's unsaved edits, but fold in fresh member activity.
        const cur = dbRef.current;
        const patch: Partial<DB> = {};
        let changed = false;
        for (const key of MEMBER_COLLECTIONS) {
          if (JSON.stringify(merged[key]) !== JSON.stringify(cur[key])) {
            (patch as Record<string, unknown>)[key] = merged[key];
            changed = true;
          }
        }
        if (changed) setDb((d) => ({ ...d, ...patch }));
        return;
      }

      const snapshot = JSON.stringify(merged);
      if (snapshot !== JSON.stringify(dbRef.current)) {
        setDb(merged);
        lastSaved.current = snapshot;
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist a member action through the safe endpoint, holding off the poll
  // overwrite until the write has landed, then refreshing to confirm.
  const memberSync = useCallback((body: Record<string, unknown>) => {
    pendingWrites.current += 1;
    fetch("/api/member/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .catch(() => {})
      .finally(() => {
        pendingWrites.current = Math.max(0, pendingWrites.current - 1);
        refresh();
      });
  }, [refresh]);

  // Live sync: poll frequently and whenever the tab regains focus so coach and
  // member see each other's changes almost instantly.
  useEffect(() => {
    if (!hydrated || !session) return;
    const id = window.setInterval(refresh, 1500);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [hydrated, session, refresh]);

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
      challenges: d.challenges.length ? d.challenges : prebuiltChallenges,
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
      coachEmail: c.coachEmail, coachName: c.coachName,
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
    setDb((d) => {
      // Strip every per-client record so a removed client leaves no trace on the
      // dashboard (sessions, check-ins, photos, weight/nutrition, notes, plans).
      const without = <T,>(map: Record<string, T>) => {
        const { [id]: _drop, ...rest } = map;
        return rest;
      };
      return {
        ...d,
        clients: d.clients.filter((c) => c.id !== id),
        conversations: d.conversations.filter((c) => c.clientId !== id),
        checkins: d.checkins.filter((c) => c.clientId !== id),
        appointments: d.appointments.filter((a) => a.clientId !== id),
        // Drop meal plans that were built specifically for this client.
        mealPlans: d.mealPlans.filter((m) => m.clientId !== id),
        completions: without(d.completions),
        photos: without(d.photos),
        weightLogs: without(d.weightLogs),
        nutritionLogs: without(d.nutritionLogs),
        clientPlans: without(d.clientPlans),
        formReviews: without(d.formReviews),
        formCheckRequests: without(d.formCheckRequests),
        clientNotes: without(d.clientNotes),
        recoveryNotes: without(d.recoveryNotes),
        currentClientId: d.currentClientId === id ? (d.clients.find((c) => c.id !== id)?.id ?? null) : d.currentClientId,
      };
    }), []);
  const setCurrentClient = useCallback((id: string | null) =>
    setDb((d) => ({ ...d, currentClientId: id })), []);

  /* ----- exercises ----- */
  const addExercise = useCallback((e: Partial<Exercise>): Exercise => {
    const ex: Exercise = {
      id: uid("e"), name: e.name ?? "New Exercise", muscle: e.muscle ?? "Full body",
      equipment: e.equipment ?? "Bodyweight", level: e.level ?? "Beginner",
      type: e.type ?? "Strength", videoThumb: e.videoThumb ?? "demo",
      video: e.video, instructions: e.instructions,
    };
    setDb((d) => ({ ...d, exercises: [ex, ...d.exercises] }));
    return ex;
  }, []);
  const updateExercise = useCallback((id: string, patch: Partial<Exercise>) =>
    setDb((d) => ({ ...d, exercises: d.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) })), []);
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
  // Keep the flattened workoutIds in sync with the phase structure so program
  // assignment (which reads workoutIds) always matches what the phases contain.
  const withFlatWorkouts = (p: Program): Program =>
    p.phases && p.phases.length
      ? { ...p, workoutIds: Array.from(new Set(p.phases.flatMap((ph) => ph.workoutIds))) }
      : p;

  const addProgram = useCallback((p: Partial<Program>): Program => {
    const program: Program = withFlatWorkouts({
      id: uid("p"), name: p.name ?? "New Program", weeks: p.weeks ?? 8,
      workoutsPerWeek: p.workoutsPerWeek ?? 3, focus: p.focus ?? "General",
      clientsAssigned: p.clientsAssigned ?? 0, color: p.color ?? "from-brand-500 to-brand-700",
      workoutIds: p.workoutIds ?? [],
      ...(p.phases ? { phases: p.phases } : {}),
      ...(p.instructions ? { instructions: p.instructions } : {}),
      ...(p.media ? { media: p.media } : {}),
    });
    setDb((d) => ({ ...d, programs: [program, ...d.programs] }));
    return program;
  }, []);
  const updateProgram = useCallback((id: string, patch: Partial<Program>) =>
    setDb((d) => ({
      ...d,
      programs: d.programs.map((p) => (p.id === id ? withFlatWorkouts({ ...p, ...patch }) : p)),
    })), []);
  const removeProgram = useCallback((id: string) =>
    setDb((d) => ({ ...d, programs: d.programs.filter((p) => p.id !== id) })), []);

  /* ----- meal plans ----- */
  const addMealPlan = useCallback((m: Partial<MealPlan>): MealPlan => {
    const plan: MealPlan = {
      id: uid("m"), name: m.name ?? "New Meal Plan", calories: m.calories ?? 2000,
      protein: m.protein ?? 150, carbs: m.carbs ?? 200, fat: m.fat ?? 60,
      meals: m.meals ?? [], tag: m.tag ?? "Custom",
      ...(m.media ? { media: m.media } : {}),
      ...(m.clientId ? { clientId: m.clientId } : {}),
    };
    setDb((d) => ({ ...d, mealPlans: [plan, ...d.mealPlans] }));
    return plan;
  }, []);
  const updateMealPlan = useCallback((id: string, patch: Partial<MealPlan>) =>
    setDb((d) => ({ ...d, mealPlans: d.mealPlans.map((m) => (m.id === id ? { ...m, ...patch } : m)) })), []);
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
      memberSync({ kind: "message", text });
    }
  }, [memberSync]);

  // Resolve the signed-in member's own client id (for bookings, challenges, etc).
  const myClientId = useCallback((): string | null => {
    const sess = sessionRef.current;
    if (sess?.role !== "member") return dbRef.current.currentClientId;
    const d = dbRef.current;
    return (
      d.clients.find((x) => x.id === sess.clientId)?.id ??
      d.clients.find((x) => x.email.toLowerCase() === sess.email.toLowerCase())?.id ??
      null
    );
  }, []);

  /* ----- appointments ----- */
  const addAppointment = useCallback((a: Partial<Appointment>): Appointment => {
    const isMember = sessionRef.current?.role === "member";
    const appt: Appointment = {
      id: uid("a"), title: a.title ?? "New Event", clientId: a.clientId ?? "",
      day: a.day ?? 0, start: a.start ?? "09:00", end: a.end ?? "10:00",
      type: a.type ?? "session",
      ...(a.date ? { date: a.date } : {}),
      ...(a.requestedByClient || isMember ? { requestedByClient: true } : {}),
    };
    setDb((d) => ({ ...d, appointments: [...d.appointments, appt] }));
    // A member booking with their coach is persisted server-side safely so it
    // shows on the trainer's calendar too.
    if (isMember) memberSync({ kind: "appointment", appointment: appt });
    return appt;
  }, [memberSync]);
  const removeAppointment = useCallback((id: string) => {
    setDb((d) => ({ ...d, appointments: d.appointments.filter((a) => a.id !== id) }));
    if (sessionRef.current?.role === "member") {
      memberSync({ kind: "appointment-remove", appointmentId: id });
    }
  }, [memberSync]);
  // A member claims a trainer-published open slot (clientId === "").
  const bookAppointment = useCallback((id: string) => {
    const cid = myClientId();
    if (!cid) return;
    setDb((d) => ({
      ...d,
      appointments: d.appointments.map((a) => (a.id === id ? { ...a, clientId: cid } : a)),
    }));
    if (sessionRef.current?.role === "member") {
      memberSync({ kind: "appointment-book", appointmentId: id });
    }
  }, [myClientId, memberSync]);

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
  // Members can't PUT the workspace, so challenge changes persist via the safe
  // endpoint (sends the merged array — challenges are shared and small).
  const syncChallenges = useCallback((challenges: Challenge[]) => {
    if (sessionRef.current?.role === "member") {
      memberSync({ kind: "challenges", challenges });
    }
  }, [memberSync]);

  const addChallenge = useCallback((c: Partial<Challenge>) => {
    const ch: Challenge = {
      id: uid("ch"), name: c.name ?? "New Challenge", desc: c.desc ?? "",
      metric: c.metric ?? "Workouts", daysLeft: c.daysLeft ?? 30,
      participants: c.participants ?? 0, joined: false, joinedBy: [],
      color: c.color ?? "from-brand-500 to-brand-700",
    };
    setDb((d) => ({ ...d, challenges: [ch, ...d.challenges] }));
  }, []);

  const toggleJoinChallenge = useCallback((id: string) => {
    const cid = myClientId();
    if (!cid) return;
    setDb((d) => {
      const challenges = d.challenges.map((c) => {
        if (c.id !== id) return c;
        const joinedBy = c.joinedBy ?? [];
        const isIn = joinedBy.includes(cid);
        const nextJoined = isIn ? joinedBy.filter((x) => x !== cid) : [...joinedBy, cid];
        return { ...c, joinedBy: nextJoined, joined: nextJoined.length > 0 };
      });
      syncChallenges(challenges);
      return { ...d, challenges };
    });
  }, [myClientId, syncChallenges]);

  const removeChallenge = useCallback((id: string) =>
    setDb((d) => ({ ...d, challenges: d.challenges.filter((c) => c.id !== id) })), []);

  const markChallengeDay = useCallback((challengeId: string, clientId: string, date: string, remove = false) => {
    setDb((d) => {
      const challenges = d.challenges.map((c) => {
        if (c.id !== challengeId) return c;
        const prev = c.dailyMarks?.[clientId] ?? [];
        const next = remove ? prev.filter((x) => x !== date) : [...new Set([...prev, date])];
        return { ...c, dailyMarks: { ...(c.dailyMarks ?? {}), [clientId]: next } };
      });
      syncChallenges(challenges);
      return { ...d, challenges };
    });
  }, [syncChallenges]);

  /* ----- community feed (shared coach ↔ members) ----- */
  // Identify who is posting/liking right now (member → their client record,
  // staff → the coach identity from settings).
  const currentAuthor = useCallback(() => {
    const d = dbRef.current;
    const sess = sessionRef.current;
    const initials = (name: string) =>
      name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "ME";
    if (sess?.role === "member") {
      const c =
        d.clients.find((x) => x.id === sess.clientId) ??
        d.clients.find((x) => x.email.toLowerCase() === sess.email.toLowerCase());
      const name = c?.name ?? sess.name ?? "Member";
      return { author: name, avatar: c?.avatar ?? initials(name), coach: false, id: c?.id ?? sess.email };
    }
    const name = d.settings.trainerName || sess?.name || "Coach";
    return { author: name, avatar: initials(name), coach: true, id: sess?.email ?? "coach" };
  }, []);

  const syncCommunity = useCallback((posts: CommunityPost[]) => {
    // Members can't PUT the workspace, so persist the feed via the safe endpoint.
    if (sessionRef.current?.role === "member") {
      memberSync({ kind: "community", communityPosts: posts });
    }
  }, [memberSync]);

  const addCommunityPost = useCallback((text: string) => {
    const body = text.trim();
    if (!body) return;
    const a = currentAuthor();
    const post: CommunityPost = {
      id: uid("post"), author: a.author, avatar: a.avatar, coach: a.coach,
      text: body, ts: Date.now(), likedBy: [], comments: [],
    };
    setDb((d) => {
      const posts = [post, ...d.communityPosts];
      syncCommunity(posts);
      return { ...d, communityPosts: posts };
    });
  }, [currentAuthor, syncCommunity]);

  const toggleCommunityLike = useCallback((postId: string) => {
    const a = currentAuthor();
    setDb((d) => {
      const posts = d.communityPosts.map((p) => {
        if (p.id !== postId) return p;
        const liked = p.likedBy.includes(a.id);
        return { ...p, likedBy: liked ? p.likedBy.filter((x) => x !== a.id) : [...p.likedBy, a.id] };
      });
      syncCommunity(posts);
      return { ...d, communityPosts: posts };
    });
  }, [currentAuthor, syncCommunity]);

  const addCommunityComment = useCallback((postId: string, text: string) => {
    const body = text.trim();
    if (!body) return;
    const a = currentAuthor();
    const comment: CommunityComment = {
      id: uid("cm"), author: a.author, avatar: a.avatar, coach: a.coach, text: body, ts: Date.now(),
    };
    setDb((d) => {
      const posts = d.communityPosts.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p,
      );
      syncCommunity(posts);
      return { ...d, communityPosts: posts };
    });
  }, [currentAuthor, syncCommunity]);

  const removeCommunityPost = useCallback((postId: string) => {
    setDb((d) => {
      const posts = d.communityPosts.filter((p) => p.id !== postId);
      syncCommunity(posts);
      return { ...d, communityPosts: posts };
    });
  }, [syncCommunity]);

  /* ----- classes (trainer-published, shared) ----- */
  const syncClasses = useCallback((classes: GymClass[]) => {
    if (sessionRef.current?.role === "member") memberSync({ kind: "classes", classes });
  }, [memberSync]);

  const addClass = useCallback((c: Partial<GymClass>) => {
    const cls: GymClass = {
      id: uid("cls"), title: c.title ?? "New Class", category: c.category ?? "General",
      durationMin: c.durationMin ?? 30, type: c.type ?? "live",
      ...(c.date ? { date: c.date } : {}),
      ...(c.videoUrl ? { videoUrl: c.videoUrl } : {}),
      ...(c.thumbUrl ? { thumbUrl: c.thumbUrl } : {}),
      enrolledBy: [],
    };
    setDb((d) => ({ ...d, classes: [cls, ...d.classes] }));
  }, []);

  const removeClass = useCallback((id: string) =>
    setDb((d) => ({ ...d, classes: d.classes.filter((c) => c.id !== id) })), []);

  const toggleClassEnroll = useCallback((id: string) => {
    const cid = myClientId();
    if (!cid) return;
    setDb((d) => {
      const classes = d.classes.map((c) => {
        if (c.id !== id) return c;
        const enrolled = c.enrolledBy ?? [];
        const isIn = enrolled.includes(cid);
        return { ...c, enrolledBy: isIn ? enrolled.filter((x) => x !== cid) : [...enrolled, cid] };
      });
      syncClasses(classes);
      return { ...d, classes };
    });
  }, [myClientId, syncClasses]);

  /* ----- ai ----- */
  const resolveSuggestion = useCallback((id: string, status: "approved" | "dismissed" | "pending") =>
    setDb((d) => ({
      ...d,
      aiSuggestions: d.aiSuggestions.map((s) => (s.id === id ? { ...s, status } : s)),
    })), []);

  /* ----- checkins ----- */
  const addCheckin = useCallback((
    clientId: string,
    answers: Record<string, string | number>,
    meta?: { formId?: string; formName?: string },
  ) => {
    const ci: CheckIn = {
      id: uid("ci"), clientId, date: new Date().toISOString(), answers,
      formId: meta?.formId, formName: meta?.formName,
    };
    // A weight answer also feeds the body-weight log so the trainer's chart
    // and headline current weight update the moment a check-in is submitted.
    const w = Number(answers.weight);
    const logsWeight = Number.isFinite(w) && w > 0;
    setDb((d) => ({
      ...d,
      checkins: [ci, ...d.checkins],
      ...(logsWeight
        ? {
            weightLogs: {
              ...d.weightLogs,
              [clientId]: [{ date: new Date().toISOString(), weight: w }, ...(d.weightLogs[clientId] ?? [])],
            },
            clients: d.clients.map((c) => (c.id === clientId ? { ...c, currentWeight: w, lastActive: "Just now" } : c)),
          }
        : {}),
    }));
    if (sessionRef.current?.role === "member") {
      memberSync({ kind: "checkin", answers, formId: meta?.formId, formName: meta?.formName });
    }
  }, [memberSync]);

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

  /* ----- form-check video tasks ----- */
  // Coach requests a clip from a client — shows up as an assigned task, like
  // check-ins / weigh-ins.
  const requestFormCheck = useCallback((clientId: string, exercise: string, note?: string) => {
    const req: FormCheckRequest = {
      id: uid("fcr"), exercise: exercise.trim() || "Form check",
      note: note?.trim() || undefined, requestedAt: new Date().toISOString(), status: "pending",
    };
    setDb((d) => ({
      ...d,
      formCheckRequests: { ...d.formCheckRequests, [clientId]: [req, ...(d.formCheckRequests[clientId] ?? [])] },
    }));
  }, []);
  const removeFormCheckRequest = useCallback((clientId: string, id: string) =>
    setDb((d) => ({
      ...d,
      formCheckRequests: { ...d.formCheckRequests, [clientId]: (d.formCheckRequests[clientId] ?? []).filter((r) => r.id !== id) },
    })), []);
  // Member submits a video, either fulfilling a specific pending request or
  // (requestId === null) creating a new ad-hoc submission on their own.
  const submitFormCheckVideo = useCallback((
    clientId: string,
    requestId: string | null,
    video: { url: string; name?: string; exercise: string },
  ) => {
    const now = new Date().toISOString();
    setDb((d) => {
      const list = d.formCheckRequests[clientId] ?? [];
      const next = requestId
        ? list.map((r) =>
            r.id === requestId
              ? { ...r, status: "submitted" as const, videoUrl: video.url, videoName: video.name, submittedAt: now }
              : r,
          )
        : [
            {
              id: uid("fcr"), exercise: video.exercise.trim() || "Form check",
              requestedAt: now, status: "submitted" as const,
              videoUrl: video.url, videoName: video.name, submittedAt: now,
            },
            ...list,
          ];
      return { ...d, formCheckRequests: { ...d.formCheckRequests, [clientId]: next } };
    });
    if (sessionRef.current?.role === "member") {
      memberSync({ kind: "formcheck-submit", requestId, video });
    }
  }, [memberSync]);
  // Coach marks a submission as reviewed, attaching the feedback so the client
  // sees it in their portal (paired with saving a coach-private FormReview).
  const markFormCheckReviewed = useCallback((clientId: string, id: string, review?: FormCheckRequest["review"]) =>
    setDb((d) => ({
      ...d,
      formCheckRequests: {
        ...d.formCheckRequests,
        [clientId]: (d.formCheckRequests[clientId] ?? []).map((r) =>
          r.id === id ? { ...r, status: "reviewed" as const, ...(review ? { review } : {}) } : r),
      },
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
  const toggleAssignedForm = useCallback((clientId: string, formId: string) =>
    setDb((d) => {
      const plan = d.clientPlans[clientId] ?? { workoutIds: [] };
      const current = plan.formIds ?? [];
      const has = current.includes(formId);
      const formIds = has ? current.filter((id) => id !== formId) : [...current, formId];
      return { ...d, clientPlans: { ...d.clientPlans, [clientId]: { ...plan, formIds } } };
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
      // Adherence/progress are derived live from completions — just stamp activity.
      clients: d.clients.map((c) => (c.id === clientId ? { ...c, lastActive: "Just now" } : c)),
    }));
    // Members persist via the dedicated endpoint (they can't bulk-save).
    if (sessionRef.current?.role === "member") {
      memberSync({ kind: "workout", completion: summary });
    }
  }, [memberSync]);

  /* ----- progress photos ----- */
  const addPhoto = useCallback((clientId: string, url: string) => {
    const photo: ProgressPhoto = {
      id: uid("pp"),
      label: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      date: new Date().toISOString(),
      url,
    };
    setDb((d) => ({ ...d, photos: { ...d.photos, [clientId]: [...(d.photos[clientId] ?? []), photo] } }));
    if (sessionRef.current?.role === "member") memberSync({ kind: "photo", photo });
  }, [memberSync]);
  const removePhoto = useCallback((clientId: string, id: string) => {
    setDb((d) => ({ ...d, photos: { ...d.photos, [clientId]: (d.photos[clientId] ?? []).filter((p) => p.id !== id) } }));
    if (sessionRef.current?.role === "member") memberSync({ kind: "photo-remove", photoId: id });
  }, [memberSync]);

  /* ----- member bodyweight log ----- */
  const logWeight = useCallback((clientId: string, weight: number) => {
    const entry: WeightEntry = { date: new Date().toISOString(), weight };
    setDb((d) => ({
      ...d,
      weightLogs: { ...d.weightLogs, [clientId]: [entry, ...(d.weightLogs[clientId] ?? [])] },
      // Headline weight drives derived progress; just store it + stamp activity.
      clients: d.clients.map((c) => (c.id === clientId ? { ...c, currentWeight: weight, lastActive: "Just now" } : c)),
    }));
    if (sessionRef.current?.role === "member") memberSync({ kind: "weight", weight });
  }, [memberSync]);

  /* ----- trainer assignment (admin) ----- */
  const assignCoach = useCallback((clientId: string, coachEmail: string, coachName: string) =>
    setDb((d) => ({
      ...d,
      clients: d.clients.map((c) =>
        c.id === clientId ? { ...c, coachEmail: coachEmail || undefined, coachName: coachName || undefined } : c,
      ),
    })), []);

  /* ----- member nutrition diary ----- */
  const setNutritionLog = useCallback((clientId: string, log: NutritionLog) => {
    const stamped: NutritionLog = { ...log, updatedAt: Date.now() };
    setDb((d) => ({ ...d, nutritionLogs: { ...d.nutritionLogs, [clientId]: stamped } }));
    if (sessionRef.current?.role === "member") memberSync({ kind: "nutrition", log: stamped });
  }, [memberSync]);

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

  // Expose clients with adherence/progress DERIVED live from real activity, so
  // every view (dashboard, roster, client detail, the member's own portal)
  // reflects what the client has actually logged — and updates as data syncs.
  const clientsWithMetrics = useMemo(
    () =>
      db.clients.map((c) => ({
        ...c,
        adherence: clientAdherence(c.id, db, c.adherence),
        progress: clientProgress(c.id, c, db, c.progress),
      })),
    [db],
  );

  const value = useMemo<AppContextValue>(() => ({
    ...db, clients: clientsWithMetrics, hydrated, session, signOut,
    set, loadStarterContent, resetAll,
    addForm, updateForm, removeForm,
    addClient, updateClient, removeClient, setCurrentClient,
    addExercise, updateExercise, removeExercise,
    addWorkout, updateWorkout, removeWorkout,
    addProgram, updateProgram, removeProgram,
    addMealPlan, updateMealPlan, removeMealPlan,
    sendMessage,
    addAppointment, removeAppointment, bookAppointment,
    addCard, moveCard, removeCard,
    addChallenge, toggleJoinChallenge, removeChallenge, markChallengeDay,
    addCommunityPost, toggleCommunityLike, addCommunityComment, removeCommunityPost,
    addClass, removeClass, toggleClassEnroll,
    resolveSuggestion,
    addCheckin,
    addFormReview, deleteFormReview, addClientNote, setRecoveryNote,
    requestFormCheck, removeFormCheckRequest, submitFormCheckVideo, markFormCheckReviewed,
    toggleAssignedWorkout, toggleAssignedForm, setClientProgram, setClientMealPlan, completeWorkout,
    addPhoto, removePhoto, setNutritionLog, logWeight, assignCoach, refresh,
    addUser, updateUser, removeUser,
    addBroadcast,
    updateSettings,
  }), [
    db, clientsWithMetrics, hydrated, session, signOut, set, loadStarterContent, resetAll, addForm, updateForm, removeForm,
    addClient, updateClient, removeClient,
    setCurrentClient, addExercise, updateExercise, removeExercise, addWorkout, updateWorkout, removeWorkout,
    addProgram, updateProgram, removeProgram, addMealPlan, updateMealPlan, removeMealPlan, sendMessage, addAppointment,
    removeAppointment, bookAppointment, addCard, moveCard, removeCard, addChallenge, toggleJoinChallenge, removeChallenge, markChallengeDay,
    addCommunityPost, toggleCommunityLike, addCommunityComment, removeCommunityPost,
    addClass, removeClass, toggleClassEnroll,
    resolveSuggestion, addCheckin, addFormReview, deleteFormReview, addClientNote, setRecoveryNote,
    requestFormCheck, removeFormCheckRequest, submitFormCheckVideo, markFormCheckReviewed,
    toggleAssignedWorkout, toggleAssignedForm, setClientProgram, setClientMealPlan, completeWorkout,
    addPhoto, removePhoto, setNutritionLog, logWeight, assignCoach, refresh,
    addUser, updateUser, removeUser, addBroadcast, updateSettings,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

/**
 * The clients the signed-in staff member should see: owner/admin see everyone;
 * a coach sees only clients assigned to them.
 */
export function useMyClients() {
  const { clients, session } = useApp();
  if (session?.role === "coach") {
    const me = session.email.toLowerCase();
    return clients.filter((c) => (c.coachEmail ?? "").toLowerCase() === me);
  }
  return clients;
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
