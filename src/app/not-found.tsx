import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-ink-100 to-ink-50 px-6 text-center">
      <Logo />
      <h1 className="mt-10 text-7xl font-extrabold tracking-tight text-ink-900">404</h1>
      <p className="mt-3 max-w-sm text-ink-500">
        We couldn&apos;t find that page. It may have moved or never existed.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/login" className="btn-secondary">Sign in</Link>
        <Link href="/dashboard" className="btn-primary">Open dashboard</Link>
      </div>
    </div>
  );
}
