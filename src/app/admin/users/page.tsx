"use client";

import { useCallback, useEffect, useState } from "react";
import {
  UserPlus, Search, Ban, CheckCircle2, Check, Trash2, Users as UsersIcon, Mail, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { ShareInvite } from "@/components/ui/ShareInvite";
import { rolePermissions } from "@/lib/platform";
import { useApp } from "@/lib/store";

type Role = "owner" | "admin" | "coach" | "member";
interface Account {
  email: string;
  name: string;
  role: Role;
  status: "active" | "invited" | "suspended";
  clientId?: string;
}

const roleBadge: Record<string, string> = {
  member: "bg-ink-100 text-ink-700",
  coach: "bg-brand-500/15 text-brand-400",
  admin: "bg-purple-500/15 text-purple-400",
  owner: "bg-accent-500/15 text-accent-400",
};
const statusBadge: Record<string, string> = {
  active: "bg-accent-500/15 text-accent-400",
  suspended: "bg-rose-500/15 text-rose-400",
  invited: "bg-amber-500/15 text-amber-400",
};

const filters = ["All", "owner", "admin", "coach", "member"] as const;
const inviteRoles = ["Coach", "Admin", "Member"];

function initials(name: string, email: string) {
  const base = name.trim() || email;
  return base.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function UsersPage() {
  const app = useApp();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<(typeof filters)[number]>("All");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: string }>({ name: "", email: "", role: "Coach" });
  const [sending, setSending] = useState(false);
  const [invite, setInvite] = useState<{ url: string; sent: boolean; email: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) setAccounts((await res.json()).accounts ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submitInvite() {
    if (!form.name.trim() || !form.email.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), role: form.role, businessName: app.settings.businessName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not create the invitation.");
      setInvite({ url: data.inviteUrl, sent: !!data.sent, email: form.email.trim(), error: data.error });
      await load();
    } catch (e) {
      setInvite({ url: "", sent: false, email: form.email.trim(), error: e instanceof Error ? e.message : "Failed." });
    } finally {
      setSending(false);
    }
  }

  async function action(email: string, act: "suspend" | "activate" | "delete") {
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act, email }),
    });
    await load();
  }

  function closeInvite() {
    setInviteOpen(false);
    setInvite(null);
    setCopied(false);
    setForm({ name: "", email: "", role: "Coach" });
  }

  async function copyLink() {
    if (!invite?.url) return;
    try { await navigator.clipboard.writeText(invite.url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  const visible = accounts.filter((u) => {
    const matchesRole = role === "All" || u.role === role;
    const q = query.toLowerCase();
    const matchesQuery = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  return (
    <>
      <PageHeader
        title="Identity & Access"
        subtitle="Every login account across your gym — invite, suspend or remove access"
        action={
          <button className="btn-primary" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Invite user
          </button>
        }
      />

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email…" className="input pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setRole(f)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition ${
                  role === f ? "bg-brand-600 text-white shadow-glow" : "bg-ink-50 text-ink-600 hover:bg-ink-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={UsersIcon}
              title="No accounts yet"
              description="Invite a coach, admin or member to give them a login."
              action={<button className="btn-primary" onClick={() => setInviteOpen(true)}><UserPlus className="h-4 w-4" /> Invite user</button>}
            />
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto scroll-thin">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.email} className="border-b border-ink-50 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={initials(u.name, u.email)} size="sm" />
                        <div>
                          <div className="font-semibold text-ink-900">{u.name}</div>
                          <div className="text-xs text-ink-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3"><span className={`badge capitalize ${roleBadge[u.role]}`}>{u.role}</span></td>
                    <td className="py-3"><span className={`badge capitalize ${statusBadge[u.status]}`}>{u.status}</span></td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        {u.role !== "owner" && u.email !== app.session?.email && (
                          <>
                            {u.status === "suspended" ? (
                              <button onClick={() => action(u.email, "activate")} className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/15 px-3 py-1.5 text-xs font-semibold text-accent-400 hover:bg-accent-500/20">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Activate
                              </button>
                            ) : (
                              <button onClick={() => action(u.email, "suspend")} className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20">
                                <Ban className="h-3.5 w-3.5" /> Suspend
                              </button>
                            )}
                            <button onClick={() => action(u.email, "delete")} aria-label={`Remove ${u.name}`} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition hover:bg-rose-500/15 hover:text-rose-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {u.role === "owner" && <span className="text-xs text-ink-400">Owner</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td colSpan={4} className="py-10 text-center text-sm text-ink-400">No accounts match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-semibold text-ink-900">Role permissions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rolePermissions.map((r) => (
            <div key={r.role} className="card p-5">
              <h3 className="font-semibold text-ink-900">{r.role}</h3>
              <ul className="mt-3 space-y-2">
                {r.perms.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-ink-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={inviteOpen}
        onClose={closeInvite}
        title={invite ? "Invitation created" : "Invite user"}
        footer={
          invite ? (
            <button className="btn-primary" onClick={closeInvite}>Done</button>
          ) : (
            <>
              <button className="btn-secondary" onClick={closeInvite}>Cancel</button>
              <button className="btn-primary" onClick={submitInvite} disabled={!form.name.trim() || !form.email.trim() || sending}>
                {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Mail className="h-4 w-4" /> Send invite</>}
              </button>
            </>
          )
        }
      >
        {invite ? (
          <div className="space-y-4">
            <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${invite.sent ? "border-accent-500/30 bg-accent-500/10 text-accent-400" : "border-amber-500/30 bg-amber-500/10 text-amber-400"}`}>
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {invite.sent
                  ? `Invitation emailed to ${invite.email}.`
                  : invite.url
                    ? invite.error
                      ? `Invite created, but the email couldn't be sent: ${invite.error}. Share the link below.`
                      : `Invite created for ${invite.email}. Email isn't configured — share the link below.`
                    : `Couldn't create the invite: ${invite.error}`}
              </span>
            </div>
            {invite.url && (
              <ShareInvite url={invite.url} email={invite.email} business={app.settings.businessName} />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Name">
              <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" />
            </Field>
            <Field label="Email">
              <input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@email.com" />
            </Field>
            <Field label="Role">
              <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                {inviteRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <p className="text-xs text-ink-400">
              Tip: invite gym members from the Clients page so their account links to their client record. Use this for coaches, admins and staff.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
