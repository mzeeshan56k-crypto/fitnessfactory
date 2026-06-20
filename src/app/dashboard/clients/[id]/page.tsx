"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MessageSquare, Pencil, Trash2, Scale, Target, Flag, Activity,
  Dumbbell, Calendar, Sparkles, Clock, Layers, LineChart, Loader2, Images,
  Mail, Check, KeyRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { PhotoCompare } from "@/components/PhotoCompare";
import { WeightChart, StrengthChart, AdherenceRing } from "@/components/dashboard/Charts";
import { useApp } from "@/lib/store";
import { useLocalState } from "@/lib/useLocalState";
import {
  workouts, weightTrend, strengthTrend, type ClientStatus,
} from "@/lib/data";
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

interface ProgressPhoto {
  id: string;
  label: string;
  dataUrl: string;
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { clients, updateClient, removeClient, seeded, hydrated, clientNotes, addClientNote, settings } = useApp();
  const router = useRouter();
  const c = clients.find((x) => x.id === params.id);

  const [tab, setTab] = useState<Tab>("Overview");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
  const [access, setAccess] = useState<"invited" | "active" | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteRes, setInviteRes] = useState<{ url: string; sent: boolean; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/clients/access")
      .then((r) => (r.ok ? r.json() : { access: {} }))
      .then((d) => { if (active) setAccess(d.access?.[params.id] ?? null); })
      .catch(() => {});
    return () => { active = false; };
  }, [params.id]);

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

  const [photos, , photosHydrated] = useLocalState<ProgressPhoto[]>(
    "ffkc-progress-photos",
    [],
  );

  if (!hydrated) return <Loading />;

  if (!c) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-xl font-bold text-ink-900">Client not found</h1>
        <p className="mt-2 text-sm text-ink-500">
          This client may have been removed.
        </p>
        <Link href="/dashboard/clients" className="btn-primary mt-6 inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </Link>
      </div>
    );
  }

  const sampleWorkouts = workouts.slice(0, 3);
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

  function confirmDelete() {
    if (!c) return;
    removeClient(c.id);
    router.push("/dashboard/clients");
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
              <span className="badge bg-accent-500/15 text-accent-400"><KeyRound className="h-3 w-3" /> Has app login</span>
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
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-brand-400" />
                <h2 className="font-semibold text-ink-900">Assigned program</h2>
              </div>
              <p className="mt-1 text-sm text-ink-500">{c.program}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {sampleWorkouts.map((w) => (
                <div key={w.id} className="card p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-ink-900">{w.name}</h3>
                    <span className="badge bg-brand-500/15 text-brand-400">{w.category}</span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-ink-500">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-ink-400" />
                      {w.durationMin} min
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-ink-400" />
                      {w.difficulty}
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-ink-400" />
                      {w.exercises.length} exercises
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "Progress" && (
          seeded ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card p-6">
                <h2 className="font-semibold text-ink-900">Weight trend</h2>
                <p className="text-sm text-ink-500">Actual vs target (lb)</p>
                <div className="mt-4">
                  <WeightChart data={weightTrend} />
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-ink-900">Strength progress</h2>
                    <p className="text-sm text-ink-500">Top lifts (lb)</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-500">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Squat</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent-400" /> Bench</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Deadlift</span>
                  </div>
                </div>
                <div className="mt-4">
                  <StrengthChart data={strengthTrend} />
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={LineChart}
              title="No progress logged yet"
              description="Once this client logs workouts and check-ins, their weight and strength trends will appear here."
            />
          )
        )}

        {tab === "Photos" && (
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <Images className="h-5 w-5 text-brand-400" />
              <h2 className="font-semibold text-ink-900">Progress photo review</h2>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              Compare {c.name}&rsquo;s photos side by side. Highlight and circle
              areas of comparison directly on the &ldquo;After&rdquo; photo —
              your annotations are saved automatically.
            </p>
            <div className="mt-4">
              {photosHydrated ? (
                <PhotoCompare
                  photos={photos}
                  annotatable
                  storageKey={`ffkc-annotation-${params.id}`}
                />
              ) : (
                <div className="flex h-32 items-center justify-center text-ink-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
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
                    ? "Email isn't configured — share the link below."
                    : `Couldn't create the invite: ${inviteRes.error}`}
              </span>
            </div>
            {inviteRes.url && (
              <Field label="Invitation link">
                <div className="flex gap-2">
                  <input readOnly className="input" value={inviteRes.url} onFocus={(e) => e.currentTarget.select()} />
                  <button type="button" className="btn-secondary shrink-0" onClick={copyInviteLink}>
                    {copied ? <Check className="h-4 w-4" /> : null}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </Field>
            )}
          </div>
        )}
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
