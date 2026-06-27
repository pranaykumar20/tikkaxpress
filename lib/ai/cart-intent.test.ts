import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import {
  extractAddToCartPhrase,
  parseLeadingQuantity,
  scoreItemMatch,
  splitExplicitItemPhrases,
  tryPrepareCartFromMessages
} from "@/lib/ai/cart-intent";

function chatMessages(userText: string, assistantText: string): UIMessage[] {
  return [
    {
      id: "user-1",
      role: "user",
      parts: [{ type: "text", text: "vegetarian options" }]
    },
    {
      id: "assistant-1",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: assistantText
        }
      ]
    },
    {
      id: "user-2",
      role: "user",
      parts: [{ type: "text", text: userText }]
    }
  ];
}

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

  it("adds only the dish named in the latest add-to-cart message", async () => {
    const result = await tryPrepareCartFromMessages(
      chatMessages(
        "add one chicken tikka masala to my cart",
        "Try Butter Chicken, Saag Paneer, Chana Masala, Garlic Naan, and Chicken Tikka Masala."
      )
    );

    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]?.name).toBe("Chicken Tikka Masala");
    expect(result?.items[0]?.quantity).toBe(1);
  });
});
