"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, UserCog, KeyRound, MailWarning, ShieldCheck, Dumbbell, ClipboardList,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Modal";
import { useApp } from "@/lib/store";

interface Account {
  email: string;
  name: string;
  role: "owner" | "admin" | "coach" | "member";
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

function initials(name: string, email: string) {
  const base = name.trim() || email;
  return base.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function AdminOverviewPage() {
  const app = useApp();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => setAccounts(d.accounts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const staff = accounts.filter((a) => a.role === "owner" || a.role === "admin" || a.role === "coach");
  const members = accounts.filter((a) => a.role === "member");
  const membersWithLogin = members.filter((m) => m.status === "active").length;
  const pending = accounts.filter((a) => a.status === "invited").length;

  const clientCount = app.clients.length;
  const programCount = app.programs.length;
  const workoutCount = app.workouts.length;

  return (
    <>
      <PageHeader
        title="Platform overview"
        subtitle="Everything happening across your gym"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clients" value={app.hydrated ? String(clientCount) : "—"} icon={Users} />
        <StatCard label="Members with login" value={loading ? "—" : String(membersWithLogin)} icon={KeyRound} />
        <StatCard label="Coaches & staff" value={loading ? "—" : String(staff.length)} icon={UserCog} />
        <StatCard label="Pending invites" value={loading ? "—" : String(pending)} icon={MailWarning} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Team */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink-900">Team</h2>
              <p className="text-sm text-ink-500">Owners, admins and coaches with access</p>
            </div>
            <Link href="/admin/users" className="text-sm font-medium text-brand-400 hover:text-brand-400">
              Manage access
            </Link>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
            </div>
          ) : staff.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={UserCog}
                title="No team members yet"
                description="Invite coaches or admins from Identity & Access and they'll appear here."
                action={<Link href="/admin/users" className="btn-primary">Invite team</Link>}
              />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto scroll-thin">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                    <th className="pb-3 font-medium">Member</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((t) => (
                    <tr key={t.email} className="border-b border-ink-50 last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar initials={initials(t.name, t.email)} size="sm" />
                          <div>
                            <div className="font-semibold text-ink-900">{t.name}</div>
                            <div className="text-xs text-ink-500">{t.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3"><span className={`badge capitalize ${roleBadge[t.role]}`}>{t.role}</span></td>
                      <td className="py-3"><span className={`badge capitalize ${statusBadge[t.status]}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Library snapshot */}
        <div className="card p-6">
          <h2 className="font-semibold text-ink-900">Content library</h2>
          <p className="text-sm text-ink-500">Shared across all coaches</p>
          <div className="mt-5 space-y-3">
            <SnapshotRow icon={ClipboardList} label="Programs" value={programCount} />
            <SnapshotRow icon={Dumbbell} label="Workouts" value={workoutCount} />
            <SnapshotRow icon={Users} label="Members" value={members.length} />
          </div>
          <Link href="/admin/library" className="btn-secondary mt-5 w-full justify-center">
            Open global library
          </Link>
        </div>
      </div>

      <div className="mt-6 card flex items-start gap-3 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold text-ink-900">You have full oversight</h2>
          <p className="mt-1 text-sm text-ink-500">
            As the owner you can see every client&apos;s data in the{" "}
            <Link href="/dashboard" className="text-brand-400">Coach app</Link>, and manage every login
            (invite, suspend, remove) in{" "}
            <Link href="/admin/users" className="text-brand-400">Identity &amp; Access</Link>.
          </p>
        </div>
      </div>
    </>
  );
}

function SnapshotRow({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium text-ink-700">{label}</span>
      <span className="text-lg font-bold text-ink-900">{value}</span>
    </div>
  );
}
