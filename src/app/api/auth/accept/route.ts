import { NextRequest, NextResponse } from "next/server";
import { getAccount, hashPassword, normalizeEmail, toSessionUser, updateAccount } from "@/lib/auth/accounts";
import { signSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";

// Completes an invitation: sets the password and activates the account.
export async function POST(req: NextRequest) {
  let body: { email?: string; token?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email ? normalizeEmail(body.email) : "";
  const token = body.token ?? "";
  const password = body.password ?? "";

  if (!email || !token || !password) {
    return NextResponse.json({ error: "Missing invitation details." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const account = await getAccount(email);
  if (!account || account.status !== "invited" || account.inviteToken !== token) {
    return NextResponse.json({ error: "This invitation is invalid or has already been used." }, { status: 400 });
  }

  const updated = await updateAccount(email, {
    name: body.name?.trim() || account.name,
    passwordHash: await hashPassword(password),
    status: "active",
    inviteToken: undefined,
  });
  if (!updated) {
    return NextResponse.json({ error: "Could not complete the invitation." }, { status: 500 });
  }

  const user = toSessionUser(updated);
  const sessionToken = await signSession(user);
  const res = NextResponse.json({ ok: true, user });
  res.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions);
  return res;
}
