import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSessionUser } from "@/lib/auth/accounts";

export const runtime = "nodejs";
export const maxDuration = 60;

// Sanitize: env values pasted from Vercel's `.env.local` snippet can include
// surrounding quotes/whitespace, which invalidates the token.
function blobToken(): string {
  return (process.env.BLOB_READ_WRITE_TOKEN || "").trim().replace(/^["']|["']$/g, "");
}

// Readiness check so the client can show a clear message if storage isn't set up.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  return NextResponse.json({ configured: Boolean(blobToken()) });
}

// Server-side upload: the browser POSTs the raw file and we push it to Vercel
// Blob with a plain put(). This is the same reliable path the image upload uses
// — no client-side token handshake or streaming that stalls in the browser.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const token = blobToken();
  if (!token) {
    return NextResponse.json(
      { error: "Video upload isn't configured yet. Ask your admin to enable Vercel Blob storage (BLOB_READ_WRITE_TOKEN)." },
      { status: 503 },
    );
  }

  const name = req.nextUrl.searchParams.get("name") || "video.mp4";
  const contentType = req.headers.get("content-type") || "video/mp4";

  try {
    const buffer = Buffer.from(await req.arrayBuffer());
    if (buffer.byteLength === 0) return NextResponse.json({ error: "No file received." }, { status: 400 });
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `formcheck/${user.email.replace(/[^a-z0-9]/gi, "_")}/${Date.now()}-${safeName}`;
    try {
      const blob = await put(key, buffer, { access: "public", contentType, token });
      return NextResponse.json({ url: blob.url, name });
    } catch (e) {
      // Store configured with private access: upload privately and hand back a
      // URL that streams through our authenticated /api/media proxy.
      if (!(e instanceof Error) || !/private/i.test(e.message)) throw e;
      await put(key, buffer, { access: "private", contentType, token });
      return NextResponse.json({ url: `/api/media?path=${encodeURIComponent(key)}`, name });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
