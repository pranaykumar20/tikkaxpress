import type { UIMessage } from "ai";

const ADD_TO_CART_PATTERN =
  /\b(add|put|place|order|include)\b[\s\S]{0,80}\b(cart|order|bag|basket|checkout)\b|\badd\b[\s\S]{0,40}\bto\s+(my\s+)?(cart|order)\b/i;

export function isAddToCartRequest(text: string) {
  return ADD_TO_CART_PATTERN.test(text);
}

export function shouldIncrementCartQuantity(text: string) {
  return /\b(another|more|extra|additional|second)\b/i.test(text);
}

export function getLastUserMessage(messages: UIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "user") continue;

    const text = message.parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();

    return { id: message.id, text };
  }

  return null;
}

export function cartApplyStorageKey(userMessageId: string) {
  return `tx-applied-cart:${userMessageId}`;
}
