import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

export type ChatProvider = "cursor" | "gateway";

export const CURSOR_DEFAULT_MODEL = "composer-2.5-fast";
export const CURSOR_FALLBACK_MODEL = "composer-2.5";
export const GATEWAY_DEFAULT_MODEL = "google/gemini-2.5-flash";
export const GATEWAY_FALLBACK_MODEL = "google/gemini-2.5-flash-lite";

export function resolveChatProvider(): ChatProvider {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "cursor") return "cursor";
  if (explicit === "gateway") return "gateway";

  if (process.env.CURSOR_PROXY_AUTH_KEY?.trim() && process.env.CURSOR_OPENAI_BASE_URL?.trim()) {
    return "cursor";
  }

  if (process.env.CURSOR_API_KEY?.trim() && process.env.CURSOR_OPENAI_BASE_URL?.trim()) {
    return "cursor";
  }

  return "gateway";
}

export function resolveChatModelIds(): string[] {
  const provider = resolveChatProvider();

  if (provider === "cursor") {
    const primary = process.env.AI_CHAT_MODEL?.trim() || CURSOR_DEFAULT_MODEL;
    const fallback = process.env.AI_CHAT_MODEL_FALLBACK?.trim() || CURSOR_FALLBACK_MODEL;
    return primary === fallback ? [primary] : [primary, fallback];
  }

  const primary = process.env.AI_CHAT_MODEL?.trim() || GATEWAY_DEFAULT_MODEL;
  const fallback = process.env.AI_CHAT_MODEL_FALLBACK?.trim() || GATEWAY_FALLBACK_MODEL;
  return primary === fallback ? [primary] : [primary, fallback];
}

export function createChatModel(modelId: string): LanguageModel | string {
  if (resolveChatProvider() !== "cursor") {
    return modelId;
  }

  const baseURL = normalizeCursorBaseUrl(process.env.CURSOR_OPENAI_BASE_URL || "");
  // Bearer token for the Railway proxy (AUTH_KEY), not the Cursor integration key.
  const apiKey = process.env.CURSOR_PROXY_AUTH_KEY?.trim() || process.env.CURSOR_API_KEY?.trim();

  if (!baseURL || !apiKey) {
    throw new Error(
      "Composer requires CURSOR_OPENAI_BASE_URL and CURSOR_PROXY_AUTH_KEY. Deploy the Railway proxy in services/cursor-proxy."
    );
  }

  const cursor = createOpenAICompatible({
    name: "cursor",
    baseURL,
    apiKey
  });

  return cursor(modelId);
}

export function getChatProviderLabel() {
  return resolveChatProvider() === "cursor" ? "Cursor Composer" : "Vercel AI Gateway";
}

function normalizeCursorBaseUrl(raw: string) {
  let value = raw.trim().replace(/^["']|["']$/g, "");

  if (!value) {
    throw new Error("CURSOR_OPENAI_BASE_URL is empty.");
  }

  if (/^\d+$/.test(value)) {
    throw new Error(
      `CURSOR_OPENAI_BASE_URL cannot be a port number (${value}). Use your full Railway URL, e.g. https://your-app.up.railway.app/v1`
    );
  }

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  value = value.replace(/\/+$/, "");
  value = value.replace(/\/chat\/completions$/i, "");

  if (!value.endsWith("/v1")) {
    value = `${value}/v1`;
  }

  try {
    new URL(value);
  } catch {
    throw new Error(
      `CURSOR_OPENAI_BASE_URL is invalid: "${raw}". Use https://YOUR-RAILWAY-DOMAIN.up.railway.app/v1`
    );
  }

  return value;
}
