import type { UIMessage } from "ai";
import { buildCartHandoff } from "@/lib/ai/cart-handoff";
import type { CartHandoffPayload } from "@/lib/ai/tools";
import { getPublicMenu } from "@/lib/menu-repository";
import { isMenuItemAvailableNow } from "@/lib/restaurant";

const ADD_TO_CART_PATTERN =
  /\b(add|put|place|order|include)\b[\s\S]{0,80}\b(cart|order|bag|basket|checkout)\b|\badd\b[\s\S]{0,40}\bto\s+(my\s+)?(cart|order)\b/i;

const WORD_QUANTITIES: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5
};

function getConversationText(messages: UIMessage[]) {
  return messages
    .flatMap((message) =>
      message.parts
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
    )
    .join("\n");
}

function getLastUserText(messages: UIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "user") continue;

    return message.parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();
  }

  return "";
}

export function isAddToCartRequest(text: string) {
  return ADD_TO_CART_PATTERN.test(text);
}

function parseQuantityBefore(text: string, itemName: string) {
  const lower = text.toLowerCase();
  const nameLower = itemName.toLowerCase();
  const index = lower.indexOf(nameLower);
  if (index < 0) return 1;

  const prefix = text.slice(Math.max(0, index - 24), index);
  const numeric = prefix.match(/\b(\d{1,2})\s*x?\s*$/i);
  if (numeric) return Math.max(1, Math.min(20, Number(numeric[1])));

  const word = prefix.match(/\b(one|two|three|four|five)\s*$/i);
  if (word) return WORD_QUANTITIES[word[1].toLowerCase()] || 1;

  return 1;
}

function inferFulfillmentType(text: string): "pickup" | "delivery" {
  return /\bdelivery\b/i.test(text) ? "delivery" : "pickup";
}

function inferLocationId(text: string): "northside" | "factory-52" {
  if (/factory[\s-]?52/i.test(text)) return "factory-52";
  if (/northside/i.test(text)) return "northside";
  return "northside";
}

async function resolveMenuItemsFromText(text: string, now = new Date()) {
  const { menuItems } = await getPublicMenu();
  const lower = text.toLowerCase();
  const matches: { id: string; quantity: number }[] = [];

  const sortedItems = [...menuItems]
    .filter((item) => item.active)
    .sort((a, b) => b.name.length - a.name.length);

  for (const item of sortedItems) {
    const nameLower = item.name.toLowerCase();
    if (!lower.includes(nameLower)) continue;
    if (!isMenuItemAvailableNow(item, now)) continue;
    if (matches.some((entry) => entry.id === item.id)) continue;

    matches.push({
      id: item.id,
      quantity: parseQuantityBefore(text, item.name)
    });
  }

  return matches;
}

export async function tryPrepareCartFromMessages(
  messages: UIMessage[],
  now = new Date()
): Promise<CartHandoffPayload | null> {
  const lastUserText = getLastUserText(messages);
  if (!lastUserText || !isAddToCartRequest(lastUserText)) return null;

  const conversationText = getConversationText(messages);
  let items = await resolveMenuItemsFromText(lastUserText, now);

  if (!items.length) {
    items = await resolveMenuItemsFromText(conversationText, now);
  }

  if (!items.length) return null;

  try {
    return buildCartHandoff(
      {
        locationId: inferLocationId(`${lastUserText}\n${conversationText}`),
        fulfillmentType: inferFulfillmentType(`${lastUserText}\n${conversationText}`),
        items
      },
      now
    );
  } catch {
    return null;
  }
}
