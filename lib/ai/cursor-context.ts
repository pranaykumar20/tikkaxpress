import type { UIMessage } from "ai";
import { searchMenu, type MenuSearchParams } from "@/lib/ai/menu-search";
import { getPublicMenu } from "@/lib/menu-repository";
import {
  isMenuItemAvailableNow,
  isRestaurantOpen,
  restaurantConfig,
  restaurantLocations
} from "@/lib/restaurant";

function spiceLabel(level: number) {
  if (level === 0) return "Mild";
  if (level === 1) return "Warm";
  if (level === 2) return "Spicy";
  return "Fire";
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

export function inferMenuSearchParams(text: string): MenuSearchParams {
  const lower = text.toLowerCase();
  const params: MenuSearchParams = { limit: 12, availableOnly: true };
  const tags: string[] = [];

  if (/\b(vegetarian|veggie|vegan|plant[- ]based)\b/.test(lower)) tags.push("Vegetarian");
  if (/\bgluten[- ]?free\b/.test(lower)) tags.push("Gluten Free");
  if (/\bchicken\b/.test(lower)) tags.push("Chicken");
  if (/\b(lamb|goat)\b/.test(lower)) tags.push("Lamb");
  if (/\bpopular\b/.test(lower)) tags.push("Popular");

  if (/\b(kid|kids|child|children|mild|not spicy|low spice)\b/.test(lower)) {
    params.maxSpiceLevel = 0;
  } else if (/\b(spicy|hot|extra spice|fire)\b/.test(lower)) {
    params.maxSpiceLevel = 3;
  }

  if (/\blunch\b/.test(lower)) params.categoryId = "lunch-special";

  const budget = lower.match(/under\s*\$?\s*(\d+)/);
  if (budget) params.maxPriceCents = Number(budget[1]) * 100;

  if (tags.length) params.tags = tags;

  const cleaned = text.trim();
  if (cleaned.length > 2) params.query = cleaned;

  return params;
}

async function buildFullMenuCatalog(now = new Date()) {
  const { categories, menuItems } = await getPublicMenu();
  const categoryNames = Object.fromEntries(categories.map((category) => [category.id, category.name]));

  return menuItems
    .filter((item) => item.active)
    .map((item) => {
      const availability = isMenuItemAvailableNow(item, now) ? "available now" : "unavailable now";
      const category = categoryNames[item.categoryId] || item.categoryId;
      const price = `$${(item.priceCents / 100).toFixed(2)}`;

      return [
        `- ${item.id}: ${item.name} | ${price} | ${spiceLabel(item.spiceLevel)} | ${category}`,
        `  tags: ${item.tags.join(", ") || "none"} | ${availability}`,
        `  ${item.description}`
      ].join("\n");
    })
    .join("\n");
}

export async function buildCursorServerContext(messages: UIMessage[], now = new Date()) {
  const userText = getLastUserText(messages);
  const searchParams = inferMenuSearchParams(userText);
  const [searchResults, catalog] = await Promise.all([
    searchMenu(searchParams, now),
    buildFullMenuCatalog(now)
  ]);

  const restaurantInfo = {
    isOpen: isRestaurantOpen(now),
    hours: `${restaurantConfig.openHour}:00–${restaurantConfig.closeHour}:00`,
    timeZone: restaurantConfig.timeZone,
    prepMinutes: restaurantConfig.prepMinutes,
    deliveryFee: `$${(restaurantConfig.deliveryFeeCents / 100).toFixed(2)}`,
    taxRate: `${(restaurantConfig.taxRate * 100).toFixed(1)}%`,
    minimumOrder: `$${(restaurantConfig.minimumOrderCents / 100).toFixed(2)}`,
    promoCodes: ["LUNCH10 (10% off)"],
    locations: restaurantLocations.map((location) => ({
      id: location.id,
      name: location.shortName,
      phone: location.phone,
      address: location.address
    }))
  };

  return `

## Live server menu data (authoritative)

You already have TikkaXpress menu data for this turn. Recommend specific dishes with exact names and prices from the data below.
Never say menu tools are unavailable, that you cannot access the live menu, or that you need to look online.
If the customer asks about vegetarian, mild, kids, budget, or lunch options, prioritize the matching items section first.

### Restaurant status
${JSON.stringify(restaurantInfo, null, 2)}

### Best matches for the customer's latest message
${userText ? `Customer message: "${userText}"` : "No user message yet."}
Search params: ${JSON.stringify(searchParams)}
${JSON.stringify(searchResults.items, null, 2)}

### Full menu catalog
${catalog}`;
}
