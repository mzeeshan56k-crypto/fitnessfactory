import type { AppSettings } from "@/lib/store";

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const AI_MODELS: Record<string, { label: string; models: string[] }> = {
  openai: { label: "OpenAI (ChatGPT)", models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "o4-mini"] },
  anthropic: { label: "Anthropic (Claude)", models: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", "claude-3-opus-latest"] },
  gemini: { label: "Google (Gemini)", models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"] },
};

export function aiConfigured(settings: AppSettings | undefined): boolean {
  return Boolean(settings?.aiProvider && settings?.aiApiKey);
}

/**
 * Sends a conversation to the configured AI provider via our proxy route.
 * Throws if not configured or the request fails.
 */
export async function askAI(
  settings: AppSettings,
  messages: AIChatMessage[],
  system?: string,
): Promise<string> {
  if (!aiConfigured(settings)) {
    throw new Error("AI is not configured. Add a provider and API key in Settings → AI Copilot.");
  }
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: settings.aiProvider,
      apiKey: settings.aiApiKey,
      model: settings.aiModel,
      messages,
      system,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "AI request failed");
  return data.text as string;
}
