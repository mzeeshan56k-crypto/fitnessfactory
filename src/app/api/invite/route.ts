import { NextRequest, NextResponse } from "next/server";

interface InviteBody {
  name?: string;
  email?: string;
  role?: string;
  businessName?: string;
}

function token() {
  // URL-safe random token for the invitation link.
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  ).slice(0, 32);
}

/**
 * Creates an invitation and (when an email provider is configured) emails the
 * recipient a join link. Works out of the box by always returning a shareable
 * link; set RESEND_API_KEY (and optionally INVITE_FROM_EMAIL) in the
 * environment to have invites delivered by email automatically.
 */
export async function POST(req: NextRequest) {
  let body: InviteBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim();
  const name = body.name?.trim() || "there";
  const role = body.role?.trim() || "Member";
  const business = body.businessName?.trim() || "Fitness Factory KC";

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  // Build an absolute join link from the request origin.
  const origin =
    req.headers.get("origin") ||
    req.nextUrl.origin ||
    `https://${req.headers.get("host") ?? "localhost:3000"}`;
  const inviteUrl =
    `${origin}/login?invite=${token()}` +
    `&email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVITE_FROM_EMAIL || "onboarding@resend.dev";

  // No provider configured → still succeed and return the link to share.
  if (!apiKey) {
    return NextResponse.json({ ok: true, sent: false, inviteUrl });
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${business} <${from}>`,
        to: [email],
        subject: `You're invited to join ${business}`,
        html: `
          <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#0f1729">
            <h2 style="margin:0 0 8px">Welcome to ${business} 👋</h2>
            <p style="margin:0 0 16px;color:#475569">
              Hi ${name}, you've been invited to join <strong>${business}</strong> as a ${role}.
              Click below to set up your account and get started.
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
      const message =
        (data && (data.message || data.error)) || "Email provider rejected the request.";
      // Still return the link so the invite can be shared manually.
      return NextResponse.json({ ok: true, sent: false, inviteUrl, error: message });
    }

    return NextResponse.json({ ok: true, sent: true, inviteUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send invitation email.";
    return NextResponse.json({ ok: true, sent: false, inviteUrl, error: message });
  }
}
