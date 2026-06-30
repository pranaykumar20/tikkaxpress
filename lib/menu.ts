import seedData from "@/prisma/menu-seed.json";

export type FulfillmentType = "pickup" | "delivery";

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceCents: number;
  image: string;
  tags: string[];
  spiceLevel: 0 | 1 | 2 | 3;
  active: boolean;
  featured?: boolean;
  options?: {
    label: string;
    choices: string[];
  }[];
};

type MenuSeed = {
  categories: MenuCategory[];
  menuItems: MenuItem[];
};

const typedSeed = seedData as MenuSeed;

export const categories = typedSeed.categories;
export const menuItems = typedSeed.menuItems;

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function findMenuItem(id: string) {
  return menuItems.find((item) => item.id === id && item.active);
}
