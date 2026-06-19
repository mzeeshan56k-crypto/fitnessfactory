import { NextResponse } from "next/server";
import { hasOwner } from "@/lib/auth/accounts";
import { storageConfigured } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Used by the login screen to decide between first-run setup and sign-in.
export async function GET() {
  return NextResponse.json({
    hasOwner: await hasOwner(),
    storageConfigured,
  });
}
