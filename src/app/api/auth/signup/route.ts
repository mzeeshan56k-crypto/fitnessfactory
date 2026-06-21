import { NextRequest, NextResponse } from "next/server";
import { createAccount, getAccount, hasOwner, normalizeEmail, toSessionUser } from "@/lib/auth/accounts";
import { signSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";

function ownerAllowlist(): string[] {
  return (process.env.OWNER_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Creates an owner account. Owners are restricted to the emails listed in the
// OWNER_EMAILS environment variable. If that variable is not set, it falls back
// to "first sign-up becomes owner" (optionally guarded by OWNER_SETUP_CODE).
export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; password?: string; code?: string };
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

  const allowlist = ownerAllowlist();

  if (allowlist.length > 0) {
    // Allowlist mode: only configured emails may create an owner account.
    if (!allowlist.includes(email)) {
      return NextResponse.json(
        { error: "This email isn't authorized as an owner. Ask your coach for an invitation." },
        { status: 403 },
      );
    }
  } else {
    // Fallback (no allowlist set): first sign-up becomes owner, optional code.
    const requiredCode = process.env.OWNER_SETUP_CODE;
    if (requiredCode && (body.code ?? "").trim() !== requiredCode) {
      return NextResponse.json({ error: "Incorrect setup code." }, { status: 403 });
    }
    if (await hasOwner()) {
      return NextResponse.json(
        { error: "An owner account already exists. Ask your admin for an invitation." },
        { status: 403 },
      );
    }
  }

  const existing = await getAccount(email);
  if (existing && existing.status === "active") {
    return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
  }

  // Create (or replace any invited placeholder for) the owner account.
  const account = await createAccount({ name, email, password, role: "owner", status: "active" });

  const token = await signSession(toSessionUser(account));
  const res = NextResponse.json({ ok: true, user: toSessionUser(account) });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
