/** Preferred model per product request. Composer 2.5 is Cursor-proprietary and not on Vercel AI Gateway. */
export const PREFERRED_CHAT_MODEL = "cursor/composer-2.5-fast";

/** Reliable fallback when the preferred model is unavailable on hosted runtimes. */
export const FALLBACK_CHAT_MODEL = "google/gemini-2.5-flash";

export function resolveChatModelIds(): string[] {
  const configured = process.env.AI_CHAT_MODEL?.trim();
  const fallback = process.env.AI_CHAT_MODEL_FALLBACK?.trim() || FALLBACK_CHAT_MODEL;

  if (configured) {
    return configured === fallback ? [configured] : [configured, fallback];
  }

  return [PREFERRED_CHAT_MODEL, fallback];
}
