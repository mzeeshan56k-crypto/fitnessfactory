"use client";

import { useState } from "react";
import {
  Mail, Bell, MessageSquareText, Smartphone, Play, Pause, Plus, Plug, Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Modal, Field } from "@/components/ui/Modal";
import { useLocalState } from "@/lib/useLocalState";
import { dripCampaigns, integrations as seedIntegrations, type DripCampaign } from "@/lib/platform";

const statusBadge: Record<string, string> = {
  active: "bg-accent-500/15 text-accent-400",
  paused: "bg-amber-500/15 text-amber-400",
  draft: "bg-ink-100 text-ink-600",
};

const channelIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  Email: Mail, Push: Bell, SMS: Smartphone, "In-app": MessageSquareText,
};

interface Integration {
  id: string; name: string; desc: string; status: string; color: string;
}

export default function AutomationPage() {
  const [drips, setDrips, dripsHydrated] = useLocalState<DripCampaign[]>("ffkc-drips", dripCampaigns);
  const [integrations, setIntegrations, intHydrated] = useLocalState<Integration[]>("ffkc-integrations", seedIntegrations);

  const [campaignModal, setCampaignModal] = useState(false);
  const [cName, setCName] = useState("");
  const [cTrigger, setCTrigger] = useState("On purchase");

  const [intModal, setIntModal] = useState(false);
  const [iName, setIName] = useState("");
  const [iDesc, setIDesc] = useState("");

  function toggleStatus(id: string) {
    setDrips((prev) => prev.map((d) =>
      d.id === id ? { ...d, status: d.status === "active" ? "paused" : "active" } : d));
  }
  function addCampaign() {
    if (!cName.trim()) return;
    setDrips((prev) => [{
      id: `d_${Math.random().toString(36).slice(2, 8)}`,
      name: cName.trim(), trigger: cTrigger, status: "draft", enrolled: 0,
      steps: [{ day: 0, channel: "Email", title: "Welcome message" }],
    }, ...prev]);
    setCName(""); setCTrigger("On purchase"); setCampaignModal(false);
  }
  function removeCampaign(id: string) {
    setDrips((prev) => prev.filter((d) => d.id !== id));
  }
  function toggleConnect(id: string) {
    setIntegrations((prev) => prev.map((i) =>
      i.id === id ? { ...i, status: i.status === "connected" ? "available" : "connected" } : i));
  }
  function addIntegration() {
    if (!iName.trim()) return;
    setIntegrations((prev) => [...prev, {
      id: `i_${Math.random().toString(36).slice(2, 8)}`,
      name: iName.trim(), desc: iDesc.trim() || "Custom integration",
      status: "available", color: "bg-ink-500",
    }]);
    setIName(""); setIDesc(""); setIntModal(false);
  }

  if (!dripsHydrated || !intHydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Automation"
        subtitle="Drip campaigns and the integration canvas that powers the network"
        action={
          <button className="btn-primary" onClick={() => setCampaignModal(true)}>
            <Plus className="h-4 w-4" /> New campaign
          </button>
        }
      />

      <div className="space-y-4">
        {drips.map((d) => (
          <div key={d.id} className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-ink-900">{d.name}</h3>
                  <span className={`badge capitalize ${statusBadge[d.status]}`}>{d.status}</span>
                </div>
                <p className="mt-1 text-sm text-ink-500">
                  Trigger: {d.trigger} · {d.enrolled.toLocaleString()} enrolled
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStatus(d.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                    d.status === "active"
                      ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/20"
                      : "bg-accent-500/15 text-accent-400 hover:bg-accent-500/20"
                  }`}
                >
                  {d.status === "active" ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Activate</>}
                </button>
                <button
                  onClick={() => removeCampaign(d.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 hover:bg-rose-500/15 hover:text-rose-400"
                  aria-label="Delete campaign"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-stretch gap-3 overflow-x-auto scroll-thin pb-1">
              {d.steps.map((s, i) => {
                const Icon = channelIcon[s.channel] ?? Mail;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="min-w-[180px] rounded-xl border border-ink-100 bg-ink-50/50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="badge bg-brand-500/15 text-brand-400">Day {s.day}</span>
                        <Icon className="h-4 w-4 text-ink-400" />
                      </div>
                      <div className="mt-2 text-sm font-semibold text-ink-900">{s.title}</div>
                      <div className="mt-0.5 text-xs text-ink-500">{s.channel}</div>
                    </div>
                    {i < d.steps.length - 1 && <div className="h-px w-5 shrink-0 bg-ink-200" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {drips.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 p-8 text-center text-sm text-ink-500">
            No campaigns yet — create your first drip sequence.
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink-900">Integration canvas</h2>
            <p className="text-sm text-ink-500">
              GoHighLevel, Trainerize, Zapier and Stripe sync — connect your stack
            </p>
          </div>
          <button className="btn-secondary" onClick={() => setIntModal(true)}>
            <Plus className="h-4 w-4" /> Add integration
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((i) => (
            <div key={i.id} className="card p-5">
              <div className="flex items-start gap-3">
                <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${i.color}`} />
                <div className="flex-1">
                  <div className="font-semibold text-ink-900">{i.name}</div>
                  <div className="text-sm text-ink-500">{i.desc}</div>
                </div>
              </div>
              <div className="mt-4">
                {i.status === "connected" ? (
                  <button
                    onClick={() => toggleConnect(i.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-full bg-accent-500/15 px-3 py-2 text-sm font-semibold text-accent-400 transition hover:bg-accent-500/20"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-500" /> Connected · Disconnect
                  </button>
                ) : (
                  <button className="btn-secondary w-full" onClick={() => toggleConnect(i.id)}>
                    <Plug className="h-4 w-4" /> Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={campaignModal}
        onClose={() => setCampaignModal(false)}
        title="New drip campaign"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCampaignModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={addCampaign} disabled={!cName.trim()}>Create campaign</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Campaign name">
            <input className="input" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="New client welcome" autoFocus />
          </Field>
          <Field label="Trigger">
            <select className="input" value={cTrigger} onChange={(e) => setCTrigger(e.target.value)}>
              {["On purchase", "14 days inactive", "Pro for 90 days", "On signup", "Goal reached"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={intModal}
        onClose={() => setIntModal(false)}
        title="Add integration"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setIntModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={addIntegration} disabled={!iName.trim()}>Add integration</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Service name">
            <input className="input" value={iName} onChange={(e) => setIName(e.target.value)} placeholder="HubSpot" autoFocus />
          </Field>
          <Field label="Description">
            <input className="input" value={iDesc} onChange={(e) => setIDesc(e.target.value)} placeholder="CRM contact sync" />
          </Field>
        </div>
      </Modal>
    </>
  );
}
