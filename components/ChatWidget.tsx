"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ChatMessageList from "@/components/ChatMessage";
import type { CartHandoffPayload } from "@/lib/ai/tools";
import { defaultRestaurantLocation } from "@/lib/restaurant";

const QUICK_PROMPTS = [
  { label: "Vegetarian", prompt: "Vegetarian options" },
  { label: "Lunch special", prompt: "What's the lunch special?" },
  { label: "Mild for kids", prompt: "Something mild for kids" },
  { label: "Under $50", prompt: "Feed 4 people under $50" }
] as const;

const AUTO_OPEN_DELAY_MS = 1400;
const AUTO_OPEN_SESSION_KEY = "tikkaxpress-chat-auto-opened";

const transport = new DefaultChatTransport({ api: "/api/chat" });

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function buildWelcomeMessage() {
  return `${getTimeGreeting()}! Welcome to TikkaXpress — hope you're doing well. I'm your order assistant, and I can help you pick dishes, check dietary info, estimate your total, and get your order ready. What are you in the mood for today?`;
}

export default function ChatWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, clearError } = useChat({ transport });

  const isBusy = status === "submitted" || status === "streaming";

  const welcomeMessage = useMemo(() => buildWelcomeMessage(), []);
  const showQuickPrompts = messages.length === 0 && !isBusy;

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(AUTO_OPEN_SESSION_KEY)) return;

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(AUTO_OPEN_SESSION_KEY, "1");
      setOpen(true);
    }, AUTO_OPEN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  function handleCartHandoff(payload: CartHandoffPayload) {
    localStorage.setItem("tikkaxpress-cart", JSON.stringify(payload.cart));
    localStorage.setItem("tikkaxpress-chat-assisted", "1");
    window.dispatchEvent(new CustomEvent("tikkaxpress-cart-updated", { detail: payload.cart }));
    setOpen(false);
    router.push("/checkout");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    clearError();
    sendMessage({ text });
    setInput("");
  }

  function handleQuickPrompt(prompt: string) {
    if (isBusy) return;
    clearError();
    sendMessage({ text: prompt });
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-bold text-cream shadow-glow transition hover:scale-[1.02] hover:bg-charcoal"
          aria-label="Open order assistant chat"
        >
          <MessageCircle className="h-5 w-5 text-tandoori" />
          <span className="hidden sm:inline">Order assistant</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[min(720px,calc(100vh-2rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[20px] border border-black/10 bg-cream shadow-card [color-scheme:light] animate-[chat-pop_0.35s_ease-out]">
          <div className="flex items-center justify-between border-b border-black/8 bg-white/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-tandoori">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-black text-ink">TikkaXpress Assistant</div>
                <div className="text-xs text-charcoal/70">Menu help · cart · checkout handoff</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-charcoal transition hover:bg-black/5"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              <div className="max-w-[92%] rounded-[16px] rounded-bl-[6px] border border-black/8 bg-cream/90 px-3 py-2.5">
                <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-tandoori">Order assistant</div>
                <p className="text-sm leading-6 text-charcoal">{welcomeMessage}</p>
              </div>

              {showQuickPrompts && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {QUICK_PROMPTS.map((entry) => (
                    <button
                      key={entry.prompt}
                      type="button"
                      onClick={() => handleQuickPrompt(entry.prompt)}
                      className="shrink-0 rounded-full border border-black/10 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-ink transition hover:border-tandoori/40"
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>
              )}

              <ChatMessageList messages={messages} onCartHandoff={handleCartHandoff} />

              {isBusy && (
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-tandoori">Thinking...</div>
              )}

              {error && (
                <div className="rounded-[12px] border border-ember/20 bg-ember/10 px-3 py-2 text-sm text-ember">
                  {error.message || "Something went wrong. Please try again or call 513-620-7002."}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-black/8 bg-white/90 px-4 py-2.5">
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  rows={2}
                  placeholder="Ask about the menu, spice, allergens, or your order..."
                  className="min-h-[44px] flex-1 resize-none rounded-[12px] border border-black/10 bg-white px-3 py-2 text-sm text-ink caret-tandoori placeholder:text-charcoal/55 outline-none focus:focus-ring"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isBusy}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-tandoori text-ink transition hover:bg-ember hover:text-white disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              {messages.length === 0 && (
                <p className="mt-2 text-[10px] leading-4 text-charcoal/60">
                  AI suggestions are not medical advice. Confirm allergens with staff at{" "}
                  <a href={`tel:${defaultRestaurantLocation.phone}`} className="font-semibold text-ink underline">
                    {defaultRestaurantLocation.phone}
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
