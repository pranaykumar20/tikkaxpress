import { getPublicMenu } from "@/lib/menu-repository";
import type { MenuItem } from "@/lib/menu";
import { isMenuItemAvailableNow } from "@/lib/restaurant";

export type MenuSearchParams = {
  query?: string;
  tags?: string[];
  maxSpiceLevel?: number;
  categoryId?: string;
  maxPriceCents?: number;
  availableOnly?: boolean;
  limit?: number;
};

function spiceLabel(level: number) {
  if (level === 0) return "Mild";
  if (level === 1) return "Warm";
  if (level === 2) return "Spicy";
  return "Fire";
}

export function serializeMenuItem(item: MenuItem, now = new Date()) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    price: `$${(item.priceCents / 100).toFixed(2)}`,
    categoryId: item.categoryId,
    tags: item.tags,
    spiceLevel: item.spiceLevel,
    spiceLabel: spiceLabel(item.spiceLevel),
    image: item.image,
    options: item.options || [],
    availableNow: isMenuItemAvailableNow(item, now),
    featured: Boolean(item.featured)
  };
}

export async function searchMenu(params: MenuSearchParams, now = new Date()) {
  const { categories, menuItems } = await getPublicMenu();
  const limit = Math.max(1, Math.min(20, params.limit ?? 8));
  const query = params.query?.trim().toLowerCase() || "";
  const tags = (params.tags || []).map((tag) => tag.toLowerCase());

  let results = menuItems.filter((item) => item.active);

  if (params.categoryId) {
    results = results.filter((item) => item.categoryId === params.categoryId);
  }

  if (typeof params.maxSpiceLevel === "number") {
    results = results.filter((item) => item.spiceLevel <= params.maxSpiceLevel!);
  }

  if (typeof params.maxPriceCents === "number") {
    results = results.filter((item) => item.priceCents <= params.maxPriceCents!);
  }

  if (params.availableOnly !== false) {
    results = results.filter((item) => isMenuItemAvailableNow(item, now));
  }

  if (tags.length) {
    results = results.filter((item) => {
      const itemTags = item.tags.map((tag) => tag.toLowerCase());
      const haystack = `${item.name} ${item.description} ${itemTags.join(" ")}`.toLowerCase();
      return tags.every((tag) => itemTags.includes(tag) || haystack.includes(tag));
    });
  }

  if (query) {
    results = results.filter((item) => {
      const haystack = `${item.name} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  results = results.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug
    })),
    count: results.length,
    items: results.slice(0, limit).map((item) => serializeMenuItem(item, now))
  };
}
