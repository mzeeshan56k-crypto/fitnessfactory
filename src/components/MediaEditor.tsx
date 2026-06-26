"use client";

import { useRef, useState } from "react";
import { ImagePlus, Video, X, Loader2, Link2, FileText } from "lucide-react";
import type { TrainingMedia } from "@/lib/data";
import { fileToDataUrl } from "@/components/ui/ImageUpload";
import { uid } from "@/lib/store";

/** Reads any file as a raw data URL (no canvas downscaling — used for PDFs). */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/** Editor for the pictures + videos a trainer attaches to a workout / program. */
export function MediaEditor({
  media,
  onChange,
}: {
  media: TrainingMedia[];
  onChange: (m: TrainingMedia[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  async function upload(dataUrl: string): Promise<string> {
    // Upload to Blob when configured; falls back to the data URL otherwise.
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (data.url) return data.url;
    } catch {
      /* keep data URL */
    }
    return dataUrl;
  }

  async function handleImage(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file, 1080, 0.78);
      const url = await upload(dataUrl);
      onChange([...media, { id: uid("md"), type: "image", url }]);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handlePdf(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const url = await upload(dataUrl);
      onChange([...media, { id: uid("md"), type: "pdf", url, name: file.name }]);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      if (pdfRef.current) pdfRef.current.value = "";
    }
  }

  function addVideo() {
    const url = videoUrl.trim();
    if (!url) return;
    onChange([...media, { id: uid("md"), type: "video", url }]);
    setVideoUrl("");
  }

  function remove(id: string) {
    onChange(media.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-3">
      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {media.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-xl border border-ink-200 bg-ink-100">
              {m.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="attachment" className="aspect-video w-full object-cover" />
              ) : m.type === "pdf" ? (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 bg-ink-50 p-2 text-center">
                  <FileText className="h-5 w-5 text-rose-500" />
                  <span className="line-clamp-2 break-all text-[10px] text-ink-500">{m.name || "PDF"}</span>
                </div>
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 bg-ink-50 p-2 text-center">
                  <Video className="h-5 w-5 text-brand-400" />
                  <span className="line-clamp-2 break-all text-[10px] text-ink-500">{m.url}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => remove(m.id)}
                aria-label="Remove media"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-950/60 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Add picture"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImage(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => pdfRef.current?.click()}
          disabled={uploading}
          className="btn-secondary"
        >
          <FileText className="h-4 w-4" /> Add PDF
        </button>
        <input
          ref={pdfRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handlePdf(e.target.files?.[0])}
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-9"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVideo(); } }}
            placeholder="Paste a video link (YouTube, Vimeo, Loom, mp4…)"
          />
        </div>
        <button type="button" onClick={addVideo} disabled={!videoUrl.trim()} className="btn-secondary shrink-0 disabled:opacity-50">
          <Video className="h-4 w-4" /> Add
        </button>
      </div>
    </div>
  );
}
