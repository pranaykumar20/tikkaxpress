import { describe, expect, it } from "vitest";
import {
  extractAddToCartPhrase,
  parseLeadingQuantity,
  scoreItemMatch,
  splitExplicitItemPhrases
} from "@/lib/ai/cart-intent";

describe("cart intent parsing", () => {
  it("extracts only the requested item phrase from an add-to-cart message", () => {
    expect(extractAddToCartPhrase("add one chicken tikka masala to my cart")).toBe(
      "one chicken tikka masala"
    );
  });

  it("parses a leading quantity from the item phrase", () => {
    expect(parseLeadingQuantity("one chicken tikka masala")).toEqual({
      quantity: 1,
      itemPhrase: "chicken tikka masala"
    });
  });

  it("scores chicken tikka masala above other tikka dishes for a typo", () => {
    const chicken = scoreItemMatch("chicken tikka masla", "Chicken Tikka Masala");
    const lamb = scoreItemMatch("chicken tikka masla", "Lamb Tikka Masala");
    const butter = scoreItemMatch("chicken tikka masla", "Butter Chicken");

    expect(chicken).toBeGreaterThan(lamb);
    expect(chicken).toBeGreaterThan(butter);
  });

  it("keeps only explicitly joined items when the user lists multiple dishes", () => {
    expect(splitExplicitItemPhrases("butter chicken and garlic naan")).toEqual([
      "butter chicken",
      "garlic naan"
    ]);
  });
});
