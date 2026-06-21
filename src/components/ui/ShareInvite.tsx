"use client";

import { useState } from "react";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";

/** One-tap ways to send an invitation link (works without email configured). */
export function ShareInvite({
  url,
  email,
  business,
}: {
  url: string;
  email?: string;
  business?: string;
}) {
  const [copied, setCopied] = useState(false);
  const gym = business || "Fitness Factory KC";
  const message = `You're invited to join ${gym}. Set up your account here: ${url}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const mailto = `mailto:${email ?? ""}?subject=${encodeURIComponent(`Join ${gym}`)}&body=${encodeURIComponent(message)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-2">
      <span className="label">Invitation link</span>
      <div className="flex gap-2">
        <input readOnly className="input" value={url} onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn-secondary shrink-0" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="flex gap-2">
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex-1 justify-center"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <a href={mailto} className="btn-secondary flex-1 justify-center">
          <Mail className="h-4 w-4" /> Email
        </a>
      </div>
    </div>
  );
}
