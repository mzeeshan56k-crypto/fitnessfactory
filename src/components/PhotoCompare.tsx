"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Images, Pencil, Eraser, SlidersHorizontal } from "lucide-react";
import { useLocalState } from "@/lib/useLocalState";
import { cn } from "@/lib/utils";

export interface ComparePhoto {
  id: string;
  label: string;
  dataUrl: string;
}

interface PhotoCompareProps {
  photos: ComparePhoto[];
  annotatable?: boolean;
  storageKey?: string;
}

const BRAND_RED = "#ef4444"; // matches brand accent for highlight strokes

export function PhotoCompare({
  photos,
  annotatable = false,
  storageKey,
}: PhotoCompareProps) {
  // Default selections: Before = first, After = last.
  const firstId = photos[0]?.id ?? "";
  const lastId = photos[photos.length - 1]?.id ?? "";

  const [beforeId, setBeforeId] = useState(firstId);
  const [afterId, setAfterId] = useState(lastId);

  // Keep selections valid if the photos list changes.
  useEffect(() => {
    if (!photos.some((p) => p.id === beforeId)) setBeforeId(firstId);
    if (!photos.some((p) => p.id === afterId)) setAfterId(lastId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  const before = useMemo(
    () => photos.find((p) => p.id === beforeId) ?? photos[0],
    [photos, beforeId],
  );
  const after = useMemo(
    () => photos.find((p) => p.id === afterId) ?? photos[photos.length - 1],
    [photos, afterId],
  );

  // Overlay fade: 0 = show Before only, 100 = show After fully on top of Before.
  const [overlay, setOverlay] = useState(false);
  const [fade, setFade] = useState(100);

  if (photos.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-300">
          <Images className="h-6 w-6" />
        </span>
        <p className="mt-4 text-sm font-medium text-ink-500">
          Add at least two photos to compare
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pickers + overlay toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 grid-cols-2 gap-3">
          <div>
            <label htmlFor="pc-before" className="label">
              Before
            </label>
            <select
              id="pc-before"
              className="input"
              value={before?.id ?? ""}
              onChange={(e) => setBeforeId(e.target.value)}
            >
              {photos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pc-after" className="label">
              After
            </label>
            <select
              id="pc-after"
              className="input"
              value={after?.id ?? ""}
              onChange={(e) => setAfterId(e.target.value)}
            >
              {photos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOverlay((v) => !v)}
          className={cn(
            "btn-secondary shrink-0",
            overlay && "border-brand-300 text-brand-400",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {overlay ? "Side by side" : "Overlay fade"}
        </button>
      </div>

      {overlay ? (
        <OverlayView before={before} after={after} fade={fade} setFade={setFade} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <PhotoPane photo={before} caption="Before" />
          {annotatable && storageKey ? (
            <AnnotatablePane photo={after} storageKey={storageKey} />
          ) : (
            <PhotoPane photo={after} caption="After" />
          )}
        </div>
      )}
    </div>
  );
}

function PhotoPane({
  photo,
  caption,
}: {
  photo?: ComparePhoto;
  caption: string;
}) {
  if (!photo) return null;
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-ink-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.dataUrl}
          alt={`${caption} — ${photo.label}`}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="badge bg-ink-100 text-ink-500">{caption}</span>
        <span className="font-medium text-ink-400">{photo.label}</span>
      </div>
    </div>
  );
}

function OverlayView({
  before,
  after,
  fade,
  setFade,
}: {
  before?: ComparePhoto;
  after?: ComparePhoto;
  fade: number;
  setFade: (v: number) => void;
}) {
  if (!before || !after) return null;
  return (
    <div className="space-y-3">
      <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-ink-200 bg-ink-100">
        {/* Before (base layer) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before.dataUrl}
          alt={`Before — ${before.label}`}
          className="h-full w-full object-cover"
        />
        {/* After fades in on top */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={after.dataUrl}
          alt={`After — ${after.label}`}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: fade / 100 }}
        />
      </div>
      <div className="mx-auto max-w-sm">
        <div className="flex items-center justify-between text-xs font-medium text-ink-400">
          <span>{before.label}</span>
          <span>{after.label}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={fade}
          onChange={(e) => setFade(Number(e.target.value))}
          aria-label="Fade between before and after"
          className="mt-1 w-full accent-brand-500"
        />
        <div className="mt-1 text-center text-[11px] text-ink-400">
          Drag to fade between Before and After
        </div>
      </div>
    </div>
  );
}

function AnnotatablePane({
  photo,
  storageKey,
}: {
  photo?: ComparePhoto;
  storageKey: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const [drawMode, setDrawMode] = useState(true);
  const [saved, setSaved, savedHydrated] = useLocalState<string>(storageKey, "");

  // Size the canvas to the rendered image and (re)load the saved drawing.
  const syncCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    // Only resize if needed (resizing clears the canvas).
    if (canvas.width !== Math.round(rect.width) || canvas.height !== Math.round(rect.height)) {
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
      restoreSaved();
    }
  };

  const restoreSaved = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!saved) return;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = saved;
  };

  // Restore once hydrated localStorage + image are ready.
  useEffect(() => {
    if (!savedHydrated) return;
    syncCanvas();
    restoreSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedHydrated, saved, photo?.id]);

  // Keep canvas sized to image on resize.
  useEffect(() => {
    const onResize = () => syncCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawMode) return;
    e.preventDefault();
    syncCanvas();
    drawing.current = true;
    last.current = pointFromEvent(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !drawMode) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const p = pointFromEvent(e);
    const from = last.current ?? p;
    ctx.strokeStyle = BRAND_RED;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const canvas = canvasRef.current;
    if (canvas) setSaved(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSaved("");
  };

  if (!photo) return null;

  return (
    <div className="space-y-2">
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-2xl border border-ink-200 bg-ink-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={photo.dataUrl}
          alt={`After — ${photo.label}`}
          className="block h-full w-full select-none object-cover"
          draggable={false}
          onLoad={() => {
            syncCanvas();
            restoreSaved();
          }}
        />
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
          className={cn(
            "absolute inset-0 h-full w-full touch-none",
            drawMode ? "cursor-crosshair" : "pointer-events-none",
          )}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="badge bg-brand-500/15 text-brand-400">After</span>
        <span className="text-xs font-medium text-ink-400">{photo.label}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDrawMode(true)}
          className={cn(
            "btn-secondary",
            drawMode && "border-brand-300 text-brand-400",
          )}
        >
          <Pencil className="h-4 w-4" />
          Draw
        </button>
        <button type="button" onClick={clear} className="btn-secondary">
          <Eraser className="h-4 w-4" />
          Clear
        </button>
        <span
          className="flex items-center gap-1.5 text-xs text-ink-400"
          aria-hidden
        >
          <span className="h-3 w-3 rounded-full bg-brand-500" />
          Highlight color
        </span>
      </div>
    </div>
  );
}
