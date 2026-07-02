import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionUser } from "@/lib/auth/accounts";

export const runtime = "nodejs";

// Read the Blob read-write token defensively: env values pasted from Vercel's
// `.env.local` snippet often include surrounding quotes/whitespace, which makes
// the token invalid and produces "Access denied, please provide a valid token".
function blobToken(): string {
  return (process.env.BLOB_READ_WRITE_TOKEN || "").trim().replace(/^["']|["']$/g, "");
}

// Lets the client check whether video upload is usable before attempting one,
// so it can show a clear message instead of Blob's generic client-side error.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  return NextResponse.json({ configured: Boolean(blobToken()) });
}

// Two-step token handshake for direct-to-Blob uploads. The actual video bytes
// go straight from the browser to Vercel Blob storage — never through this
// serverless function or the shared workspace document — so large clips don't
// hit request-body limits or bloat the app's live-synced JSON state.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const token = blobToken();
  if (!token) {
    return NextResponse.json(
      { error: "Video upload isn't configured yet. Ask your admin to enable storage (BLOB_READ_WRITE_TOKEN)." },
      { status: 503 },
    );
  }

  const body = (await req.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      // Pass the sanitized token explicitly so client tokens are signed with a
      // valid read-write token (not an OIDC context that may lack write scope).
      token,
      onBeforeGenerateToken: async () => ({
        // Broad but concrete — no wildcards, which some Blob versions reject.
        allowedContentTypes: [
          "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo",
          "video/x-matroska", "video/3gpp", "video/ogg", "video/mpeg",
        ],
        addRandomSuffix: true,
        maximumSizeInBytes: 500 * 1024 * 1024, // 500MB
        tokenPayload: JSON.stringify({ email: user.email }),
      }),
      onUploadCompleted: async () => {
        // No server-side bookkeeping needed — the client records the resulting
        // URL via the member activity endpoint once the upload finishes.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
