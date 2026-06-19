"use client";

import { useState } from "react";
import {
  Loader2, Plus, Users, ShieldCheck, Clock, ShieldAlert, Shield,
  UserMinus, Pause, Play,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { useApp } from "@/lib/store";
import { type PlatformUser } from "@/lib/platform";
import { cn } from "@/lib/utils";

type StaffRole = "Coach" | "Staff" | "Admin";
type Status = PlatformUser["status"];

const roleBadge: Record<string, string> = {
  Coach: "bg-brand-500/15 text-brand-400",
  Staff: "bg-indigo-500/15 text-indigo-400",
  Admin: "bg-purple-500/15 text-purple-400",
};

const statusBadge: Record<Status, string> = {
  active: "bg-accent-500/15 text-accent-400",
  suspended: "bg-rose-500/15 text-rose-400",
  invited: "bg-amber-500/15 text-amber-400",
};

const emptyForm = { name: "", email: "", role: "Coach" as StaffRole };

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export default function TeamPage() {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  if (!app.hydrated) return <Loading />;

  const team = app.users.filter((u) => u.role !== "Client");
  const coaches = team.filter((u) => u.role === "Coach").length;
  const pending = team.filter((u) => u.status === "invited").length;

  function closeModal() {
    setOpen(false);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    app.addUser({
      name: form.name.trim() || "New Member",
      email: form.email.trim(),
      role: form.role,
      status: "invited",
    });
    closeModal();
  }

  return (
    <>
      <PageHeader
        title="Team management"
        subtitle="Invite and manage your coaches and staff"
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Invite member
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total team" value={String(team.length)} icon={Users} />
        <StatCard label="Coaches" value={String(coaches)} icon={ShieldCheck} />
        <StatCard label="Pending invites" value={String(pending)} icon={Clock} />
      </div>

      {team.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Users}
            title="No team members yet"
            description="Invite coaches, staff or admins to collaborate in your workspace."
            action={
              <button className="btn-primary" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Invite member
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 card p-4 sm:p-5">
          <div className="hidden grid-cols-12 gap-4 border-b border-ink-100 px-3 pb-3 text-xs font-semibold uppercase tracking-wide text-ink-400 lg:grid">
            <div className="col-span-4">Member</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">MFA</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          <div className="mt-2 space-y-2">
            {team.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-1 gap-4 rounded-xl border border-ink-100 p-3 lg:grid-cols-12 lg:items-center lg:border-transparent"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <Avatar initials={u.avatar} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-ink-900">{u.name}</div>
                    <div className="truncate text-xs text-ink-500">{u.email || "No email"}</div>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className={cn("badge", roleBadge[u.role] ?? "bg-ink-100 text-ink-600")}>
                    {u.role}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className={cn("badge", statusBadge[u.status])}>
                    {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                  </span>
                </div>

                <div className="col-span-1 flex items-center gap-1.5 text-xs">
                  {u.mfa ? (
                    <span className="flex items-center gap-1 text-accent-400">
                      <Shield className="h-3.5 w-3.5" /> On
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-ink-400">
                      <ShieldAlert className="h-3.5 w-3.5" /> Off
                    </span>
                  )}
                </div>

                <div className="col-span-3 flex flex-wrap items-center gap-2 lg:justify-end">
                  {u.status === "suspended" ? (
                    <button
                      type="button"
                      onClick={() => app.updateUser(u.id, { status: "active" })}
                      className="btn-ghost px-2.5 py-1.5 text-xs text-accent-400"
                    >
                      <Play className="h-3.5 w-3.5" /> Activate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => app.updateUser(u.id, { status: "suspended" })}
                      className="btn-ghost px-2.5 py-1.5 text-xs text-amber-400"
                    >
                      <Pause className="h-3.5 w-3.5" /> Suspend
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => app.removeUser(u.id)}
                    className="btn-ghost px-2.5 py-1.5 text-xs text-rose-400"
                  >
                    <UserMinus className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={open}
        onClose={closeModal}
        title="Invite team member"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="invite-form" className="btn-primary">
              Send invite
            </button>
          </>
        }
      >
        <form id="invite-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name">
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Jamie Coach"
              required
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="jamie@ffkc.app"
            />
          </Field>
          <Field label="Role">
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as StaffRole }))}
            >
              <option value="Coach">Coach</option>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </Field>
          <p className="text-xs text-ink-400">
            The member will be added with an <span className="text-amber-400">invited</span> status until they accept.
          </p>
        </form>
      </Modal>
    </>
  );
}
