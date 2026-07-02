"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Video, Loader2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Uploads a video file straight to Vercel Blob storage from the browser
 * (bypassing our API routes and the shared workspace document — videos can be
 * tens of MB, far too large to embed in synced JSON state). Requires
 * BLOB_READ_WRITE_TOKEN to be configured server-side; shows a clear message
 * if it isn't.
 */
export function VideoUpload({
  pathPrefix,
  onUploaded,
  label = "Upload video",
  className,
}: {
  /** Folder the clip is stored under, e.g. `formcheck/${clientId}`. */
  pathPrefix: string;
  onUploaded: (url: string, name: string) => void;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  async function handle(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    setFileName(file.name);
    try {
      // Check first so we can show an actionable message instead of Blob's
      // generic "Failed to retrieve the client token" (it discards our
      // server's actual error text whenever the handshake isn't a 200).
      const status = await fetch("/api/upload/video").then((r) => r.json()).catch(() => null);
      if (status && status.configured === false) {
        throw new Error(
          "Video upload isn't set up yet. Ask your admin to enable it: Vercel dashboard → Storage → Create Database → Blob → Connect to this project, then redeploy.",
        );
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const blob = await upload(`${pathPrefix}/${Date.now()}-${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload/video",
      });
      onUploaded(blob.url, file.name);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed. Please try again.";
      const setupMsg =
        "Video upload isn't set up correctly. Admin: in Vercel → Project → Settings → Environment Variables, make sure BLOB_READ_WRITE_TOKEN is set to the token from the Blob store's .env.local tab (no surrounding quotes), then redeploy.";
      setError(
        message.includes("Failed to retrieve the client token") || message.includes("Access denied")
          ? setupMsg
          : message,
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
        {uploading ? `Uploading ${fileName}…` : label}
      </button>
      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto shrink-0 text-rose-300 hover:text-rose-400" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Compact inline <video> preview for a stored clip URL. */
export function VideoPreview({ url, className }: { url: string; className?: string }) {
  return (
    <video
      src={url}
      controls
      className={cn("w-full rounded-2xl border border-ink-200 bg-black", className)}
    />
  );
}
