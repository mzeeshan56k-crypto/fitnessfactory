"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users, UserCheck, UserPlus, Activity, Plus, Search, ArrowRight, Loader2,
  Mail, Check, KeyRound,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { useApp } from "@/lib/store";
import { type Client, type ClientStatus } from "@/lib/data";
import { cn } from "@/lib/utils";

const statusBadge: Record<ClientStatus, string> = {
  active: "bg-accent-500/15 text-accent-400",
  pending: "bg-amber-500/15 text-amber-400",
  inactive: "bg-ink-100 text-ink-600",
};

const filters: { label: string; value: "all" | ClientStatus }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Inactive", value: "inactive" },
];

const emptyForm = {
  name: "",
  email: "",
  goal: "",
  phone: "",
  startWeight: "",
  goalWeight: "",
  status: "active" as ClientStatus,
  program: "",
  tags: "",
  invite: true,
};

type AccessMap = Record<string, "invited" | "active">;

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export default function ClientsPage() {
  const { clients, addClient, hydrated, settings } = useApp();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ClientStatus>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);

  const [access, setAccess] = useState<AccessMap>({});
  const [invite, setInvite] = useState<{ email: string; url: string; sent: boolean; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadAccess = useCallback(async () => {
    try {
      const res = await fetch("/api/clients/access");
      if (res.ok) setAccess((await res.json()).access ?? {});
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadAccess();
  }, [loadAccess]);

  // Auto-open the modal when the URL has ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") setOpen(true);
  }, [searchParams]);

  function closeModal() {
    setOpen(false);
    setForm(emptyForm);
  }

  async function sendInvite(client: Client) {
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: client.name,
        email: client.email,
        role: "Client",
        clientId: client.id,
        businessName: settings.businessName,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Could not create the invitation.");
    setInvite({ email: client.email, url: data.inviteUrl, sent: !!data.sent, error: data.error });
    await loadAccess();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    const email = form.email.trim();
    const newClient = addClient({
      name: form.name.trim() || "New Client",
      email,
      goal: form.goal.trim() || "General fitness",
      phone: form.phone.trim(),
      startWeight: form.startWeight ? Number(form.startWeight) : 0,
      currentWeight: form.startWeight ? Number(form.startWeight) : 0,
      goalWeight: form.goalWeight ? Number(form.goalWeight) : 0,
      status: form.status,
      program: form.program.trim() || "Unassigned",
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });

    if (form.invite && email) {
      setSending(true);
      try {
        await sendInvite(newClient);
        closeModal();
      } catch (err) {
        setInvite({ email, url: "", sent: false, error: err instanceof Error ? err.message : "Invite failed." });
        closeModal();
      } finally {
        setSending(false);
      }
    } else {
      closeModal();
    }
  }

  async function copyLink() {
    if (!invite?.url) return;
    try {
      await navigator.clipboard.writeText(invite.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (!hydrated) return <Loading />;

  const total = clients.length;
  const activeCount = clients.filter((c) => c.status === "active").length;
  const withLogin = Object.values(access).filter((a) => a === "active").length;
  const avgAdherence = total
    ? Math.round(clients.reduce((sum, c) => sum + c.adherence, 0) / total)
    : 0;

  const filtered = clients.filter((c) => {
    const matchesStatus = status === "all" || c.status === status;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q === "" || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Add clients, invite them to the app, and track progress"
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Add client
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total clients" value={String(total)} icon={Users} />
        <StatCard label="Active" value={String(activeCount)} icon={UserCheck} />
        <StatCard label="With app login" value={String(withLogin)} icon={KeyRound} />
        <StatCard label="Avg adherence" value={`${avgAdherence}%`} icon={Activity} />
      </div>

      {clients.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Add your first client and invite them to the app to start coaching."
            action={
              <button className="btn-primary" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Add client
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 card p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email"
                className="input pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatus(f.value)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    status === f.value
                      ? "bg-brand-600 text-white shadow-glow"
                      : "border border-ink-200 bg-ink-100 text-ink-600 hover:border-ink-300 hover:bg-ink-50",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table header (desktop) */}
          <div className="mt-5 hidden grid-cols-12 gap-4 border-b border-ink-100 px-3 pb-3 text-xs font-semibold uppercase tracking-wide text-ink-400 lg:grid">
            <div className="col-span-4">Client</div>
            <div className="col-span-2">App access</div>
            <div className="col-span-3">Goal</div>
            <div className="col-span-2">Adherence</div>
            <div className="col-span-1 text-right">Open</div>
          </div>

          <div className="mt-2 space-y-2">
            {filtered.map((c) => {
              const acc = access[c.id];
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/clients/${c.id}`}
                  className="group grid grid-cols-1 gap-4 rounded-xl border border-ink-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40 lg:grid-cols-12 lg:items-center lg:border-transparent"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <Avatar initials={c.avatar} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-ink-900">{c.name}</div>
                      <div className="truncate text-xs text-ink-500">{c.email || "No email"}</div>
                    </div>
                  </div>

                  {/* App access */}
                  <div className="col-span-2 flex items-center">
                    {acc === "active" ? (
                      <span className="badge bg-accent-500/15 text-accent-400"><Check className="h-3 w-3" /> Has login</span>
                    ) : acc === "invited" ? (
                      <span className="badge bg-amber-500/15 text-amber-400"><Mail className="h-3 w-3" /> Invited</span>
                    ) : (
                      <span className="badge bg-ink-100 text-ink-500">No login</span>
                    )}
                  </div>

                  <div className="col-span-3">
                    <div className="mb-1 flex justify-between text-xs text-ink-500">
                      <span className="truncate">{c.goal}</span>
                      <span className="ml-2 shrink-0 font-medium text-ink-700">{c.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-brand-500" />
                    <span className="font-semibold text-ink-900">{c.adherence}%</span>
                  </div>

                  <div className="col-span-1 flex items-center justify-between text-xs text-ink-500 lg:justify-end">
                    <span className={cn("badge lg:hidden", statusBadge[c.status])}>{c.status}</span>
                    <ArrowRight className="h-4 w-4 text-ink-300 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </div>
                </Link>
              );
            })}

            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-ink-400">
                No clients match your filters.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add client modal */}
      <Modal
        open={open}
        onClose={closeModal}
        title="Add client"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="add-client-form" className="btn-primary" disabled={sending}>
              {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : "Add client"}
            </button>
          </>
        }
      >
        <form id="add-client-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Doe"
                required
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane@email.com"
              />
            </Field>
          </div>

          <Field label="Goal">
            <input
              className="input"
              value={form.goal}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              placeholder="Lose 10 lb"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="(555) 000-0000"
              />
            </Field>
            <Field label="Status">
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ClientStatus }))}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start weight (lb)">
              <input
                type="number"
                className="input"
                value={form.startWeight}
                onChange={(e) => setForm((f) => ({ ...f, startWeight: e.target.value }))}
                placeholder="160"
              />
            </Field>
            <Field label="Goal weight (lb)">
              <input
                type="number"
                className="input"
                value={form.goalWeight}
                onChange={(e) => setForm((f) => ({ ...f, goalWeight: e.target.value }))}
                placeholder="150"
              />
            </Field>
          </div>

          <Field label="Tags (comma-separated)">
            <input
              className="input"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="VIP, Weight loss"
            />
          </Field>

          <label className="flex items-start gap-2.5 rounded-xl border border-ink-200 bg-ink-50/60 p-3 text-sm">
            <input
              type="checkbox"
              checked={form.invite}
              onChange={(e) => setForm((f) => ({ ...f, invite: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-brand-500"
            />
            <span>
              <span className="font-medium text-ink-900">Invite to the app</span>
              <span className="block text-xs text-ink-500">
                Emails {form.email || "the client"} a link to set a password and access their training.
                Requires an email address.
              </span>
            </span>
          </label>
        </form>
      </Modal>

      {/* Invite result */}
      <Modal
        open={Boolean(invite)}
        onClose={() => { setInvite(null); setCopied(false); }}
        title="Client invited"
        footer={<button className="btn-primary" onClick={() => { setInvite(null); setCopied(false); }}>Done</button>}
      >
        {invite && (
          <div className="space-y-4">
            <div
              className={cn(
                "flex items-start gap-2 rounded-xl border p-3 text-sm",
                invite.sent
                  ? "border-accent-500/30 bg-accent-500/10 text-accent-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400",
              )}
            >
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {invite.sent
                  ? `Invitation emailed to ${invite.email}.`
                  : invite.url
                    ? `Invite created for ${invite.email}. Email isn't configured — share the link below.`
                    : `Couldn't create the invite: ${invite.error}`}
              </span>
            </div>
            {invite.url && (
              <Field label="Invitation link">
                <div className="flex gap-2">
                  <input readOnly className="input" value={invite.url} onFocus={(e) => e.currentTarget.select()} />
                  <button type="button" className="btn-secondary shrink-0" onClick={copyLink}>
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
