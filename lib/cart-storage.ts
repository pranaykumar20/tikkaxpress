import type { CartLine } from "@/components/Storefront";
import type { FulfillmentType } from "@/lib/menu";

export type SavedCart = {
  locationId?: string;
  fulfillmentType: FulfillmentType;
  promoCode?: string;
  tipCents?: number;
  items: CartLine[];
};

function sameLine(a: CartLine, b: CartLine) {
  return (
    a.id === b.id &&
    JSON.stringify(a.modifiers || {}) === JSON.stringify(b.modifiers || {}) &&
    (a.notes || "") === (b.notes || "")
  );
}

export function readSavedCart(): SavedCart {
  if (typeof window === "undefined") {
    return { fulfillmentType: "pickup", items: [] };
  }

  try {
    const saved = localStorage.getItem("tikkaxpress-cart");
    if (!saved) return { fulfillmentType: "pickup", items: [] };
    const parsed = JSON.parse(saved) as SavedCart;
    return {
      fulfillmentType: parsed.fulfillmentType || "pickup",
      locationId: parsed.locationId,
      promoCode: parsed.promoCode || "",
      tipCents: parsed.tipCents || 0,
      items: Array.isArray(parsed.items) ? parsed.items : []
    };
  } catch {
    return { fulfillmentType: "pickup", items: [] };
  }
}

export function mergeCartLines(existing: CartLine[], incoming: CartLine[]) {
  const merged = [...existing];

  for (const line of incoming) {
    const match = merged.find((entry) => sameLine(entry, line));
    if (match) {
      match.quantity = Math.min(20, match.quantity + line.quantity);
      if (line.notes) match.notes = line.notes;
    } else {
      merged.push({ ...line });
    }
  }

  return merged;
}

export function writeSavedCart(cart: SavedCart) {
  localStorage.setItem("tikkaxpress-cart", JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("tikkaxpress-cart-updated", { detail: cart }));
}
