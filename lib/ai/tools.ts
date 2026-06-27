import { tool } from "ai";
import { z } from "zod";
import { buildCartHandoff } from "@/lib/ai/cart-handoff";
import { searchMenu } from "@/lib/ai/menu-search";
import { calculateCartPrice } from "@/lib/pricing";
import { findMenuItem } from "@/lib/menu";
import { getOrder } from "@/lib/orders";
import {
  findRestaurantLocation,
  isMenuItemAvailableNow,
  isRestaurantOpen,
  restaurantConfig,
  restaurantLocations
} from "@/lib/restaurant";

const cartItemSchema = z.object({
  id: z.string().describe("Menu item id from searchMenu results"),
  quantity: z.number().int().min(1).max(20).default(1),
  modifiers: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional()
});

export function createRestaurantTools(now = new Date()) {
  return {
    searchMenu: tool({
      description:
        "Search and filter the TikkaXpress menu. Use before recommending dishes or quoting item details.",
      inputSchema: z.object({
        query: z.string().optional().describe("Free-text search across name, description, and tags"),
        tags: z
          .array(z.string())
          .optional()
          .describe("Filter tags such as Vegetarian, Gluten Free, Chicken, Popular"),
        maxSpiceLevel: z.number().int().min(0).max(3).optional().describe("0=Mild, 3=Fire"),
        categoryId: z.string().optional().describe("Category id such as curries, lunch-special, breads"),
        maxPriceCents: z.number().int().optional(),
        availableOnly: z.boolean().optional().default(true),
        limit: z.number().int().min(1).max(20).optional()
      }),
      execute: async (input) => searchMenu(input, now)
    }),

    getRestaurantInfo: tool({
      description: "Get restaurant hours, open/closed status, locations, fees, and ordering policies.",
      inputSchema: z.object({
        locationId: z.string().optional().describe("northside or factory-52")
      }),
      execute: async ({ locationId }) => {
        const location = locationId ? findRestaurantLocation(locationId) : null;
        return {
          name: restaurantConfig.name,
          isOpen: isRestaurantOpen(now),
          hours: `${restaurantConfig.openHour}:00–${restaurantConfig.closeHour}:00`,
          timeZone: restaurantConfig.timeZone,
          prepMinutes: restaurantConfig.prepMinutes,
          taxRate: restaurantConfig.taxRate,
          deliveryFeeCents: restaurantConfig.deliveryFeeCents,
          minimumOrderCents: restaurantConfig.minimumOrderCents,
          promoCodes: ["LUNCH10 (10% off)"],
          locations: restaurantLocations.map((entry) => ({
            id: entry.id,
            name: entry.name,
            address: entry.address,
            phone: entry.phone
          })),
          selectedLocation: location
            ? {
                id: location.id,
                name: location.name,
                address: location.address,
                phone: location.phone
              }
            : null
        };
      }
    }),

    checkItemAvailability: tool({
      description: "Check whether a specific menu item is available right now.",
      inputSchema: z.object({
        itemId: z.string()
      }),
      execute: async ({ itemId }) => {
        const item = findMenuItem(itemId);
        if (!item) {
          return { itemId, found: false, availableNow: false, reason: "Item not found." };
        }
        const availableNow = isMenuItemAvailableNow(item, now);
        return {
          itemId,
          found: true,
          name: item.name,
          availableNow,
          categoryId: item.categoryId,
          reason: availableNow ? "Available now." : "Not available at this time (check lunch/weekend specials or hours)."
        };
      }
    }),

    priceCart: tool({
      description: "Calculate authoritative cart totals including tax, delivery, promo, and tip.",
      inputSchema: z.object({
        fulfillmentType: z.enum(["pickup", "delivery"]),
        promoCode: z.string().optional(),
        tipCents: z.number().int().min(0).optional(),
        items: z.array(cartItemSchema).min(1)
      }),
      execute: async (input) => {
        const pricing = calculateCartPrice({ ...input, now });
        return {
          subtotal: `$${(pricing.subtotalCents / 100).toFixed(2)}`,
          discount: `$${(pricing.discountCents / 100).toFixed(2)}`,
          tax: `$${(pricing.taxCents / 100).toFixed(2)}`,
          deliveryFee: `$${(pricing.deliveryFeeCents / 100).toFixed(2)}`,
          tip: `$${(pricing.tipCents / 100).toFixed(2)}`,
          total: `$${(pricing.totalCents / 100).toFixed(2)}`,
          subtotalCents: pricing.subtotalCents,
          discountCents: pricing.discountCents,
          taxCents: pricing.taxCents,
          deliveryFeeCents: pricing.deliveryFeeCents,
          tipCents: pricing.tipCents,
          totalCents: pricing.totalCents,
          items: pricing.normalizedItems.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            modifiers: item.modifiers,
            notes: item.notes,
            lineTotal: `$${(item.lineTotalCents / 100).toFixed(2)}`
          }))
        };
      }
    }),

    prepareCartHandoff: tool({
      description:
        "Prepare a validated cart for checkout after the customer confirms items. Returns cart payload for the website checkout page.",
      inputSchema: z.object({
        locationId: z.enum(["northside", "factory-52"]).default("northside"),
        fulfillmentType: z.enum(["pickup", "delivery"]),
        promoCode: z.string().optional(),
        tipCents: z.number().int().min(0).optional(),
        items: z.array(cartItemSchema).min(1)
      }),
      execute: async (input) => buildCartHandoff(input, now)
    }),

    getOrderStatus: tool({
      description: "Look up order status after checkout using order ID and customer email.",
      inputSchema: z.object({
        orderId: z.string(),
        email: z.string().email()
      }),
      execute: async ({ orderId, email }) => {
        const order = await getOrder(orderId);
        if (!order) {
          return { found: false, message: "Order not found. Check the order ID from your confirmation." };
        }
        if (order.customer.email.toLowerCase() !== email.toLowerCase()) {
          return { found: false, message: "Order not found for that email address." };
        }
        return {
          found: true,
          orderId: order.id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          fulfillmentType: order.fulfillmentType,
          location: order.location.name,
          total: `$${(order.totalCents / 100).toFixed(2)}`,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity
          }))
        };
      }
    })
  };
}

export type CartHandoffPayload = {
  handoff: true;
  cart: {
    locationId: string;
    fulfillmentType: "pickup" | "delivery";
    promoCode: string;
    tipCents: number;
    items: {
      id: string;
      quantity: number;
      modifiers?: Record<string, string>;
      notes?: string;
    }[];
  };
  location: {
    name: string;
    address: string;
    phone: string;
  };
  pricing: {
    subtotal: string;
    discount: string;
    tax: string;
    deliveryFee: string;
    tip: string;
    total: string;
    totalCents: number;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    modifiers?: Record<string, string>;
    lineTotal: string;
  }[];
};
