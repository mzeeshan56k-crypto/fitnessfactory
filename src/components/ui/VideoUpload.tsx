"use client";

import { useRef, useState } from "react";
import { put as blobClientPut } from "@vercel/blob/client";
import { Video, Loader2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Vercel serverless request-body cap is ~4.5MB. Files at or under this go
// through our own server route (simplest, most reliable); anything larger
// uploads straight to Vercel Blob with a server-issued client token.
const SERVER_ROUTE_MAX_BYTES = 4 * 1024 * 1024;
const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2GB hard ceiling

export function VideoUpload({
  onUploaded,
  label = "Upload video",
  className,
}: {
  onUploaded: (url: string, name: string) => void;
  label?: string;
  className?: string;
  /** Accepted for backwards-compat; the server derives the storage path. */
  pathPrefix?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  // null = indeterminate (small-file path); number = real percentage.
  const [percent, setPercent] = useState<number | null>(null);

  // Small files: POST the raw file to our server, which stores it with a
  // plain put(). Proven reliable, but capped by the serverless body limit.
  async function uploadViaServer(file: File): Promise<string> {
    const res = await fetch(`/api/upload/video?name=${encodeURIComponent(file.name)}`, {
      method: "POST",
      headers: { "Content-Type": file.type || "video/mp4" },
      body: file,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Upload failed. Please try again.");
    if (!data.url) throw new Error("Upload failed — no URL returned.");
    return data.url as string;
  }

  // Large files: get a scoped client token from our server, then upload
  // straight to Vercel Blob (multipart: parallel parts, automatic retries).
  async function uploadDirect(file: File): Promise<string> {
    const tokenRes = await fetch("/api/upload/video/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name }),
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok) throw new Error(tokenData?.error || "Could not prepare the upload.");

    const { clientToken, pathname, access } = tokenData as {
      clientToken: string;
      pathname: string;
      access: "public" | "private";
    };
    setPercent(0);
    const blob = await blobClientPut(pathname, file, {
      access,
      token: clientToken,
      contentType: file.type || "video/mp4",
      multipart: true,
      onUploadProgress: ({ percentage }) => setPercent(Math.min(99, Math.round(percentage))),
    });
    // Private stores can't serve blobs by URL — stream through our authed proxy.
    return access === "private" ? `/api/media?path=${encodeURIComponent(pathname)}` : blob.url;
  }

  async function handle(file?: File) {
    if (!file) return;
    setError("");
    if (file.size > MAX_BYTES) {
      setError(`That video is ${(file.size / 1024 / 1024 / 1024).toFixed(1)}GB. Please keep clips under 2GB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setUploading(true);
    setFileName(file.name);
    setPercent(null);
    try {
      const url =
        file.size <= SERVER_ROUTE_MAX_BYTES ? await uploadViaServer(file) : await uploadDirect(file);
      onUploaded(url, file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setPercent(null);
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
        {uploading
          ? `Uploading${percent !== null ? ` ${percent}%` : ""}${fileName ? ` — ${fileName.length > 22 ? fileName.slice(0, 22) + "…" : fileName}` : ""}`
          : label}
      </button>
      {uploading && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
          {percent !== null ? (
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
              style={{ width: `${Math.max(percent, 2)}%` }}
            />
          ) : (
            <div className="h-full w-1/3 animate-indeterminate rounded-full bg-brand-500" />
          )}
        </div>
      )}
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
      preload="metadata"
      className={cn("w-full rounded-2xl border border-ink-200 bg-black", className)}
    />
  );
}
