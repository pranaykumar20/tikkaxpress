import { describe, expect, it } from "vitest";
import { mergeCartLines, upsertCartLines } from "@/lib/cart-storage";

describe("cart storage", () => {
  it("upserts chat items to a fixed quantity instead of stacking duplicates", () => {
    const existing = [
      { id: "butter-chicken", quantity: 1 },
      { id: "chicken-tikka-masala", quantity: 16 }
    ];

    const next = upsertCartLines(existing, [{ id: "chicken-tikka-masala", quantity: 1 }]);

    expect(next).toEqual([
      { id: "butter-chicken", quantity: 1 },
      { id: "chicken-tikka-masala", quantity: 1 }
    ]);
  });

  it("still merges when another item is explicitly requested", () => {
    const next = mergeCartLines([{ id: "chicken-tikka-masala", quantity: 1 }], [{ id: "chicken-tikka-masala", quantity: 1 }]);
    expect(next).toEqual([{ id: "chicken-tikka-masala", quantity: 2 }]);
  });
});
