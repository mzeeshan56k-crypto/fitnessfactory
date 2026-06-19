import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Body {
  provider: "openai" | "anthropic" | "gemini";
  apiKey: string;
  model?: string;
  messages: ChatMessage[];
  system?: string;
}

const DEFAULT_MODELS = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-latest",
  gemini: "gemini-1.5-flash",
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { provider, apiKey, messages, system } = body;
  if (!provider || !apiKey) {
    return NextResponse.json(
      { error: "Missing provider or API key. Configure the AI Copilot in Settings." },
      { status: 400 },
    );
  }
  if (!messages?.length) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const model = body.model?.trim() || DEFAULT_MODELS[provider];
  const sys =
    system ||
    "You are the Fitness Factory KC AI Copilot, an expert fitness and nutrition coaching assistant. Be concise, practical and motivating. Use markdown when helpful.";

  try {
    let text = "";

    if (provider === "openai") {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: sys }, ...messages],
          temperature: 0.7,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error?.message || "OpenAI request failed");
      text = data.choices?.[0]?.message?.content ?? "";
    } else if (provider === "anthropic") {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: sys,
          messages: messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error?.message || "Anthropic request failed");
      text = data.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
    } else if (provider === "gemini") {
      const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: sys }] },
            contents,
          }),
        },
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error?.message || "Gemini request failed");
      text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    } else {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }

    return NextResponse.json({ text: text || "(empty response)" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
