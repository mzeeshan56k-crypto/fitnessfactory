"use client";

import { useState } from "react";
import {
  UserPlus, Search, ShieldCheck, ShieldOff, Ban, CheckCircle2, Check, Trash2, Users as UsersIcon,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { rolePermissions, type PlatformUser } from "@/lib/platform";
import { useApp } from "@/lib/store";

const roleBadge: Record<string, string> = {
  Client: "bg-ink-100 text-ink-700",
  Coach: "bg-brand-500/15 text-brand-400",
  Staff: "bg-purple-500/15 text-purple-400",
  Admin: "bg-accent-500/15 text-accent-400",
};

const statusBadge: Record<string, string> = {
  active: "bg-accent-500/15 text-accent-400",
  suspended: "bg-rose-500/15 text-rose-400",
  invited: "bg-amber-500/15 text-amber-400",
};

const filters = ["All", "Client", "Coach", "Staff", "Admin"] as const;
const roleOptions: PlatformUser["role"][] = ["Client", "Coach", "Staff", "Admin"];

export default function UsersPage() {
  const app = useApp();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<(typeof filters)[number]>("All");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: PlatformUser["role"]; mfa: boolean }>({
    name: "",
    email: "",
    role: "Client",
    mfa: false,
  });

  function toggleStatus(u: PlatformUser) {
    app.updateUser(u.id, { status: u.status === "suspended" ? "active" : "suspended" });
  }

  function submitInvite() {
    if (!form.name.trim() || !form.email.trim()) return;
    app.addUser({
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      mfa: form.mfa,
      status: "invited",
    });
    setForm({ name: "", email: "", role: "Client", mfa: false });
    setInviteOpen(false);
  }

  const visible = app.users.filter((u) => {
    const matchesRole = role === "All" || u.role === role;
    const q = query.toLowerCase();
    const matchesQuery =
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  return (
    <>
      <PageHeader
        title="Identity & Access"
        subtitle="Manage every user, role and access policy across the platform"
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
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email…"
              className="input pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setRole(f)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  role === f
                    ? "bg-brand-600 text-white shadow-glow"
                    : "bg-ink-50 text-ink-600 hover:bg-ink-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {!app.hydrated ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
          </div>
        ) : app.users.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={UsersIcon}
              title="No users yet"
              description="Invite your first user to start managing roles and access."
              action={
                <button className="btn-primary" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="h-4 w-4" /> Invite user
                </button>
              }
            />
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto scroll-thin">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">MFA</th>
                  <th className="pb-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.id} className="border-b border-ink-50 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={u.avatar} size="sm" />
                        <div>
                          <div className="font-semibold text-ink-900">{u.name}</div>
                          <div className="text-xs text-ink-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`badge ${roleBadge[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="py-3">
                      <span className={`badge capitalize ${statusBadge[u.status]}`}>{u.status}</span>
                    </td>
                    <td className="py-3">
                      {u.mfa ? (
                        <span className="badge bg-accent-500/15 text-accent-400">
                          <ShieldCheck className="h-3 w-3" /> On
                        </span>
                      ) : (
                        <span className="badge bg-ink-100 text-ink-500">
                          <ShieldOff className="h-3 w-3" /> Off
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(u)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            u.status === "suspended"
                              ? "bg-accent-500/15 text-accent-400 hover:bg-accent-500/20"
                              : "bg-rose-500/15 text-rose-400 hover:bg-rose-500/20"
                          }`}
                        >
                          {u.status === "suspended" ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Activate
                            </>
                          ) : (
                            <>
                              <Ban className="h-3.5 w-3.5" /> Suspend
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => app.removeUser(u.id)}
                          aria-label={`Remove ${u.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition hover:bg-rose-500/15 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-ink-400">
                      No users match your filters.
                    </td>
                  </tr>
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
        onClose={() => setInviteOpen(false)}
        title="Invite user"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={submitInvite}
              disabled={!form.name.trim() || !form.email.trim()}
            >
              Send invite
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="jane@email.com"
            />
          </Field>
          <Field label="Role">
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as PlatformUser["role"] }))}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.mfa}
              onChange={(e) => setForm((f) => ({ ...f, mfa: e.target.checked }))}
              className="h-4 w-4 rounded border-ink-300 text-brand-400 focus:ring-brand-500"
            />
            Require multi-factor authentication
          </label>
        </div>
      </Modal>
    </>
  );
}
