import { categories, menuItems, type FulfillmentType, type MenuItem } from "@/lib/menu";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { isMenuItemAvailableNow, restaurantConfig } from "@/lib/restaurant";

export type PriceCartItem = {
  id: string;
  quantity: number;
  modifiers?: Record<string, string>;
  notes?: string;
};

export type PriceRequest = {
  fulfillmentType: FulfillmentType;
  tipCents?: number;
  promoCode?: string;
  items: PriceCartItem[];
  now?: Date;
};

export type PricedLineItem = PriceCartItem & {
  name: string;
  unitPriceCents: number;
  lineTotalCents: number;
  toastItemGuid?: string;
  toastGroupGuid?: string;
};

export type PriceResult = {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  totalCents: number;
  normalizedItems: PricedLineItem[];
};

export type MenuCatalogItem = MenuItem & {
  toastItemGuid?: string | null;
  toastGroupGuid?: string | null;
};

export type MenuCatalog = {
  source: "database" | "seed";
  items: MenuCatalogItem[];
};

const LUNCH10 = "LUNCH10";

export async function loadMenuCatalog(): Promise<MenuCatalog> {
  if (!hasDatabaseUrl()) {
    return { source: "seed", items: menuItems };
  }

  try {
    const dbItems = await prisma.menuItem.findMany({
      where: { active: true },
      include: { modifiers: { orderBy: { sortOrder: "asc" } } }
    });

    return {
      source: "database",
      items: dbItems.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        image: item.image,
        tags: item.tags,
        spiceLevel: Math.max(0, Math.min(3, item.spiceLevel)) as 0 | 1 | 2 | 3,
        active: item.active,
        featured: item.featured,
        toastItemGuid: item.toastItemGuid,
        toastGroupGuid: item.toastGroupGuid,
        options: item.modifiers.map((modifier) => ({
          label: modifier.label,
          choices: modifier.choices
        }))
      }))
    };
  } catch (error) {
    console.warn("Falling back to seeded menu catalog for pricing.", error);
    return { source: "seed", items: menuItems };
  }
}

export function findCatalogItem(catalog: MenuCatalog, id: string) {
  return catalog.items.find((item) => item.id === id && item.active);
}

export function calculateCartPriceWithCatalog(request: PriceRequest, catalog: MenuCatalog): PriceResult {
  if (!["pickup", "delivery"].includes(request.fulfillmentType)) {
    throw new Error("Invalid fulfillment type.");
  }
  if (!request.items?.length) {
    throw new Error("Cart is empty.");
  }

  const normalizedItems: PricedLineItem[] = request.items.map((cartItem) => {
    const menuItem = findCatalogItem(catalog, cartItem.id);
    if (!menuItem || !isMenuItemAvailableNow(menuItem, request.now)) {
      throw new Error(`Menu item ${cartItem.id} is unavailable.`);
    }
    for (const option of menuItem.options || []) {
      const selected = cartItem.modifiers?.[option.label];
      if (selected && !option.choices.includes(selected)) {
        throw new Error(`Invalid ${option.label} selection for ${menuItem.name}.`);
      }
    }

    const quantity = Math.max(1, Math.min(20, Math.floor(cartItem.quantity || 1)));
    return {
      ...cartItem,
      quantity,
      name: menuItem.name,
      unitPriceCents: menuItem.priceCents,
      lineTotalCents: menuItem.priceCents * quantity,
      toastItemGuid: menuItem.toastItemGuid || undefined,
      toastGroupGuid: menuItem.toastGroupGuid || undefined
    };
  });

  const subtotalCents = normalizedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
  if (subtotalCents < restaurantConfig.minimumOrderCents) {
    throw new Error(`Minimum order is ${restaurantConfig.minimumOrderCents} cents.`);
  }
  const discountCents = request.promoCode?.trim().toUpperCase() === LUNCH10 ? Math.round(subtotalCents * 0.1) : 0;
  const taxableCents = Math.max(0, subtotalCents - discountCents);
  const taxCents = Math.round(taxableCents * restaurantConfig.taxRate);
  const deliveryFeeCents = request.fulfillmentType === "delivery" ? restaurantConfig.deliveryFeeCents : 0;
  const tipCents = Math.max(0, Math.min(20000, Math.floor(request.tipCents || 0)));
  const totalCents = taxableCents + taxCents + deliveryFeeCents + tipCents;

  return {
    subtotalCents,
    discountCents,
    taxCents,
    deliveryFeeCents,
    tipCents,
    totalCents,
    normalizedItems
  };
}

export async function calculateCartPrice(request: PriceRequest): Promise<PriceResult> {
  const catalog = await loadMenuCatalog();
  return calculateCartPriceWithCatalog(request, catalog);
}

/** @deprecated Use calculateCartPrice for server routes. Kept for unit tests with seed catalog. */
export function calculateCartPriceSync(request: PriceRequest): PriceResult {
  return calculateCartPriceWithCatalog(request, { source: "seed", items: menuItems });
}

export function getUnmappedToastItems(items: PricedLineItem[]) {
  return items.filter((item) => !item.toastItemGuid || !item.toastGroupGuid);
}
