import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { getSessionUser } from "@/lib/auth/accounts";

export const runtime = "nodejs";

// Sanitize: env values pasted from Vercel's `.env.local` snippet can include
// surrounding quotes/whitespace, which invalidates the token.
function blobToken(): string {
  return (process.env.BLOB_READ_WRITE_TOKEN || "").trim().replace(/^["']|["']$/g, "");
}

// Whether the store accepts public or private blobs is fixed per store, but
// there's no API to read it — probe once with a tiny write and cache the
// answer for the lifetime of the lambda.
let storeAccess: "public" | "private" | null = null;
async function detectStoreAccess(token: string): Promise<"public" | "private"> {
  if (storeAccess) return storeAccess;
  const probeKey = `formcheck/.probe/${Date.now()}.txt`;
  try {
    await put(probeKey, "probe", { access: "public", contentType: "text/plain", token });
    storeAccess = "public";
  } catch (e) {
    if (e instanceof Error && /private/i.test(e.message)) storeAccess = "private";
    else throw e;
  }
  del(probeKey, { token }).catch(() => {});
  return storeAccess ?? "public";
}

// Issues a short-lived client token so the browser can upload large videos
// straight to Vercel Blob (multipart), bypassing the ~4.5MB serverless
// request-body limit that the buffered /api/upload/video path is subject to.
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

  let body: { name?: string } = {};
  try {
    body = await req.json();
  } catch {
    // name is optional
  }

  const safeName = String(body.name || "video.mp4").replace(/[^a-zA-Z0-9._-]/g, "_");
  const pathname = `formcheck/${user.email.replace(/[^a-z0-9]/gi, "_")}/${Date.now()}-${safeName}`;

  try {
    const access = await detectStoreAccess(token);
    const clientToken = await generateClientTokenFromReadWriteToken({
      token,
      pathname,
      allowedContentTypes: ["video/*"],
      maximumSizeInBytes: 2 * 1024 * 1024 * 1024, // 2GB
      validUntil: Date.now() + 60 * 60 * 1000, // 1 hour — enough for slow connections
    });
    return NextResponse.json({ clientToken, pathname, access });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not prepare the upload.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
