"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MessageSquare, Pencil, Trash2, Scale, Target, Flag, Activity,
  Dumbbell, Calendar, Sparkles, Clock, Layers, LineChart, Loader2, Images,
  Mail, Check, KeyRound, X, Apple, CheckCircle2, ClipboardCheck, UserCog, FileText, Plus,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { PhotoCompare } from "@/components/PhotoCompare";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { ShareInvite } from "@/components/ui/ShareInvite";
import { MediaEditor } from "@/components/MediaEditor";
import { WorkoutBuilder } from "@/components/WorkoutBuilder";
import { WeightChart, AdherenceRing } from "@/components/dashboard/Charts";
import { useApp } from "@/lib/store";
import { type ClientStatus, type TrainingMedia } from "@/lib/data";
import { cn } from "@/lib/utils";

const statusBadge: Record<ClientStatus, string> = {
  active: "bg-accent-500/15 text-accent-400",
  pending: "bg-amber-500/15 text-amber-400",
  inactive: "bg-ink-100 text-ink-600",
};

const tabs = ["Overview", "Training", "Progress", "Photos", "Notes"] as const;
type Tab = (typeof tabs)[number];

interface Note {
  author: string;
  time: string;
  text: string;
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const {
    clients, updateClient, removeClient, seeded, hydrated, clientNotes, addClientNote, settings,
    workouts: libWorkouts, programs, mealPlans, forms, clientPlans, completions, photos,
    weightLogs, checkins, nutritionLogs, session, assignCoach,
    toggleAssignedWorkout, toggleAssignedForm, setClientProgram, setClientMealPlan, addPhoto, removePhoto,
    addMealPlan, updateMealPlan, addWorkout,
  } = useApp();
  const [coaches, setCoaches] = useState<{ email: string; name: string; role: string }[]>([]);
  const router = useRouter();
  const c = clients.find((x) => x.id === params.id);

  const [tab, setTab] = useState<Tab>("Overview");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Build / edit an assigned workout's warm-ups, exercises & rest inline,
  // right here on the client's profile.
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [newWorkoutName, setNewWorkoutName] = useState("");

