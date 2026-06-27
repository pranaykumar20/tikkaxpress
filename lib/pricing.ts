import { findMenuItem, type FulfillmentType } from "@/lib/menu";
import { isMenuItemAvailableNow, restaurantConfig } from "@/lib/restaurant";

export type PriceCartItem = {
  id: string;
  quantity: number;
  modifiers?: Record<string, string>;
  notes?: string;
};

export type PriceRequest = {
  fulfillmentType: FulfillmentType;
  tipCents?: number;
  promoCode?: string;
  items: PriceCartItem[];
  now?: Date;
};

export type PriceResult = {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  totalCents: number;
  normalizedItems: (PriceCartItem & { name: string; unitPriceCents: number; lineTotalCents: number })[];
};

const LUNCH10 = "LUNCH10";

export function calculateCartPrice(request: PriceRequest): PriceResult {
  if (!["pickup", "delivery"].includes(request.fulfillmentType)) {
    throw new Error("Invalid fulfillment type.");
  }
  if (!request.items?.length) {
    throw new Error("Cart is empty.");
  }

  const normalizedItems = request.items.map((cartItem) => {
    const menuItem = findMenuItem(cartItem.id);
    if (!menuItem || !isMenuItemAvailableNow(menuItem, request.now)) {
      throw new Error(`Menu item ${cartItem.id} is unavailable.`);
    }
    for (const option of menuItem.options || []) {
      const selected = cartItem.modifiers?.[option.label];
      if (selected && !option.choices.includes(selected)) {
        throw new Error(`Invalid ${option.label} selection for ${menuItem.name}.`);
      }
    }

    const quantity = Math.max(1, Math.min(20, Math.floor(cartItem.quantity || 1)));
    return {
      ...cartItem,
      quantity,
      name: menuItem.name,
      unitPriceCents: menuItem.priceCents,
      lineTotalCents: menuItem.priceCents * quantity
    };
  });

  const subtotalCents = normalizedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
  if (subtotalCents < restaurantConfig.minimumOrderCents) {
    throw new Error(`Minimum order is ${restaurantConfig.minimumOrderCents} cents.`);
  }
  const discountCents = request.promoCode?.trim().toUpperCase() === LUNCH10 ? Math.round(subtotalCents * 0.1) : 0;
  const taxableCents = Math.max(0, subtotalCents - discountCents);
  const taxCents = Math.round(taxableCents * restaurantConfig.taxRate);
  const deliveryFeeCents = request.fulfillmentType === "delivery" ? restaurantConfig.deliveryFeeCents : 0;
  const tipCents = Math.max(0, Math.min(20000, Math.floor(request.tipCents || 0)));
  const totalCents = taxableCents + taxCents + deliveryFeeCents + tipCents;

  return {
    subtotalCents,
    discountCents,
    taxCents,
    deliveryFeeCents,
    tipCents,
    totalCents,
    normalizedItems
  };
}
