"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50/40 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500">
        <RefreshCw className="h-7 w-7" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-ink-900">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-ink-500">
        An unexpected error occurred. Try again, or head back home.
      </p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="btn-primary">Try again</button>
        <Link href="/" className="btn-secondary">Go home</Link>
      </div>
    </div>
  );
}
