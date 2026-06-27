export function formatChatError(error: unknown) {
  if (error == null) return "Unknown error. Please try again.";
  if (typeof error === "string") return error;

  if (error instanceof Error) {
    const message = error.message;

    if (message.includes("CURSOR_OPENAI_BASE_URL") || message.includes("Composer requires") || message.includes("CURSOR_PROXY_AUTH_KEY")) {
      return "Composer 2.5 needs the Railway proxy. Set CURSOR_OPENAI_BASE_URL and CURSOR_PROXY_AUTH_KEY on Vercel (see services/cursor-proxy/README.md).";
    }

    if (message.includes("credit card on file")) {
      return "AI Gateway needs a payment method on your Vercel account. Add a card in Vercel → AI Gateway to unlock usage.";
    }

    if (message.includes("Unauthenticated") || message.includes("AI_GATEWAY_API_KEY")) {
      return "AI Gateway is not authenticated. Enable AI Gateway on Vercel or set AI_GATEWAY_API_KEY for local dev.";
    }

    if (message.includes("model") && message.includes("not found")) {
      return "The configured chat model is not available. Set AI_CHAT_MODEL to google/gemini-2.5-flash in Vercel env vars.";
    }

    return message;
  }

  return "The order assistant is temporarily unavailable. Call 513-620-7002 for help.";
}
