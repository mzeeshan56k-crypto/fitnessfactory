"use client";

import { useRef, useState } from "react";
import { Video, Loader2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Vercel serverless request-body cap is ~4.5MB; keep a safe margin.
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Uploads a video by POSTing the raw file to our own /api/upload/video route,
 * which pushes it to Vercel Blob with a plain server-side put(). This is the
 * same reliable path the image upload uses — no client-side Blob token
 * handshake or streaming upload (both of which stalled in the browser).
 */
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

  async function handle(file?: File) {
    if (!file) return;
    setError("");
    if (file.size > MAX_BYTES) {
      setError(`That video is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please upload a clip under 4MB (trim it or lower the resolution).`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setUploading(true);
    setFileName(file.name);
    try {
      const res = await fetch(`/api/upload/video?name=${encodeURIComponent(file.name)}`, {
        method: "POST",
        headers: { "Content-Type": file.type || "video/mp4" },
        body: file,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Upload failed. Please try again.");
      if (!data.url) throw new Error("Upload failed — no URL returned.");
      onUploaded(data.url, file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
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
        {uploading
          ? `Uploading${fileName ? ` ${fileName.length > 26 ? fileName.slice(0, 26) + "…" : fileName}` : ""}…`
          : label}
      </button>
      {uploading && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
          <div className="h-full w-1/3 animate-indeterminate rounded-full bg-brand-500" />
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
      className={cn("w-full rounded-2xl border border-ink-200 bg-black", className)}
    />
  );
}
