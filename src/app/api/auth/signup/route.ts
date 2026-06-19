import { NextRequest, NextResponse } from "next/server";
import { createAccount, getAccount, hasOwner, normalizeEmail, toSessionUser } from "@/lib/auth/accounts";
import { signSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";

// First-run only: creates the gym owner account. Once an owner exists, new
// accounts must come through invitations.
export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = body.name?.trim() || "";
  const email = body.email ? normalizeEmail(body.email) : "";
  const password = body.password ?? "";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  if (await hasOwner()) {
    return NextResponse.json(
      { error: "An owner account already exists. Ask your admin for an invitation." },
      { status: 403 },
    );
  }
  if (await getAccount(email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const account = await createAccount({ name, email, password, role: "owner", status: "active" });
  const token = await signSession(toSessionUser(account));

  const res = NextResponse.json({ ok: true, user: toSessionUser(account) });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