  // Create / edit a client-specific meal plan straight from the client profile.
  const [mealOpen, setMealOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [mealForm, setMealForm] = useState({ name: "", calories: "2000", protein: "150", carbs: "200", fat: "60" });
  const [mealMedia, setMealMedia] = useState<TrainingMedia[]>([]);
  const [mealRows, setMealRows] = useState<{ name: string; kcal: string; items: string }[]>([{ name: "", kcal: "", items: "" }]);

  const [edit, setEdit] = useState({
    name: "",
    email: "",
    phone: "",
    goal: "",
    program: "",
    status: "active" as ClientStatus,
    currentWeight: "",
    goalWeight: "",
    startWeight: "",
    progress: "",
    adherence: "",
    tags: "",
  });

  // Coach notes persist in the shared workspace, keyed by client.
  const notes = clientNotes[params.id] ?? [];
  const [draft, setDraft] = useState("");

  // App-access status for this client (derived from accounts) + invite flow.
  const [access, setAccess] = useState<"invited" | "active" | "suspended" | null>(null);
  const [accessBusy, setAccessBusy] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteRes, setInviteRes] = useState<{ url: string; sent: boolean; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/clients/access")
      .then((r) => (r.ok ? r.json() : { access: {} }))
      .then((d) => { if (active) setAccess(d.access?.[params.id] ?? null); })
      .catch(() => {});
    return () => { active = false; };
  }, [params.id]);

  // Owner/admin can reassign the client's trainer — load the coach list.
  const isStaffAdmin = session?.role === "owner" || session?.role === "admin";
  useEffect(() => {
    if (!isStaffAdmin) return;
    let active = true;
    fetch("/api/accounts")
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => {
        if (!active) return;
        const list = (d.accounts ?? []).filter(
          (a: { role: string }) => a.role === "coach" || a.role === "admin" || a.role === "owner",
        );
        setCoaches(list);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [isStaffAdmin]);

  async function inviteToApp() {
    if (!c?.email || inviting) return;
    setInviting(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: c.name, email: c.email, role: "Client", clientId: c.id, businessName: settings.businessName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not create the invitation.");
      setInviteRes({ url: data.inviteUrl, sent: !!data.sent, error: data.error });
      setAccess("invited");
    } catch (e) {
      setInviteRes({ url: "", sent: false, error: e instanceof Error ? e.message : "Invite failed." });
    } finally {
      setInviting(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteRes?.url) return;
    try {
      await navigator.clipboard.writeText(inviteRes.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (!hydrated) return <Loading />;

  // A coach may only open clients assigned to them.
  const coachBlocked =
    !!c && session?.role === "coach" &&
    (c.coachEmail ?? "").toLowerCase() !== session.email.toLowerCase();

  if (!c || coachBlocked) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-xl font-bold text-ink-900">
          {coachBlocked ? "Not your client" : "Client not found"}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          {coachBlocked
            ? "This client is assigned to another trainer."
            : "This client may have been removed."}
        </p>
        <Link href="/dashboard/clients" className="btn-primary mt-6 inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </Link>
      </div>
    );
  }

  // Assignment plan for this client.
  const plan = clientPlans[c.id] ?? { workoutIds: [] };
  const assignedWorkouts = plan.workoutIds
    .map((id) => libWorkouts.find((w) => w.id === id))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));
  const unassignedWorkouts = libWorkouts.filter((w) => !plan.workoutIds.includes(w.id));
  const assignedFormIds = plan.formIds ?? [];
  const assignedForms = assignedFormIds
    .map((id) => forms.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));
  const unassignedForms = forms.filter((f) => !assignedFormIds.includes(f.id));
  const sessions = completions[c.id] ?? [];
  const clientPhotos = photos[c.id] ?? [];
  const weightLog = weightLogs[c.id] ?? [];
  const clientCheckins = checkins.filter((ci) => ci.clientId === c.id);
  const nutrition = nutritionLogs[c.id];
  const weightChart = [...weightLog]
    .slice(0, 30)
    .reverse()
    .map((w) => ({
      week: new Date(w.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight: w.weight,
      target: c.goalWeight,
    }));

  async function handleCoachPhoto(dataUrl?: string) {
    if (!dataUrl || !c) return;
    setUploadingPhoto(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (data.url) addPhoto(c.id, data.url);
    } catch {
      /* ignore */
    } finally {
      setUploadingPhoto(false);
    }
  }

  const joined = new Date(c.joinedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weightDelta = c.currentWeight - c.startWeight;

  function openEdit() {
    if (!c) return;
    setEdit({
      name: c.name,
      email: c.email,
      phone: c.phone,
      goal: c.goal,
      program: c.program,
      status: c.status,
      currentWeight: String(c.currentWeight),
      goalWeight: String(c.goalWeight),
      startWeight: String(c.startWeight),
      progress: String(c.progress),
      adherence: String(c.adherence),
      tags: c.tags.join(", "),
    });
    setEditOpen(true);
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!c) return;
    updateClient(c.id, {
      name: edit.name.trim() || c.name,
      email: edit.email.trim(),
      phone: edit.phone.trim(),
      goal: edit.goal.trim() || c.goal,
      program: edit.program.trim() || "Unassigned",
      status: edit.status,
      currentWeight: edit.currentWeight ? Number(edit.currentWeight) : 0,
      goalWeight: edit.goalWeight ? Number(edit.goalWeight) : 0,
      startWeight: edit.startWeight ? Number(edit.startWeight) : 0,
      progress: edit.progress ? Number(edit.progress) : 0,
      adherence: edit.adherence ? Number(edit.adherence) : 0,
      tags: edit.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setEditOpen(false);
  }

  async function confirmDelete() {
    if (!c) return;
    // Revoke the login first so a removed client can never sign back in, then
    // purge their data from the workspace.
    try {
      await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", email: c.email, clientId: c.id }),
      });
    } catch {
      /* best effort — workspace removal still proceeds */
    }
    removeClient(c.id);
    router.push("/dashboard/clients");
  }

  // Suspend or restore the client's app login. Suspended clients keep their data
  // but can't sign in until restored.
  async function toggleAccess(suspend: boolean) {
    if (!c || accessBusy) return;
    setAccessBusy(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: suspend ? "suspend" : "activate", email: c.email, clientId: c.id }),
      });
      if (res.ok) {
        setAccess(suspend ? "suspended" : "active");
        updateClient(c.id, { status: suspend ? "inactive" : "active" });
      }
    } catch {
      /* ignore */
    } finally {
      setAccessBusy(false);
    }
  }

  function saveNote() {
    const text = draft.trim();
    if (!text) return;
    const time = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    addClientNote(params.id, { author: "You", time, text });
    setDraft("");
  }

  // Open the modal to create a brand-new client-specific plan.
  function openCreateMeal() {
    setEditingMealId(null);
    setMealForm({ name: "", calories: "2000", protein: "150", carbs: "200", fat: "60" });
    setMealMedia([]);
    setMealRows([{ name: "", kcal: "", items: "" }]);
    setMealOpen(true);
  }

  // Open the modal to edit/customise the currently-prescribed plan for THIS
  // client. A shared template is cloned into a client-specific copy on save so
  // edits never affect other clients.
  function openEditMeal() {
    if (!c) return;
    const current = mealPlans.find((m) => m.id === clientPlans[c.id]?.mealPlanId);
    if (!current) { openCreateMeal(); return; }
    // Editing in place only when it's already this client's own plan.
    setEditingMealId(current.clientId === c.id ? current.id : null);
    setMealForm({
      name: current.clientId === c.id ? current.name : `${current.name} — ${c.name.split(" ")[0]}`,
      calories: String(current.calories), protein: String(current.protein),
      carbs: String(current.carbs), fat: String(current.fat),
    });
    setMealMedia(current.media ?? []);
    setMealRows(
      current.meals.length
        ? current.meals.map((m) => ({ name: m.name, kcal: String(m.kcal), items: m.items.join(", ") }))
        : [{ name: "", kcal: "", items: "" }],
    );
    setMealOpen(true);
  }

  // Create or update a client-specific meal plan and prescribe it.
  function submitMealPlan() {
    if (!c) return;
    const name = mealForm.name.trim();
    if (!name) return;
    const meals = mealRows
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        kcal: Number(r.kcal) || 0,
        items: r.items.split(",").map((i) => i.trim()).filter(Boolean),
      }));
    const payload = {
      name,
      calories: Number(mealForm.calories) || 0,
      protein: Number(mealForm.protein) || 0,
      carbs: Number(mealForm.carbs) || 0,
      fat: Number(mealForm.fat) || 0,
      tag: "Custom",
      meals,
      media: mealMedia.length ? mealMedia : undefined,
      clientId: c.id, // always client-specific
    };
    if (editingMealId) {
      updateMealPlan(editingMealId, payload);
      setClientMealPlan(c.id, editingMealId);
    } else {
      const m = addMealPlan(payload);
      setClientMealPlan(c.id, m.id);
    }
    setMealOpen(false);
  }

  // Create a brand-new workout, assign it to this client, and open its
  // builder immediately so it can be built out right here.
  function createAndAssignWorkout() {
    if (!c) return;
    const name = newWorkoutName.trim();
    if (!name) return;
    const w = addWorkout({ name, category: "Strength", durationMin: 45, difficulty: "Beginner", exercises: [] });
    toggleAssignedWorkout(c.id, w.id);
    setNewWorkoutName("");
    setExpandedWorkoutId(w.id);
  }

  return (
    <>
      <Link
        href="/dashboard/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to clients
      </Link>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar initials={c.avatar} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-ink-900">{c.name}</h1>
                <span className={cn("badge", statusBadge[c.status])}>
                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-500">{c.email}</p>
              <p className="text-sm text-ink-500">{c.phone}</p>
              {c.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.tags.map((t) => (
                    <span key={t} className="badge bg-brand-500/15 text-brand-400">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {access === "active" ? (
              <>
                <span className="badge bg-accent-500/15 text-accent-400"><KeyRound className="h-3 w-3" /> Has app login</span>
                <button
                  className="btn-secondary text-amber-500 hover:bg-amber-500/15"
                  onClick={() => toggleAccess(true)}
                  disabled={accessBusy}
                  title="Block this client from signing in"
                >
                  {accessBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Suspend access
                </button>
              </>
            ) : access === "suspended" ? (
              <>
                <span className="badge bg-amber-500/15 text-amber-500"><KeyRound className="h-3 w-3" /> Access suspended</span>
                <button
                  className="btn-secondary text-accent-500 hover:bg-accent-500/15"
                  onClick={() => toggleAccess(false)}
                  disabled={accessBusy}
                  title="Let this client sign in again"
                >
                  {accessBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Restore access
                </button>
              </>
            ) : (
              <button
                className="btn-secondary"
                onClick={inviteToApp}
                disabled={!c.email || inviting}
                title={!c.email ? "Add an email first" : undefined}
              >
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {access === "invited" ? "Re-invite" : "Invite to app"}
              </button>
            )}
            <Link href="/dashboard/messages" className="btn-secondary">
              <MessageSquare className="h-4 w-4" />
              Message
            </Link>
            <button className="btn-primary" onClick={openEdit}>
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Quick stat tiles */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Scale} label="Current weight" value={`${c.currentWeight} lb`} hint={`${weightDelta >= 0 ? "+" : ""}${weightDelta} lb vs start`} />
        <StatTile icon={Target} label="Goal weight" value={`${c.goalWeight} lb`} />
        <StatTile icon={Flag} label="Start weight" value={`${c.startWeight} lb`} />
        <StatTile icon={Activity} label="Adherence" value={`${c.adherence}%`} />
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-ink-100">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t ? "text-brand-400" : "text-ink-500 hover:text-ink-900",
            )}
          >
            {t}
            {tab === t && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-2">
              <h2 className="font-semibold text-ink-900">Goal progress</h2>
              <p className="text-sm text-ink-500">{c.goal}</p>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-sm text-ink-600">
                  <span>Progress to goal</span>
                  <span className="font-semibold text-ink-900">{c.progress}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoRow icon={Dumbbell} label="Program" value={c.program} />
                <InfoRow icon={Calendar} label="Joined" value={joined} />
              </div>

              {/* Trainer assignment (owner/admin only) */}
              {isStaffAdmin && (
                <div className="mt-6 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                  <label className="label flex items-center gap-1.5">
                    <UserCog className="h-3.5 w-3.5" /> Assigned trainer
                  </label>
                  <select
                    className="input"
                    value={c.coachEmail ?? ""}
                    onChange={(e) => {
                      const coach = coaches.find((co) => co.email === e.target.value);
                      assignCoach(c.id, e.target.value, coach?.name ?? "");
                    }}
                  >
                    <option value="">Unassigned</option>
                    {coaches.map((co) => (
                      <option key={co.email} value={co.email}>{co.name} · {co.role}</option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-ink-400">
                    Only this trainer (plus you) sees this client and their conversations.
                  </p>
                </div>
              )}

              <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-400" />
                  <h3 className="font-semibold text-ink-900">AI insights</h3>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-ink-600">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    Adherence is at {c.adherence}% — {c.adherence >= 85 ? "well above target, momentum is strong." : c.adherence >= 60 ? "steady, but a nudge could push it higher." : "below target; consider a re-engagement check-in."}
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    Weight has moved from {c.startWeight} lb to {c.currentWeight} lb, with {Math.abs(c.goalWeight - c.currentWeight)} lb left to the {c.goalWeight} lb goal.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {c.progress}% of the way through &ldquo;{c.goal}&rdquo; on the {c.program} program. Last active {c.lastActive.toLowerCase()}.
                  </li>
                </ul>
              </div>
            </div>

            <div className="card flex flex-col p-6">
              <h2 className="font-semibold text-ink-900">Adherence</h2>
              <p className="text-sm text-ink-500">Workouts completed</p>
              <div className="mt-2 flex flex-1 items-center justify-center">
                <AdherenceRing value={c.adherence} />
              </div>
            </div>
          </div>
        )}

        {tab === "Training" && (
          <div className="space-y-6">
            {/* Program + nutrition assignment */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="card p-6">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-brand-400" />
                  <h2 className="font-semibold text-ink-900">Program</h2>
                </div>
                <p className="mt-1 text-sm text-ink-500">Assign a program template to {c.name.split(" ")[0]}.</p>
                <select
                  className="input mt-4"
                  value={plan.programId ?? ""}
                  onChange={(e) => setClientProgram(c.id, e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {(() => {
                  const prog = plan.programId ? programs.find((p) => p.id === plan.programId) : null;
                  if (!prog) return null;
                  const n = prog.workoutIds?.length ?? 0;
                  return (
                    <p className="mt-2 text-xs text-ink-500">
                      <span className="font-medium text-ink-700">{prog.name}</span> delivers {n} workout{n === 1 ? "" : "s"} ·
                      {" "}{prog.weeks} wk · {prog.workoutsPerWeek}×/wk. These are added below automatically and update if you switch programs — you can still add or remove individual workouts.
                    </p>
                  );
                })()}
                {programs.length === 0 && (
                  <p className="mt-2 text-xs text-ink-400">
                    No programs yet — create them in <Link href="/dashboard/program-builder" className="text-brand-400">Program Builder</Link> or load starter content.
                  </p>
                )}
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Apple className="h-5 w-5 text-accent-400" />
                    <h2 className="font-semibold text-ink-900">Nutrition plan</h2>
                  </div>
                  <button className="btn-secondary px-2.5 py-1.5 text-xs" onClick={openCreateMeal}>
                    <Plus className="h-3.5 w-3.5" /> New for {c.name.split(" ")[0]}
                  </button>
                </div>
                <p className="mt-1 text-sm text-ink-500">Prescribe a plan {c.name.split(" ")[0]} will see — a shared template or one built just for them.</p>
                <select
                  className="input mt-4"
                  value={plan.mealPlanId ?? ""}
                  onChange={(e) => setClientMealPlan(c.id, e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {(() => {
                    const own = mealPlans.filter((m) => m.clientId === c.id);
                    const templates = mealPlans.filter((m) => !m.clientId);
                    return (
                      <>
                        {own.length > 0 && (
                          <optgroup label={`${c.name.split(" ")[0]}'s plans`}>
                            {own.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </optgroup>
                        )}
                        <optgroup label="Templates">
                          {templates.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </optgroup>
                      </>
                    );
                  })()}
                </select>
                {(() => {
                  const current = mealPlans.find((m) => m.id === plan.mealPlanId);
                  if (!current) return null;
                  return (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-ink-100 bg-ink-50/40 p-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-ink-900">{current.name}</div>
                        <div className="text-xs text-ink-400">
                          {current.calories.toLocaleString()} kcal · {current.meals.length} meal{current.meals.length === 1 ? "" : "s"}
                          {current.clientId === c.id ? " · client-specific" : " · template"}
                        </div>
                      </div>
                      <button className="btn-secondary shrink-0 px-2.5 py-1.5 text-xs" onClick={openEditMeal}>
                        <Pencil className="h-3.5 w-3.5" /> {current.clientId === c.id ? "Edit" : "Customize"}
                      </button>
                    </div>
                  );
                })()}
                <p className="mt-2 text-xs text-ink-400">
                  Reusable templates live in <Link href="/dashboard/nutrition" className="text-brand-400">Nutrition</Link>; plans you build here are saved just for {c.name.split(" ")[0]}.
                </p>
              </div>
            </div>

            {/* Assigned workouts */}
            <div className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-brand-400" />
                  <h2 className="font-semibold text-ink-900">Assigned workouts</h2>
                  <span className="badge bg-ink-100 text-ink-600">{assignedWorkouts.length}</span>
                </div>
                <div className="w-full sm:w-64">
                  <select
                    className="input"
                    value=""
                    onChange={(e) => { if (e.target.value) toggleAssignedWorkout(c.id, e.target.value); }}
                    disabled={unassignedWorkouts.length === 0}
                  >
                    <option value="">
                      {unassignedWorkouts.length === 0 ? "All workouts assigned" : "+ Assign from library…"}
                    </option>
                    {unassignedWorkouts.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Create a brand-new workout for this client, right here */}
              <div className="mt-3 flex gap-2">
                <input
                  className="input flex-1"
                  value={newWorkoutName}
                  onChange={(e) => setNewWorkoutName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") createAndAssignWorkout(); }}
                  placeholder={`New workout name (e.g. ${c.name.split(" ")[0]}'s Day 1)`}
                />
                <button className="btn-secondary shrink-0" onClick={createAndAssignWorkout} disabled={!newWorkoutName.trim()}>
                  <Plus className="h-4 w-4" /> Create & build
                </button>
              </div>

              {assignedWorkouts.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    icon={Dumbbell}
                    title="No workouts assigned"
                    description={
                      libWorkouts.length === 0
                        ? "Create a workout above, or assign one from the Training section once you've built your library."
                        : "Create a new workout above, or assign one from the dropdown. The member sees only what's assigned."
                    }
                  />
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {assignedWorkouts.map((w) => {
                    const expanded = expandedWorkoutId === w.id;
                    return (
                      <div key={w.id} className="overflow-hidden rounded-xl border border-ink-100">
                        <div className="flex items-center gap-3 p-3">
                          <button
                            onClick={() => setExpandedWorkoutId(expanded ? null : w.id)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                              <Dumbbell className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink-900">{w.name}</span>
                              <span className="block text-xs text-ink-500">
                                {w.durationMin} min · {w.exercises.length} exercise{w.exercises.length === 1 ? "" : "s"}
                              </span>
                            </span>
                            {expanded
                              ? <ChevronDown className="h-4 w-4 shrink-0 text-ink-400" />
                              : <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" />}
                          </button>
                          <button
                            onClick={() => toggleAssignedWorkout(c.id, w.id)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-400 transition hover:bg-rose-500/15 hover:text-rose-400"
                            aria-label={`Remove ${w.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {expanded && (
                          <div className="border-t border-ink-100 bg-ink-50/40 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                              Build {w.name} — warm-ups, exercises & rest
                            </p>
                            <WorkoutBuilder workoutId={w.id} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="mt-3 text-xs text-ink-400">
                Editing here updates the workout everywhere it&apos;s used (Training library, any program, other clients it&apos;s assigned to). To build a copy just for {c.name.split(" ")[0]}, create a new workout above.
              </p>
            </div>

            {/* Assigned forms */}
            <div className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-400" />
                  <h2 className="font-semibold text-ink-900">Assigned forms</h2>
                  <span className="badge bg-ink-100 text-ink-600">{assignedForms.length}</span>
                </div>
                <div className="w-full sm:w-64">
                  <select
                    className="input"
                    value=""
                    onChange={(e) => { if (e.target.value) toggleAssignedForm(c.id, e.target.value); }}
                    disabled={unassignedForms.length === 0}
                  >
                    <option value="">
                      {forms.length === 0
                        ? "No forms in your library"
                        : unassignedForms.length === 0
                          ? "All forms assigned"
                          : "+ Assign a form…"}
                    </option>
                    {unassignedForms.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {assignedForms.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    icon={FileText}
                    title="No forms assigned"
                    description={
                      forms.length === 0
                        ? "Create forms in the Forms section (or load starter content), then assign them here."
                        : `Use the dropdown above to assign check-in or intake forms. ${c.name.split(" ")[0]} fills them out in their portal and the answers come back to you.`
                    }
                    action={
                      forms.length === 0
                        ? <Link href="/dashboard/form-builder" className="btn-primary">Go to Forms</Link>
                        : undefined
                    }
                  />
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {assignedForms.map((f) => {
                    const submissions = clientCheckins.filter((ci) => ci.formId === f.id).length;
                    return (
                      <div key={f.id} className="rounded-xl border border-ink-100 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                              <FileText className="h-4 w-4" />
                            </span>
                            <h3 className="font-semibold text-ink-900">{f.name}</h3>
                          </div>
                          <button
                            onClick={() => toggleAssignedForm(c.id, f.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-400 transition hover:bg-rose-500/15 hover:text-rose-400"
                            aria-label={`Unassign ${f.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-sm text-ink-500">
                          <ClipboardCheck className="h-4 w-4 text-ink-400" />
                          {submissions > 0
                            ? `${submissions} submission${submissions === 1 ? "" : "s"}`
                            : "Awaiting first submission"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Completed sessions logged by the member */}
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-accent-400" />
                <h2 className="font-semibold text-ink-900">Recent sessions</h2>
                <span className="badge bg-ink-100 text-ink-600">{sessions.length}</span>
              </div>
              <p className="mt-1 text-sm text-ink-500">Workouts {c.name.split(" ")[0]} has logged.</p>
              {sessions.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm text-ink-400">
                  No completed sessions yet — they&apos;ll appear here once the member finishes a workout.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {sessions.slice(0, 10).map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 p-3">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-500" />
                      <span className="font-medium text-ink-900">{s.workoutName}</span>
                      <span className="text-xs text-ink-400">
                        {new Date(s.date).toLocaleDateString()} · {new Date(s.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div className="ml-auto flex items-center gap-3 text-xs text-ink-500">
                        <span>{s.setsLogged} sets</span>
                        {s.volume > 0 && <span>{s.volume.toLocaleString()} vol</span>}
                        {s.avgRpe > 0 && <span>RPE {s.avgRpe}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "Progress" && (
          <div className="space-y-6">
            {/* Weight trend */}
            <div className="card p-6">
              <h2 className="font-semibold text-ink-900">Body weight</h2>
              <p className="text-sm text-ink-500">What {c.name.split(" ")[0]} has logged (lb)</p>
              {weightChart.length >= 2 ? (
                <div className="mt-4"><WeightChart data={weightChart} /></div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm text-ink-400">
                  No weight entries yet — they appear here once the client logs weight.
                </p>
              )}
            </div>

            {/* Activity + nutrition summary */}
            <div className="grid gap-6 sm:grid-cols-3">
              <StatTile icon={Activity} label="Sessions logged" value={`${sessions.length}`} />
              <StatTile icon={ClipboardCheck} label="Check-ins" value={`${clientCheckins.length}`} />
              <StatTile icon={Apple} label="Water today" value={nutrition ? `${nutrition.water} glasses` : "—"} />
            </div>

            {/* Check-ins from the member */}
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-brand-400" />
                <h2 className="font-semibold text-ink-900">Check-ins</h2>
                <span className="badge bg-ink-100 text-ink-600">{clientCheckins.length}</span>
              </div>
              {clientCheckins.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm text-ink-400">
                  No check-ins yet — they show here when {c.name.split(" ")[0]} submits one.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {clientCheckins.slice(0, 8).map((ci) => (
                    <div key={ci.id} className="rounded-xl border border-ink-100 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          {ci.formName && (
                            <span className="block truncate text-sm font-semibold text-ink-900">{ci.formName}</span>
                          )}
                          <span className={cn("text-ink-500", ci.formName ? "text-xs" : "text-sm font-semibold text-ink-900")}>
                            {new Date(ci.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <span className="badge shrink-0 bg-accent-500/15 text-accent-400">Submitted</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
                        {Object.entries(ci.answers).map(([k, v]) =>
                          v === "" || v === undefined ? null : (
                            <span key={k}><span className="text-ink-400">{k}:</span> {String(v)}</span>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "Photos" && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <Images className="h-5 w-5 text-brand-400" />
                <h2 className="font-semibold text-ink-900">Progress photos</h2>
                <span className="badge bg-ink-100 text-ink-600">{clientPhotos.length}</span>
              </div>
              <p className="mt-1 text-sm text-ink-500">
                {c.name.split(" ")[0]}&rsquo;s photos and any you upload — shared between you both.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {clientPhotos.map((p) => (
                  <div key={p.id} className="space-y-1.5">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-ink-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.label} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(c.id, p.id)}
                        title="Remove photo"
                        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-ink-100/80 text-rose-400 shadow-soft transition hover:bg-ink-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-center text-xs font-medium text-ink-500">{p.label}</div>
                  </div>
                ))}
                <ImageUpload aspect="tall" label={uploadingPhoto ? "Uploading…" : "Add photo"} onChange={handleCoachPhoto} />
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2">
                <Images className="h-5 w-5 text-brand-400" />
                <h2 className="font-semibold text-ink-900">Side-by-side review</h2>
              </div>
              <p className="mt-1 text-sm text-ink-500">
                Compare two photos and circle areas directly on the &ldquo;After&rdquo; photo —
                your annotations are saved on this device.
              </p>
              <div className="mt-4">
                <PhotoCompare
                  photos={clientPhotos.map((p) => ({ id: p.id, label: p.label, dataUrl: p.url }))}
                  annotatable
                  storageKey={`ffkc-annotation-${params.id}`}
                />
              </div>
            </div>
          </div>
        )}

        {tab === "Notes" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-2">
              <h2 className="font-semibold text-ink-900">Coach notes</h2>
              <p className="text-sm text-ink-500">History of observations for {c.name}</p>
              <div className="mt-4 space-y-3">
                {notes.length === 0 && (
                  <p className="py-8 text-center text-sm text-ink-400">
                    No notes yet. Add your first observation.
                  </p>
                )}
                {notes.map((n, i) => (
                  <div key={i} className="rounded-xl border border-ink-100 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink-900">{n.author}</span>
                      <span className="text-xs text-ink-400">{n.time}</span>
                    </div>
                    <p className="mt-2 text-sm text-ink-600">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <label htmlFor="new-note" className="label">Add a note</label>
              <textarea
                id="new-note"
                rows={6}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Write a note about ${c.name}…`}
                className="input resize-none"
              />
              <button
                className="btn-primary mt-3 w-full"
                onClick={saveNote}
                disabled={!draft.trim()}
              >
                Save note
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit client"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary text-rose-400 hover:bg-rose-500/15"
              onClick={() => {
                setEditOpen(false);
                setConfirmOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button type="submit" form="edit-client-form" className="btn-primary">
              Save changes
            </button>
          </>
        }
      >
        <form id="edit-client-form" onSubmit={saveEdit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                className="input"
                value={edit.name}
                onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))}
                required
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className="input"
                value={edit.email}
                onChange={(e) => setEdit((s) => ({ ...s, email: e.target.value }))}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <input
                className="input"
                value={edit.phone}
                onChange={(e) => setEdit((s) => ({ ...s, phone: e.target.value }))}
              />
            </Field>
            <Field label="Status">
              <select
                className="input"
                value={edit.status}
                onChange={(e) =>
                  setEdit((s) => ({ ...s, status: e.target.value as ClientStatus }))
                }
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          <Field label="Goal">
            <input
              className="input"
              value={edit.goal}
              onChange={(e) => setEdit((s) => ({ ...s, goal: e.target.value }))}
            />
          </Field>

          <Field label="Program">
            <input
              className="input"
              value={edit.program}
              onChange={(e) => setEdit((s) => ({ ...s, program: e.target.value }))}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Start weight (lb)">
              <input
                type="number"
                className="input"
                value={edit.startWeight}
                onChange={(e) => setEdit((s) => ({ ...s, startWeight: e.target.value }))}
              />
            </Field>
            <Field label="Current weight (lb)">
              <input
                type="number"
                className="input"
                value={edit.currentWeight}
                onChange={(e) => setEdit((s) => ({ ...s, currentWeight: e.target.value }))}
              />
            </Field>
            <Field label="Goal weight (lb)">
              <input
                type="number"
                className="input"
                value={edit.goalWeight}
                onChange={(e) => setEdit((s) => ({ ...s, goalWeight: e.target.value }))}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Progress (%)">
              <input
                type="number"
                className="input"
                value={edit.progress}
                onChange={(e) => setEdit((s) => ({ ...s, progress: e.target.value }))}
              />
            </Field>
            <Field label="Adherence (%)">
              <input
                type="number"
                className="input"
                value={edit.adherence}
                onChange={(e) => setEdit((s) => ({ ...s, adherence: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Tags (comma-separated)">
            <input
              className="input"
              value={edit.tags}
              onChange={(e) => setEdit((s) => ({ ...s, tags: e.target.value }))}
            />
          </Field>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete client"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary bg-rose-600 hover:bg-rose-700"
              onClick={confirmDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          Are you sure you want to delete <span className="font-semibold text-ink-900">{c.name}</span>?
          This will also remove their conversations and cannot be undone.
        </p>
      </Modal>

      {/* Invite result modal */}
      <Modal
        open={Boolean(inviteRes)}
        onClose={() => { setInviteRes(null); setCopied(false); }}
        title="Invitation"
        footer={<button className="btn-primary" onClick={() => { setInviteRes(null); setCopied(false); }}>Done</button>}
      >
        {inviteRes && (
          <div className="space-y-4">
            <div
              className={cn(
                "flex items-start gap-2 rounded-xl border p-3 text-sm",
                inviteRes.sent
                  ? "border-accent-500/30 bg-accent-500/10 text-accent-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400",
              )}
            >
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {inviteRes.sent
                  ? `Invitation emailed to ${c.email}.`
                  : inviteRes.url
                    ? inviteRes.error
                      ? `Invite created, but the email couldn't be sent: ${inviteRes.error}. Share the link below.`
                      : "Email isn't configured — share the link below."
                    : `Couldn't create the invite: ${inviteRes.error}`}
              </span>
            </div>
            {inviteRes.url && (
              <ShareInvite url={inviteRes.url} email={c.email} business={settings.businessName} />
            )}
          </div>
        )}
      </Modal>

      {/* Create / upload meal plan, then prescribe to this client */}
      <Modal
        open={mealOpen}
        onClose={() => setMealOpen(false)}
        title={`${editingMealId ? "Edit" : "New"} nutrition plan for ${c.name.split(" ")[0]}`}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setMealOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={submitMealPlan} disabled={!mealForm.name.trim()}>
              {editingMealId ? "Save changes" : "Create & prescribe"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Plan name">
            <input autoFocus className="input" value={mealForm.name} onChange={(e) => setMealForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. High-protein cut" />
          </Field>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Calories"><input type="number" className="input" value={mealForm.calories} onChange={(e) => setMealForm((f) => ({ ...f, calories: e.target.value }))} /></Field>
            <Field label="Protein (g)"><input type="number" className="input" value={mealForm.protein} onChange={(e) => setMealForm((f) => ({ ...f, protein: e.target.value }))} /></Field>
            <Field label="Carbs (g)"><input type="number" className="input" value={mealForm.carbs} onChange={(e) => setMealForm((f) => ({ ...f, carbs: e.target.value }))} /></Field>
            <Field label="Fat (g)"><input type="number" className="input" value={mealForm.fat} onChange={(e) => setMealForm((f) => ({ ...f, fat: e.target.value }))} /></Field>
          </div>
          {/* Meals builder */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label mb-0">Meals (optional)</span>
              <button
                type="button"
                className="btn-secondary px-2.5 py-1 text-xs"
                onClick={() => setMealRows((rows) => [...rows, { name: "", kcal: "", items: "" }])}
              >
                <Plus className="h-3.5 w-3.5" /> Add meal
              </button>
            </div>
            <div className="space-y-2">
              {mealRows.map((row, i) => (
                <div key={i} className="rounded-xl border border-ink-100 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      className="input flex-1"
                      value={row.name}
                      onChange={(e) => setMealRows((rows) => rows.map((r, x) => (x === i ? { ...r, name: e.target.value } : r)))}
                      placeholder="Meal name (e.g. Breakfast)"
                    />
                    <input
                      type="number"
                      className="input w-24"
                      value={row.kcal}
                      onChange={(e) => setMealRows((rows) => rows.map((r, x) => (x === i ? { ...r, kcal: e.target.value } : r)))}
                      placeholder="kcal"
                    />
                    {mealRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setMealRows((rows) => rows.filter((_, x) => x !== i))}
                        aria-label="Remove meal"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-rose-500/15 hover:text-rose-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input
                    className="input mt-2"
                    value={row.items}
                    onChange={(e) => setMealRows((rows) => rows.map((r, x) => (x === i ? { ...r, items: e.target.value } : r)))}
                    placeholder="Items, comma separated (e.g. Oats, Eggs, Banana)"
                  />
                </div>
              ))}
            </div>
          </div>

          <Field label="Or upload a plan (PDF) / recipe pictures">
            <MediaEditor media={mealMedia} onChange={setMealMedia} />
          </Field>
          <p className="text-xs text-ink-400">
            Build meals above, or just upload a PDF and skip the rest — it&apos;ll be prescribed and visible to {c.name.split(" ")[0]} right away.
          </p>
        </div>
      </Modal>
    </>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
        <Icon className="h-5 w-5" />
      </span>
      <div className="mt-4 text-2xl font-bold text-ink-900">{value}</div>
      <div className="mt-1 text-sm text-ink-500">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-400">{hint}</div>}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs text-ink-400">{label}</div>
        <div className="truncate text-sm font-semibold text-ink-900">{value}</div>
      </div>
    </div>
  );
}
