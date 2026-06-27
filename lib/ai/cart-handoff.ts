import { calculateCartPrice } from "@/lib/pricing";
import { findRestaurantLocation } from "@/lib/restaurant";
import type { CartHandoffPayload } from "@/lib/ai/tools";

type CartHandoffInput = {
  locationId: "northside" | "factory-52";
  fulfillmentType: "pickup" | "delivery";
  promoCode?: string;
  tipCents?: number;
  items: {
    id: string;
    quantity: number;
    modifiers?: Record<string, string>;
    notes?: string;
  }[];
};

export function buildCartHandoff(input: CartHandoffInput, now = new Date()): CartHandoffPayload {
  const pricing = calculateCartPrice({
    fulfillmentType: input.fulfillmentType,
    promoCode: input.promoCode,
    tipCents: input.tipCents,
    items: input.items,
    now
  });
  const location = findRestaurantLocation(input.locationId);

  return {
    handoff: true,
    cart: {
      locationId: location.id,
      fulfillmentType: input.fulfillmentType,
      promoCode: input.promoCode || "",
      tipCents: input.tipCents || 0,
      items: pricing.normalizedItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        modifiers: item.modifiers,
        notes: item.notes
      }))
    },
    location: {
      name: location.name,
      address: location.address,
      phone: location.phone
    },
    pricing: {
      subtotal: `$${(pricing.subtotalCents / 100).toFixed(2)}`,
      discount: `$${(pricing.discountCents / 100).toFixed(2)}`,
      tax: `$${(pricing.taxCents / 100).toFixed(2)}`,
      deliveryFee: `$${(pricing.deliveryFeeCents / 100).toFixed(2)}`,
      tip: `$${(pricing.tipCents / 100).toFixed(2)}`,
      total: `$${(pricing.totalCents / 100).toFixed(2)}`,
      totalCents: pricing.totalCents
    },
    items: pricing.normalizedItems.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      modifiers: item.modifiers,
      lineTotal: `$${(item.lineTotalCents / 100).toFixed(2)}`
    }))
  };
}
