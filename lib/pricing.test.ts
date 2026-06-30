import { describe, expect, it } from "vitest";
import { calculateCartPriceSync } from "@/lib/pricing";

const lunchWindow = new Date("2026-06-29T16:00:00.000Z");
const outsideLunchWindow = new Date("2026-06-29T20:00:00.000Z");

describe("calculateCartPrice", () => {
  it("calculates pickup totals from server-side menu prices", () => {
    const result = calculateCartPriceSync({
      fulfillmentType: "pickup",
      now: lunchWindow,
      items: [{ id: "veg-lunch", quantity: 2 }]
    });

    expect(result.subtotalCents).toBe(2198);
    expect(result.deliveryFeeCents).toBe(0);
    expect(result.taxCents).toBe(171);
    expect(result.totalCents).toBe(2369);
  });

  it("applies delivery fee, tip, and lunch promo", () => {
    const result = calculateCartPriceSync({
      fulfillmentType: "delivery",
      promoCode: "LUNCH10",
      tipCents: 400,
      now: lunchWindow,
      items: [{ id: "non-veg-lunch", quantity: 1 }]
    });

    expect(result.discountCents).toBe(120);
    expect(result.deliveryFeeCents).toBe(399);
    expect(result.tipCents).toBe(400);
    expect(result.totalCents).toBe(1962);
  });

  it("rejects unavailable or tampered menu item ids", () => {
    expect(() =>
      calculateCartPriceSync({
        fulfillmentType: "pickup",
        items: [{ id: "fake-price-1", quantity: 1 }]
      })
    ).toThrow("unavailable");
  });

  it("rejects empty carts", () => {
    expect(() =>
      calculateCartPriceSync({
        fulfillmentType: "pickup",
        items: []
      })
    ).toThrow("Cart is empty");
  });

  it("rejects lunch specials outside the configured lunch window", () => {
    expect(() =>
      calculateCartPriceSync({
        fulfillmentType: "pickup",
        now: outsideLunchWindow,
        items: [{ id: "veg-lunch", quantity: 1 }]
      })
    ).toThrow("unavailable");
  });

  it("rejects invalid modifier selections", () => {
    expect(() =>
      calculateCartPriceSync({
        fulfillmentType: "pickup",
        items: [{ id: "chicken-tikka-masala", quantity: 1, modifiers: { Spice: "Extreme" } }]
      })
    ).toThrow("Invalid Spice");
  });
});
