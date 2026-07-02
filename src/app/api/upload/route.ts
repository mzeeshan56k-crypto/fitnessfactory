import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSessionUser } from "@/lib/auth/accounts";

export const runtime = "nodejs";

// Sanitize: env values pasted from Vercel's `.env.local` snippet can include
// surrounding quotes/whitespace, which invalidates the token.
const token = (process.env.BLOB_READ_WRITE_TOKEN || "").trim().replace(/^["']|["']$/g, "") || undefined;

// Accepts a compact JPEG data URL and stores the image. In production it uploads
// to Vercel Blob and returns a short public URL; without a Blob token it returns
// the data URL unchanged so the app still works locally.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: { dataUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const dataUrl = body.dataUrl;
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    return NextResponse.json({ error: "Expected an image data URL." }, { status: 400 });
  }

  // No Blob configured → return the data URL as-is (dev / not yet provisioned).
  if (!token) {
    return NextResponse.json({ url: dataUrl, stored: false });
  }

  try {
    const match = dataUrl.match(/^data:(.+?);base64,(.*)$/);
    if (!match) return NextResponse.json({ error: "Unsupported image format." }, { status: 400 });
    const contentType = match[1];
    const buffer = Buffer.from(match[2], "base64");
    const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const key = `progress/${user.email.replace(/[^a-z0-9]/gi, "_")}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    try {
      const blob = await put(key, buffer, { access: "public", contentType, token });
      return NextResponse.json({ url: blob.url, stored: true });
    } catch (e) {
      // Store configured with private access: upload privately and hand back a
      // URL that streams through our authenticated /api/media proxy.
      if (!(e instanceof Error) || !/private/i.test(e.message)) throw e;
      await put(key, buffer, { access: "private", contentType, token });
      return NextResponse.json({ url: `/api/media?path=${encodeURIComponent(key)}`, stored: true });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
