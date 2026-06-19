"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Reads a File and returns a downscaled JPEG data URL (keeps localStorage small). */
export function fileToDataUrl(file: File, maxDim = 720, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({
  value,
  onChange,
  label = "Upload photo",
  aspect = "square",
  className,
}: {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  label?: string;
  aspect?: "square" | "video" | "tall";
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const ratio =
    aspect === "video" ? "aspect-video" : aspect === "tall" ? "aspect-[3/4]" : "aspect-square";

  async function handle(file?: File) {
    if (!file) return;
    setLoading(true);
    try {
      const url = await fileToDataUrl(file);
      onChange(url);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {value ? (
        <div className={cn("group relative overflow-hidden rounded-2xl border border-ink-100", ratio)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="upload" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink-50/40 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={() => inputRef.current?.click()}
              className="btn bg-ink-100/80 px-3 py-1.5 text-xs text-ink-800 hover:bg-ink-100"
            >
              Replace
            </button>
            <button
              onClick={() => onChange(undefined)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100/80 text-rose-400 hover:bg-ink-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/50 text-ink-400 transition hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-400",
            ratio,
          )}
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Camera className="h-6 w-6" />
          )}
          <span className="text-xs font-medium">{loading ? "Processing…" : label}</span>
        </button>
      )}
    </div>
  );
}
