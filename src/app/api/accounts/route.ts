import { NextRequest, NextResponse } from "next/server";
import {
  deleteAccount, getAccount, getSessionUser, listAccounts, normalizeEmail, updateAccount,
} from "@/lib/auth/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lists every login account so the owner/admin can supervise access.
export async function GET() {
  const user = await getSessionUser();
  if (!user || (user.role !== "owner" && user.role !== "admin")) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const accounts = (await listAccounts()).map((a) => ({
    email: a.email,
    name: a.name,
    role: a.role,
    status: a.status,
    clientId: a.clientId,
  }));
  return NextResponse.json({ accounts });
}

// Suspend / activate / delete an account.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || (user.role !== "owner" && user.role !== "admin")) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let body: { action?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email ? normalizeEmail(body.email) : "";
  const target = email ? await getAccount(email) : null;
  if (!target) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  // The owner account is protected.
  if (target.role === "owner") {
    return NextResponse.json({ error: "The owner account can't be changed here." }, { status: 400 });
  }
  if (email === user.email) {
    return NextResponse.json({ error: "You can't change your own account here." }, { status: 400 });
  }

  if (body.action === "suspend") {
    await updateAccount(email, { status: "suspended" });
  } else if (body.action === "activate") {
    await updateAccount(email, { status: "active" });
  } else if (body.action === "delete") {
    await deleteAccount(email);
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
