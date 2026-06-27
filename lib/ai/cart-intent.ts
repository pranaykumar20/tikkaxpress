import type { UIMessage } from "ai";
import { buildCartHandoff } from "@/lib/ai/cart-handoff";
import type { CartHandoffPayload } from "@/lib/ai/tools";
import { getPublicMenu } from "@/lib/menu-repository";
import type { MenuItem } from "@/lib/menu";
import { isMenuItemAvailableNow } from "@/lib/restaurant";

const ADD_TO_CART_PATTERN =
  /\b(add|put|place|order|include)\b[\s\S]{0,80}\b(cart|order|bag|basket|checkout)\b|\badd\b[\s\S]{0,40}\bto\s+(my\s+)?(cart|order)\b/i;

const PRONOUN_PATTERN = /\b(it|this|that|those|them)\b/i;

const WORD_QUANTITIES: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6
};

const MATCH_STOP_WORDS = new Set([
  "add",
  "put",
  "place",
  "order",
  "include",
  "the",
  "my",
  "a",
  "an",
  "to",
  "in",
  "for",
  "cart",
  "order",
  "bag",
  "basket",
  "checkout",
  "please"
]);

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function getLastUserText(messages: UIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "user") continue;
    return getMessageText(message);
  }

  return "";
}

function getLastAssistantText(messages: UIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "assistant") continue;
    return getMessageText(message);
  }

  return "";
}

export function isAddToCartRequest(text: string) {
  return ADD_TO_CART_PATTERN.test(text);
}

export function extractAddToCartPhrase(userText: string) {
  const patterns = [
    /\badd\s+(.+?)\s+to\s+(?:my\s+)?(?:cart|order|bag|basket|checkout)\b/i,
    /\bput\s+(.+?)\s+in\s+(?:my\s+)?(?:cart|order|bag|basket)\b/i,
    /\bplace\s+(.+?)\s+in\s+(?:my\s+)?(?:cart|order)\b/i,
    /\border\s+(.+?)\s+for\s+(?:pickup|delivery)\b/i
  ];

  for (const pattern of patterns) {
    const match = userText.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return userText.trim();
}

export function parseLeadingQuantity(phrase: string) {
  const match = phrase.match(/^(\d{1,2}|one|two|three|four|five|six)\s*x?\s+(.+)$/i);
  if (!match) {
    return { quantity: 1, itemPhrase: phrase.trim() };
  }

  const rawQuantity = match[1].toLowerCase();
  const quantity = WORD_QUANTITIES[rawQuantity] ?? Number(rawQuantity);
  return {
    quantity: Math.max(1, Math.min(20, quantity || 1)),
    itemPhrase: match[2].trim()
  };
}

export function splitExplicitItemPhrases(phrase: string) {
  if (!/\s(?:,|and)\s/i.test(phrase)) {
    return [phrase.trim()];
  }

  return phrase
    .split(/\s*,\s*|\s+and\s+/i)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string) {
  const rows = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 0; i < a.length; i += 1) {
    let previous = rows[0];
    rows[0] = i + 1;

    for (let j = 0; j < b.length; j += 1) {
      const temp = rows[j + 1];
      rows[j + 1] =
        a[i] === b[j] ? previous : Math.min(previous + 1, rows[j] + 1, rows[j + 1] + 1);
      previous = temp;
    }
  }

  return rows[b.length];
}

function wordsMatch(targetWord: string, nameWord: string) {
  if (!targetWord || !nameWord) return false;
  if (targetWord === nameWord) return true;
  if (targetWord.includes(nameWord) || nameWord.includes(targetWord)) return true;
  if (nameWord.length >= 4 && levenshtein(targetWord, nameWord) <= 1) return true;
  return false;
}

export function scoreItemMatch(targetText: string, itemName: string) {
  const target = normalizeText(targetText);
  const name = normalizeText(itemName);
  if (!target || !name) return 0;
  if (target.includes(name)) return 1000 + name.length;

  const nameWords = name.split(" ").filter((word) => word.length > 1);
  if (!nameWords.length) return 0;

  const targetWords = target.split(" ").filter(Boolean);
  let matched = 0;

  for (const nameWord of nameWords) {
    if (targetWords.some((targetWord) => wordsMatch(targetWord, nameWord))) {
      matched += 1;
      continue;
    }

    if (target.includes(nameWord)) {
      matched += 1;
    }
  }

  if (matched < nameWords.length) return 0;
  return 500 + matched * 10 + name.length;
}

function hasSpecificItemPhrase(phrase: string) {
  const words = normalizeText(phrase)
    .split(" ")
    .filter((word) => word.length > 2 && !MATCH_STOP_WORDS.has(word));

  return words.length >= 2 || (words.length === 1 && words[0].length >= 5);
}

function pickBestMenuItem(targetText: string, menuItems: MenuItem[], now = new Date()) {
  let best: { item: MenuItem; score: number } | null = null;

  for (const item of menuItems) {
    if (!item.active || !isMenuItemAvailableNow(item, now)) continue;

    const score = scoreItemMatch(targetText, item.name);
    if (!best || score > best.score) {
      best = { item, score };
    }
  }

  if (!best || best.score < 500) return null;
  return best.item;
}

async function resolveMenuItemsFromPhrase(phrase: string, now = new Date()) {
  const segments = splitExplicitItemPhrases(phrase);
  const items: { id: string; quantity: number }[] = [];
  const { menuItems } = await getPublicMenu();

  for (const segment of segments) {
    const { quantity, itemPhrase } = parseLeadingQuantity(segment);
    const item = pickBestMenuItem(itemPhrase, menuItems, now);
    if (!item || items.some((entry) => entry.id === item.id)) continue;

    items.push({ id: item.id, quantity });
  }

  return items;
}

async function resolveMenuItemFromPronoun(messages: UIMessage[], now = new Date()) {
  const assistantText = getLastAssistantText(messages);
  if (!assistantText) return [];

  const { menuItems } = await getPublicMenu();
  const item = pickBestMenuItem(assistantText, menuItems, now);
  if (!item) return [];

  return [{ id: item.id, quantity: 1 }];
}

function inferFulfillmentType(text: string): "pickup" | "delivery" {
  return /\bdelivery\b/i.test(text) ? "delivery" : "pickup";
}

function inferLocationId(text: string): "northside" | "factory-52" {
  if (/factory[\s-]?52/i.test(text)) return "factory-52";
  if (/northside/i.test(text)) return "northside";
  return "northside";
}

export async function tryPrepareCartFromMessages(
  messages: UIMessage[],
  now = new Date()
): Promise<CartHandoffPayload | null> {
  const lastUserText = getLastUserText(messages);
  if (!lastUserText || !isAddToCartRequest(lastUserText)) return null;

  const extractedPhrase = extractAddToCartPhrase(lastUserText);
  let items: { id: string; quantity: number }[] = [];

  if (PRONOUN_PATTERN.test(extractedPhrase) && !hasSpecificItemPhrase(extractedPhrase)) {
    items = await resolveMenuItemFromPronoun(messages, now);
  } else {
    items = await resolveMenuItemsFromPhrase(extractedPhrase, now);
  }

  if (!items.length) return null;

  try {
    return buildCartHandoff(
      {
        locationId: inferLocationId(lastUserText),
        fulfillmentType: inferFulfillmentType(lastUserText),
        items
      },
      now
    );
  } catch {
    return null;
  }
}
