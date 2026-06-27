import { NextRequest, NextResponse } from "next/server";
import { createAccount, getAccount, getSessionUser, normalizeEmail, updateAccount } from "@/lib/auth/accounts";
import type { Role } from "@/lib/auth/session";
import { kvGet, kvSet } from "@/lib/storage";

export const runtime = "nodejs";

const WORKSPACE_KEY = "ffkc:workspace";

interface WsClient {
  id: string; name: string; email: string; avatar?: string; status?: string;
  coachEmail?: string; coachName?: string;
  [k: string]: unknown;
}
interface Workspace { clients?: WsClient[]; [k: string]: unknown }

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "C";
}

// Guarantee a client record exists in the shared workspace for an invited
// member, so the client is never orphaned if the trainer's debounced save
// hasn't landed yet. Links by id (falling back to email).
async function ensureClientRecord(opts: {
  clientId?: string; name: string; email: string; coachEmail?: string; coachName?: string;
}) {
  const ws = (await kvGet<Workspace>(WORKSPACE_KEY)) ?? {};
  const clients = ws.clients ?? [];
  const exists = clients.some(
    (c) => (opts.clientId && c.id === opts.clientId) || c.email?.toLowerCase() === opts.email.toLowerCase(),
  );
  if (exists) return;
  const client: WsClient = {
    id: opts.clientId || `c_${Math.random().toString(36).slice(2, 9)}`,
    name: opts.name, email: opts.email, avatar: initials(opts.name),
    status: "active", program: "Unassigned", goal: "General fitness",
    progress: 0, lastActive: "Invited", startWeight: 0, currentWeight: 0,
    goalWeight: 0, adherence: 0, joinedAt: new Date().toISOString().slice(0, 10),
    phone: "", tags: [],
    ...(opts.coachEmail ? { coachEmail: opts.coachEmail, coachName: opts.coachName } : {}),
  };
  ws.clients = [client, ...clients];
  await kvSet(WORKSPACE_KEY, ws);
}

interface InviteBody {
  name?: string;
  email?: string;
  role?: string;
  businessName?: string;
  clientId?: string;
}

const ROLE_MAP: Record<string, Role> = {
  Client: "member",
  Member: "member",
  Coach: "coach",
  Staff: "coach",
  Admin: "admin",
};

function token() {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  ).slice(0, 32);
}

/**
 * Creates an invitation: provisions a pending account and (when an email
 * provider is configured) emails a join link. Always returns a shareable link.
 * Set RESEND_API_KEY (and optionally INVITE_FROM_EMAIL) to send automatically.
 */
export async function POST(req: NextRequest) {
  const inviter = await getSessionUser();
  if (!inviter || inviter.role === "member") {
    return NextResponse.json({ error: "You don't have permission to invite users." }, { status: 403 });
  }

  let body: InviteBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email ? normalizeEmail(body.email) : "";
  const name = body.name?.trim() || "there";
  const role = ROLE_MAP[body.role ?? "Member"] ?? "member";
  const business = body.businessName?.trim() || "Fitness Factory KC";

  // Owner/admin can invite any role; coaches can invite clients (members).
  const isStaff = inviter.role === "owner" || inviter.role === "admin";
  if (!isStaff && role !== "member") {
    return NextResponse.json({ error: "Coaches can only invite clients." }, { status: 403 });
  }

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const existing = await getAccount(email);
  if (existing && existing.status === "active") {
    return NextResponse.json({ error: "That email already has an active account." }, { status: 409 });
  }

  const tkn = token();
  const clientId = body.clientId;
  if (existing) {
    await updateAccount(email, { name, role, status: "invited", inviteToken: tkn, clientId });
  } else {
    await createAccount({ email, name, role, status: "invited", inviteToken: tkn, clientId });
  }

  // For client (member) invites, make sure a linked client record exists in the
  // workspace so they show up under Clients and can be assigned to immediately —
  // even if the trainer's local save hasn't been flushed yet.
  if (role === "member") {
    try {
      await ensureClientRecord({
        clientId,
        name: body.name?.trim() || email,
        email,
        coachEmail: inviter.role === "coach" ? inviter.email : undefined,
        coachName: inviter.role === "coach" ? inviter.name : undefined,
      });
    } catch {
      /* non-fatal: the trainer's own save will still create it */
    }
  }

  // Always build invite links against the public/production site so they work
  // for recipients (preview deployments are login-protected by Vercel).
  // Priority: explicit APP_URL → Vercel production domain → request origin.
  const base =
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    req.headers.get("origin") ||
    req.nextUrl.origin ||
    `https://${req.headers.get("host") ?? "localhost:3000"}`;
  const inviteUrl =
    `${base.replace(/\/$/, "")}/login?invite=${tkn}&email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVITE_FROM_EMAIL || "onboarding@resend.dev";

  if (!apiKey) {
    return NextResponse.json({ ok: true, sent: false, inviteUrl });
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: `${business} <${from}>`,
        to: [email],
        subject: `You're invited to join ${business}`,
        html: `
          <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#0f1729">
            <h2 style="margin:0 0 8px">Welcome to ${business} 👋</h2>
            <p style="margin:0 0 16px;color:#475569">
              Hi ${name}, you've been invited to join <strong>${business}</strong> as a ${role}.
              Click below to set your password and get started.
            </p>
            <a href="${inviteUrl}"
               style="display:inline-block;background:#eb1313;color:#fff;text-decoration:none;
                      padding:12px 22px;border-radius:9999px;font-weight:600">
              Accept invitation
            </a>
            <p style="margin:16px 0 0;font-size:12px;color:#94a3b8">
              Or paste this link into your browser:<br>${inviteUrl}
            </p>
          </div>`,
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const message = (data && (data.message || data.error)) || "Email provider rejected the request.";
      return NextResponse.json({ ok: true, sent: false, inviteUrl, error: message });
    }
    return NextResponse.json({ ok: true, sent: true, inviteUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send invitation email.";
    return NextResponse.json({ ok: true, sent: false, inviteUrl, error: message });
  }
}
