import { NextResponse } from "next/server";
import { getSessionUser, listAccounts } from "@/lib/auth/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns each client's login status, derived from accounts (the source of
// truth). Staff only — members never see this.
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role === "member") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const accounts = await listAccounts();
  const access: Record<string, "invited" | "active" | "suspended"> = {};
  for (const a of accounts) {
    if (!a.clientId) continue;
    access[a.clientId] =
      a.status === "active" ? "active" : a.status === "suspended" ? "suspended" : "invited";
  }
  return NextResponse.json({ access });
}
