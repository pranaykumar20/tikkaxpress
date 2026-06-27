"use client";

import Image from "next/image";
import type { UIMessage } from "ai";
import type { CartHandoffPayload } from "@/lib/ai/tools";

type SearchMenuOutput = {
  items?: {
    id: string;
    name: string;
    description: string;
    price: string;
    spiceLabel: string;
    image: string;
    tags: string[];
  }[];
};

function isCartHandoff(output: unknown): output is CartHandoffPayload {
  return Boolean(output && typeof output === "object" && "handoff" in output && (output as CartHandoffPayload).handoff);
}

function isSearchMenuOutput(output: unknown): output is SearchMenuOutput {
  return Boolean(output && typeof output === "object" && "items" in output);
}

function TextPart({ text }: { text: string }) {
  return <p className="whitespace-pre-wrap text-sm leading-6 text-ink">{text}</p>;
}

function MenuRecommendations({ items }: { items: NonNullable<SearchMenuOutput["items"]> }) {
  return (
    <div className="mt-2 space-y-2">
      {items.slice(0, 4).map((item) => (
        <div key={item.id} className="flex gap-3 rounded-[12px] border border-black/8 bg-white/80 p-2">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-cream">
            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-ink">{item.name}</div>
            <div className="text-xs text-charcoal/75">
              {item.price} · {item.spiceLabel}
            </div>
            <div className="line-clamp-2 text-xs text-charcoal/70">{item.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CartHandoffCard({
  payload,
  onConfirm
}: {
  payload: CartHandoffPayload;
  onConfirm: (payload: CartHandoffPayload) => void;
}) {
  return (
    <div className="mt-2 rounded-[14px] border border-tandoori/25 bg-white p-3 shadow-card">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-tandoori">Ready for checkout</div>
      <div className="mt-2 space-y-1">
        {payload.items.map((item) => (
          <div key={`${item.id}-${item.quantity}`} className="flex justify-between gap-3 text-sm">
            <span className="text-ink">
              {item.quantity}x {item.name}
              {item.modifiers && Object.keys(item.modifiers).length > 0
                ? ` (${Object.entries(item.modifiers)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ")})`
                : ""}
            </span>
            <span className="font-semibold text-ink">{item.lineTotal}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-black/8 pt-3 text-sm">
        <span className="font-bold text-ink">Total</span>
        <span className="font-black text-tandoori">{payload.pricing.total}</span>
      </div>
      <p className="mt-2 text-xs text-charcoal/70">
        {payload.location.name} · {payload.cart.fulfillmentType === "delivery" ? "Delivery" : "Pickup"}
      </p>
      <button
        type="button"
        onClick={() => onConfirm(payload)}
        className="mt-3 w-full rounded-[10px] bg-ink px-4 py-2.5 text-sm font-bold text-cream transition hover:bg-charcoal"
      >
        Add to cart & checkout
      </button>
    </div>
  );
}

export default function ChatMessageList({
  messages,
  onCartHandoff
}: {
  messages: UIMessage[];
  onCartHandoff: (payload: CartHandoffPayload) => void;
}) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
          <div
            className={
              message.role === "user"
                ? "max-w-[88%] rounded-[16px] rounded-br-[6px] bg-ink px-3 py-2.5 text-cream"
                : "max-w-[92%] rounded-[16px] rounded-bl-[6px] border border-black/8 bg-cream/90 px-3 py-2.5"
            }
          >
            {message.role === "assistant" && (
              <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-tandoori">Order assistant</div>
            )}
            {message.parts.map((part, index) => {
              if (part.type === "text") {
                return (
                  <div key={`${message.id}-${index}`} className={message.role === "user" ? "text-sm text-cream" : ""}>
                    <TextPart text={part.text} />
                  </div>
                );
              }

              if (part.type === "tool-searchMenu" && part.state === "output-available" && isSearchMenuOutput(part.output)) {
                if (!part.output.items?.length) return null;
                return (
                  <div key={`${message.id}-${index}`}>
                    <MenuRecommendations items={part.output.items} />
                  </div>
                );
              }

              if (part.type === "tool-prepareCartHandoff" && part.state === "output-available" && isCartHandoff(part.output)) {
                return (
                  <div key={`${message.id}-${index}`}>
                    <CartHandoffCard payload={part.output} onConfirm={onCartHandoff} />
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
