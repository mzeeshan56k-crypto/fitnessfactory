"use client";

import { useState } from "react";
import { Check, CreditCard, Wallet, CalendarClock, Pencil } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Modal, Field } from "@/components/ui/Modal";
import { useLocalState } from "@/lib/useLocalState";
import { billingTiers as seedTiers, type BillingTier } from "@/lib/platform";
import { formatCurrency } from "@/lib/utils";

export default function BillingPage() {
  const [tiers, setTiers, hydrated] = useLocalState<BillingTier[]>("ffkc-tiers", seedTiers);

  const [editing, setEditing] = useState<BillingTier | null>(null);
  const [price, setPrice] = useState("");
  const [subs, setSubs] = useState("");

  function openEdit(t: BillingTier) {
    setEditing(t);
    setPrice(String(t.price));
    setSubs(String(t.subscribers));
  }
  function save() {
    if (!editing) return;
    setTiers((prev) => prev.map((t) =>
      t.name === editing.name ? { ...t, price: Number(price) || 0, subscribers: Number(subs) || 0 } : t));
    setEditing(null);
  }

  if (!hydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );
  }

  const tierRevenue = tiers.map((t) => ({ ...t, revenue: t.price * t.subscribers }));
  const totalRevenue = tierRevenue.reduce((s, t) => s + t.revenue, 0);
  const maxRevenue = Math.max(1, ...tierRevenue.map((t) => t.revenue));

  return (
    <>
      <PageHeader
        title="Billing & tiers"
        subtitle="Subscription plans, revenue routing and payout operations"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {tierRevenue.map((t) => (
          <div key={t.name} className="card overflow-hidden">
            <div className={`relative bg-gradient-to-br ${t.color} p-6 text-white`}>
              <button
                onClick={() => openEdit(t)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                aria-label={`Edit ${t.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <div className="text-sm font-medium uppercase tracking-wide text-white/80">{t.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{formatCurrency(t.price)}</span>
                <span className="text-sm text-white/80">/mo</span>
              </div>
              <div className="mt-3 text-sm text-white/80">{t.subscribers.toLocaleString()} subscribers</div>
            </div>
            <div className="p-6">
              <div className="rounded-xl bg-ink-50 p-4">
                <div className="text-xs uppercase tracking-wide text-ink-400">MRR contribution</div>
                <div className="mt-1 text-2xl font-bold text-ink-900">{formatCurrency(t.revenue)}</div>
              </div>
              <ul className="mt-4 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="btn-secondary mt-4 w-full" onClick={() => openEdit(t)}>
                <Pencil className="h-4 w-4" /> Edit plan
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold text-ink-900">Billing routing</h2>
          <p className="text-sm text-ink-500">Payment processing and payout schedule</p>
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                <CreditCard className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="font-semibold text-ink-900">Stripe</div>
                <div className="text-xs text-ink-500">Connected · acct_FFKC_live</div>
              </div>
              <span className="badge bg-accent-500/15 text-accent-400">Connected</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                <Wallet className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="font-semibold text-ink-900">Payout schedule</div>
                <div className="text-xs text-ink-500">Automatic · every 2 days</div>
              </div>
              <span className="badge bg-ink-100 text-ink-700">Rolling</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <CalendarClock className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="font-semibold text-ink-900">Next payout</div>
                <div className="text-xs text-ink-500">Jun 19, 2026 · {formatCurrency(Math.round(totalRevenue / 15))}</div>
              </div>
              <span className="badge bg-amber-500/15 text-amber-400">Pending</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">Revenue by tier</h2>
            <span className="text-2xl font-bold text-ink-900">{formatCurrency(totalRevenue)}</span>
          </div>
          <p className="text-sm text-ink-500">Gross monthly recurring revenue</p>
          <div className="mt-5 space-y-5">
            {tierRevenue.map((t) => (
              <div key={t.name}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-ink-700">{t.name}</span>
                  <span className="font-semibold text-ink-900">{formatCurrency(t.revenue)}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-ink-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${t.color}`}
                    style={{ width: `${(t.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-ink-400">
                  {totalRevenue ? Math.round((t.revenue / totalRevenue) * 100) : 0}% of total
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name} plan` : ""}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" onClick={save}>Save plan</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Monthly price ($)">
            <input className="input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="Subscribers">
            <input className="input" type="number" value={subs} onChange={(e) => setSubs(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
