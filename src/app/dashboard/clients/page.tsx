"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users, UserCheck, UserPlus, Activity, Plus, Search, ArrowRight, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { useApp } from "@/lib/store";
import { type ClientStatus } from "@/lib/data";
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
};

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export default function ClientsPage() {
  const { clients, addClient, hydrated } = useApp();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ClientStatus>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Auto-open the modal when the URL has ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") setOpen(true);
  }, [searchParams]);

  function closeModal() {
    setOpen(false);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addClient({
      name: form.name.trim() || "New Client",
      email: form.email.trim(),
      goal: form.goal.trim() || "General fitness",
      phone: form.phone.trim(),
      startWeight: form.startWeight ? Number(form.startWeight) : 0,
      currentWeight: form.startWeight ? Number(form.startWeight) : 0,
      goalWeight: form.goalWeight ? Number(form.goalWeight) : 0,
      status: form.status,
      program: form.program.trim() || "Unassigned",
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    closeModal();
  }

  if (!hydrated) return <Loading />;

  const total = clients.length;
  const activeCount = clients.filter((c) => c.status === "active").length;
  const pendingCount = clients.filter((c) => c.status === "pending").length;
  const avgAdherence = total
    ? Math.round(clients.reduce((sum, c) => sum + c.adherence, 0) / total)
    : 0;

  const filtered = clients.filter((c) => {
    const matchesStatus = status === "all" || c.status === status;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q === "" ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Manage and track all your clients"
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
        <StatCard label="Pending" value={String(pendingCount)} icon={UserPlus} />
        <StatCard label="Avg adherence" value={`${avgAdherence}%`} icon={Activity} />
      </div>

      {clients.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Add your first client to start coaching."
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
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Goal</div>
            <div className="col-span-2">Adherence</div>
            <div className="col-span-1 text-right">Active</div>
          </div>

          <div className="mt-2 space-y-2">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/clients/${c.id}`}
                className="group grid grid-cols-1 gap-4 rounded-xl border border-ink-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40 lg:grid-cols-12 lg:items-center lg:border-transparent"
              >
                {/* Client */}
                <div className="col-span-4 flex items-center gap-3">
                  <Avatar initials={c.avatar} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-ink-900">{c.name}</div>
                    <div className="truncate text-xs text-ink-500">{c.email}</div>
                    <div className="mt-0.5 text-xs text-ink-400 lg:hidden">{c.program}</div>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center gap-2">
                  <span className={cn("badge", statusBadge[c.status])}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                  <span className="hidden text-xs text-ink-400 lg:hidden xl:inline">{c.program}</span>
                </div>

                {/* Goal + progress */}
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

                {/* Adherence */}
                <div className="col-span-2 flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-brand-500" />
                  <span className="font-semibold text-ink-900">{c.adherence}%</span>
                </div>

                {/* Last active */}
                <div className="col-span-1 flex items-center justify-between text-xs text-ink-500 lg:justify-end">
                  <span className="lg:hidden">Last active</span>
                  <span className="flex items-center gap-1">
                    {c.lastActive}
                    <ArrowRight className="h-4 w-4 text-ink-300 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </span>
                </div>
              </Link>
            ))}

            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-ink-400">
                No clients match your filters.
              </p>
            )}
          </div>
        </div>
      )}

      <Modal
        open={open}
        onClose={closeModal}
        title="Add client"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="add-client-form" className="btn-primary">
              Add client
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as ClientStatus }))
                }
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

          <Field label="Program">
            <input
              className="input"
              value={form.program}
              onChange={(e) => setForm((f) => ({ ...f, program: e.target.value }))}
              placeholder="Strength Foundations"
            />
          </Field>

          <Field label="Tags (comma-separated)">
            <input
              className="input"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="VIP, Weight loss"
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}
