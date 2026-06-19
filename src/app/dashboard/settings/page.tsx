"use client";

import { useEffect, useState } from "react";
import {
  User, Building2, CreditCard, Bell, Palette, Database,
  Check, Sparkles, KeyRound,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { DataControls } from "@/components/dashboard/DataControls";
import { useApp } from "@/lib/store";
import { AI_MODELS } from "@/lib/ai";
import { cn } from "@/lib/utils";

type TabId = "profile" | "business" | "ai" | "billing" | "notifications" | "branding" | "data";

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "business", label: "Business", icon: Building2 },
  { id: "ai", label: "AI Copilot", icon: Sparkles },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "data", label: "Data", icon: Database },
];

const brandColors = [
  { name: "Brand Blue", value: "#1b82f5" },
  { name: "Emerald", value: "#10b981" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Ink", value: "#0f1729" },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        on ? "bg-brand-600" : "bg-ink-200",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-ink-100 shadow transition-transform",
          on ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function SavedPill({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="flex items-center gap-1 text-sm font-medium text-accent-400">
      <Check className="h-4 w-4" /> Saved
    </span>
  );
}

export default function SettingsPage() {
  const app = useApp();

  const [tab, setTab] = useState<TabId>("profile");
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    "New client signups": true,
    "Workout completions": true,
    "Client messages": true,
    "Weekly summary": false,
  });

  // Profile form (name/email/phone/bio)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Business form
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles");

  // AI Copilot config
  const [aiProvider, setAiProvider] = useState<"openai" | "anthropic" | "gemini">("openai");
  const [aiModel, setAiModel] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiSaved, setAiSaved] = useState(false);

  const [profileSaved, setProfileSaved] = useState(false);
  const [businessSaved, setBusinessSaved] = useState(false);

  // Deep link: /dashboard/settings?tab=ai
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && tabs.some((x) => x.id === t)) setTab(t as TabId);
  }, []);

  // Seed local form state from the store once it has hydrated.
  useEffect(() => {
    if (!app.hydrated) return;
    setName(app.settings.trainerName ?? "");
    setEmail(app.settings.trainerEmail ?? "");
    setBusinessName(app.settings.businessName ?? "");
    setAiProvider(app.settings.aiProvider ?? "openai");
    setAiModel(app.settings.aiModel ?? "");
    setAiApiKey(app.settings.aiApiKey ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.hydrated]);

  function saveAi() {
    app.updateSettings({
      aiProvider,
      aiModel: aiModel || AI_MODELS[aiProvider].models[0],
      aiApiKey: aiApiKey.trim(),
    });
    setAiSaved(true);
    window.setTimeout(() => setAiSaved(false), 2000);
  }

  function toggleNotification(key: string) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function saveProfile() {
    app.updateSettings({ trainerName: name, trainerEmail: email });
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2000);
  }

  function saveBusiness() {
    app.updateSettings({ businessName });
    setBusinessSaved(true);
    window.setTimeout(() => setBusinessSaved(false), 2000);
  }

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );
  }

  const activeColor = app.settings.brandColor;

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your account, business and branding"
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="card h-fit p-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                tab === t.id
                  ? "bg-brand-500/15 text-brand-400"
                  : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>

        <div className="card p-6">
          {tab === "profile" && (
            <div>
              <h2 className="font-semibold text-ink-900">Profile</h2>
              <p className="text-sm text-ink-500">Update your personal details.</p>

              <div className="mt-6 flex items-center gap-4">
                {app.settings.profilePhoto ? (
                  <ImageUpload
                    value={app.settings.profilePhoto}
                    aspect="square"
                    onChange={(v) => app.updateSettings({ profilePhoto: v })}
                    className="w-24"
                  />
                ) : (
                  <Avatar
                    initials={
                      name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "FF"
                    }
                    size="lg"
                  />
                )}
                <div>
                  {!app.settings.profilePhoto && (
                    <ImageUpload
                      aspect="square"
                      label="Change photo"
                      onChange={(v) => app.updateSettings({ profilePhoto: v })}
                      className="w-24"
                    />
                  )}
                  <p className="mt-1.5 text-xs text-ink-400">JPG or PNG, up to 2MB.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Full name</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 415 555 0100" />
                </div>
                <div>
                  <label className="label">Title</label>
                  <input className="input" defaultValue="Head Coach" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Bio</label>
                  <textarea
                    className="input min-h-[96px] resize-y"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Certified strength coach helping clients build sustainable habits and lasting results."
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <SavedPill show={profileSaved} />
                <button type="button" className="btn-primary" onClick={saveProfile}>Save changes</button>
              </div>
            </div>
          )}

          {tab === "business" && (
            <div>
              <h2 className="font-semibold text-ink-900">Business</h2>
              <p className="text-sm text-ink-500">Your coaching business details.</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Business name</label>
                  <input className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Website</label>
                  <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://fitforge.app" />
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <select className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    <option value="America/Los_Angeles">Pacific (PT)</option>
                    <option value="America/Denver">Mountain (MT)</option>
                    <option value="America/Chicago">Central (CT)</option>
                    <option value="America/New_York">Eastern (ET)</option>
                    <option value="Europe/London">London (GMT)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select className="input" defaultValue="USD">
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="CAD">CAD — Canadian Dollar</option>
                    <option value="AUD">AUD — Australian Dollar</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <SavedPill show={businessSaved} />
                <button type="button" className="btn-primary" onClick={saveBusiness}>Save changes</button>
              </div>
            </div>
          )}

          {tab === "ai" && (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-ink-900">AI Copilot</h2>
                  <p className="text-sm text-ink-500">
                    Connect your own AI provider to power live answers across the platform.
                  </p>
                </div>
                <SavedPill show={aiSaved} />
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 p-4 text-sm text-ink-700">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <span>
                  Your key is stored only in this browser and sent directly to the provider through a
                  secure proxy — never shared. Pick a provider, paste a key, and the AI Copilot
                  (⌘K) and the AI Co-Pilot page go live.
                </span>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <span className="label">Provider</span>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {(Object.keys(AI_MODELS) as Array<"openai" | "anthropic" | "gemini">).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => { setAiProvider(p); setAiModel(AI_MODELS[p].models[0]); }}
                        className={cn(
                          "rounded-xl border p-3 text-left text-sm transition",
                          aiProvider === p
                            ? "border-brand-500 bg-brand-500/10 text-ink-900"
                            : "border-ink-200 text-ink-600 hover:border-ink-300",
                        )}
                      >
                        <div className="font-semibold">{AI_MODELS[p].label}</div>
                        <div className="text-xs text-ink-400">{AI_MODELS[p].models[0]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="label">Model</span>
                  <select className="input" value={aiModel} onChange={(e) => setAiModel(e.target.value)}>
                    {AI_MODELS[aiProvider].models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="label">API key</span>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                      type="password"
                      className="input pl-9"
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      placeholder={
                        aiProvider === "openai" ? "sk-…" : aiProvider === "anthropic" ? "sk-ant-…" : "AIza…"
                      }
                      autoComplete="off"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-ink-400">
                    {aiProvider === "openai" && "Get one at platform.openai.com → API keys."}
                    {aiProvider === "anthropic" && "Get one at console.anthropic.com → API keys."}
                    {aiProvider === "gemini" && "Get one at aistudio.google.com → API keys."}
                  </p>
                </label>

                <div className="flex items-center gap-3">
                  <button type="button" className="btn-primary" onClick={saveAi}>Save & connect</button>
                  {app.settings.aiApiKey ? (
                    <span className="badge bg-accent-500/15 text-accent-400">
                      <Check className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="text-sm text-ink-400">Not connected — add a key to enable AI</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "billing" && (
            <div>
              <h2 className="font-semibold text-ink-900">Billing</h2>
              <p className="text-sm text-ink-500">Manage your plan and payment method.</p>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-100 bg-ink-50/40 p-5">
                <div>
                  <span className="badge bg-ink-100 text-ink-600">Current plan</span>
                  <div className="mt-2 text-lg font-bold text-ink-900">No plan selected</div>
                  <p className="text-sm text-ink-500">Choose a plan to unlock payments and scheduling.</p>
                </div>
                <button type="button" className="btn-primary">Choose a plan</button>
              </div>

              <div className="mt-6">
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-ink-700">Active clients</span>
                  <span className="text-ink-500">{app.clients.length}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                    style={{ width: `${Math.min(100, app.clients.length * 2)}%` }}
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="label">Payment method</label>
                <div className="flex items-center gap-4 rounded-xl border border-dashed border-ink-200 p-4">
                  <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-ink-50 text-xs font-bold text-ink-400">
                    CARD
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ink-900">No payment method on file</div>
                    <div className="text-xs text-ink-500">Add a card to enable client billing.</div>
                  </div>
                  <button type="button" className="btn-secondary">Add card</button>
                </div>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div>
              <h2 className="font-semibold text-ink-900">Notifications</h2>
              <p className="text-sm text-ink-500">Choose what you want to be notified about.</p>

              <div className="mt-6 divide-y divide-ink-100">
                {Object.keys(notifications).map((key) => (
                  <div key={key} className="flex items-center justify-between py-4">
                    <div>
                      <div className="text-sm font-medium text-ink-900">{key}</div>
                      <div className="text-xs text-ink-500">
                        Email and in-app alerts for {key.toLowerCase()}.
                      </div>
                    </div>
                    <Toggle on={notifications[key]} onToggle={() => toggleNotification(key)} />
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-ink-100 bg-ink-50/40 p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-400" />
                  <h3 className="font-semibold text-ink-900">Automatic program updates</h3>
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  When enabled, the AI Copilot automatically adjusts clients&apos; plans based on logged
                  progress and check-in data — no manual edits required.
                </p>

                <div className="mt-4 divide-y divide-ink-100">
                  {([
                    { key: "workouts", label: "Auto-update workouts", desc: "Progress loads and swaps exercises as clients adapt." },
                    { key: "nutrition", label: "Auto-update nutrition", desc: "Re-tune macros and calories from logged intake." },
                    { key: "checkins", label: "Auto-update check-ins", desc: "Adapt check-in cadence and questions automatically." },
                  ] as const).map((row) => {
                    const auto = app.settings.autoUpdates ?? { workouts: false, nutrition: false, checkins: false };
                    return (
                      <div key={row.key} className="flex items-center justify-between py-4">
                        <div>
                          <div className="text-sm font-medium text-ink-900">{row.label}</div>
                          <div className="text-xs text-ink-500">{row.desc}</div>
                        </div>
                        <Toggle
                          on={auto[row.key]}
                          onToggle={() =>
                            app.updateSettings({
                              autoUpdates: { ...auto, [row.key]: !auto[row.key] },
                            })
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "branding" && (
            <div>
              <h2 className="font-semibold text-ink-900">Branding</h2>
              <p className="text-sm text-ink-500">
                White-label the client app with your own identity.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">App name</label>
                  <input className="input" defaultValue="Fitness Factory KC" />
                </div>
                <div>
                  <label className="label">Support email</label>
                  <input className="input" type="email" defaultValue="support@fitnessfactorykc.com" />
                </div>
              </div>

              <div className="mt-6">
                <label className="label">Primary color</label>
                <div className="flex flex-wrap gap-3">
                  {brandColors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.name}
                      onClick={() => app.updateSettings({ brandColor: c.value })}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl ring-2 ring-offset-2 transition",
                        activeColor === c.value ? "ring-ink-900" : "ring-transparent",
                      )}
                      style={{ backgroundColor: c.value }}
                    >
                      {activeColor === c.value && <Check className="h-4 w-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="label">Logo</label>
                <ImageUpload
                  value={app.settings.brandLogo}
                  aspect="video"
                  label="Upload logo"
                  onChange={(v) => app.updateSettings({ brandLogo: v })}
                />
                <p className="mt-1.5 text-xs text-ink-400">
                  SVG or PNG, transparent background recommended.
                </p>
              </div>
            </div>
          )}

          {tab === "data" && (
            <div>
              <h2 className="font-semibold text-ink-900">Data</h2>
              <p className="text-sm text-ink-500">
                Load a fully-populated example workspace or clear everything to start fresh.
              </p>

              <div className="mt-6">
                <DataControls variant="card" />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
