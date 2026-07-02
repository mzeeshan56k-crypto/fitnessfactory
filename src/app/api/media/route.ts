import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getSessionUser } from "@/lib/auth/accounts";

export const runtime = "nodejs";

// Sanitize: env values pasted from Vercel's `.env.local` snippet can include
// surrounding quotes/whitespace, which invalidates the token.
function blobToken(): string {
  return (process.env.BLOB_READ_WRITE_TOKEN || "").trim().replace(/^["']|["']$/g, "");
}

// Streams a blob from a private Vercel Blob store to a signed-in user. Blob
// stores configured with private access can't serve files by URL, so uploads
// return `/api/media?path=...` URLs that route through here.
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const token = blobToken();
  if (!token) return NextResponse.json({ error: "Storage not configured." }, { status: 503 });

  const path = req.nextUrl.searchParams.get("path") || "";
  if (!path || path.includes("..") || !/^[a-zA-Z0-9._/-]+$/.test(path)) {
    return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
  }

  try {
    const result = await get(path, { access: "private", token });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }
    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Content-Length": String(result.blob.size),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load file.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
