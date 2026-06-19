import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail, toSessionUser, verifyCredentials } from "@/lib/auth/accounts";
import { signSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email ? normalizeEmail(body.email) : "";
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const account = await verifyCredentials(email, password);
  if (!account) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const user = toSessionUser(account);
  const token = await signSession(user);
  const res = NextResponse.json({ ok: true, user });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
