import { NextRequest, NextResponse } from "next/server";
import {
  deleteAccount, getAccount, getSessionUser, listAccounts, normalizeEmail, updateAccount,
} from "@/lib/auth/accounts";
import type { Account } from "@/lib/auth/accounts";

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

// Suspend / activate / delete an account. Owners/admins can act on any non-owner
// account; coaches may only act on member (client) accounts they manage — so a
// client removed or suspended from the dashboard is always blocked from logging
// back in.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role === "member") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let body: { action?: string; email?: string; clientId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Resolve the target account by email, falling back to the linked client id.
  const email = body.email ? normalizeEmail(body.email) : "";
  let target: Account | null = email ? await getAccount(email) : null;
  if (!target && body.clientId) {
    target = (await listAccounts()).find((a) => a.clientId === body.clientId) ?? null;
  }
  // Deleting a client with no linked login account is a no-op success — there's
  // nothing to revoke, but the workspace removal still stands.
  if (!target) {
    return NextResponse.json({ ok: true, noAccount: true });
  }

  // The owner account is protected; nobody may change their own account here.
  if (target.role === "owner") {
    return NextResponse.json({ error: "The owner account can't be changed here." }, { status: 400 });
  }
  if (target.email === user.email) {
    return NextResponse.json({ error: "You can't change your own account here." }, { status: 400 });
  }
  // Coaches may only manage member accounts.
  if (user.role === "coach" && target.role !== "member") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  if (body.action === "suspend") {
    await updateAccount(target.email, { status: "suspended" });
  } else if (body.action === "activate") {
    await updateAccount(target.email, { status: "active" });
  } else if (body.action === "delete") {
    await deleteAccount(target.email);
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
