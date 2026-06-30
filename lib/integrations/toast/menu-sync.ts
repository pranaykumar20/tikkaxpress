import { getToastConfig, isToastApiConfigured } from "@/lib/integrations/toast/config";
import { toastRequest } from "@/lib/integrations/toast/client";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

type ToastMenuGroup = {
  guid: string;
  name: string;
  visibility?: string[];
};

type ToastMenuItem = {
  guid: string;
  name: string;
  description?: string;
  price?: number;
  image?: { url?: string };
  menuGroups?: { guid: string; name?: string }[];
  modifierGroups?: { guid: string; name?: string; required?: boolean; modifiers?: { guid: string; name: string }[] }[];
};

type ToastMenusResponse = {
  menus?: {
    menuGroups?: ToastMenuGroup[];
    menuItems?: ToastMenuItem[];
  }[];
};

export type MenuSyncResult = {
  synced: boolean;
  mode: "live" | "demo";
  categoriesUpserted: number;
  itemsUpserted: number;
  itemsDeactivated: number;
  unmappedRemaining: number;
  syncedAt: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function toCents(price?: number) {
  if (typeof price !== "number" || Number.isNaN(price)) return 0;
  return Math.round(price * 100);
}

async function setIntegrationMeta(key: string, value: string) {
  await prisma.integrationMeta.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
}

export async function getLastMenuSyncAt() {
  if (!hasDatabaseUrl()) return null;
  const meta = await prisma.integrationMeta.findUnique({ where: { key: "toast.menu.lastSyncAt" } });
  return meta?.value || null;
}

export async function syncMenuFromToast(): Promise<MenuSyncResult> {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for menu sync.");
  }

  const syncedAt = new Date().toISOString();

  if (!isToastApiConfigured()) {
    await setIntegrationMeta("toast.menu.lastSyncAt", syncedAt);
    const unmapped = await prisma.menuItem.count({ where: { toastItemGuid: null } });
    return {
      synced: false,
      mode: "demo",
      categoriesUpserted: 0,
      itemsUpserted: 0,
      itemsDeactivated: 0,
      unmappedRemaining: unmapped,
      syncedAt
    };
  }

  const payload = await toastRequest<ToastMenusResponse>("/menus/v2/menus", { method: "GET" });
  const menuGroups = payload.menus?.flatMap((menu) => menu.menuGroups || []) || [];
  const menuItems = payload.menus?.flatMap((menu) => menu.menuItems || []) || [];
  const visibleGroups = menuGroups.filter((group) => !group.visibility || group.visibility.includes("ORDERING_PARTNERS") || group.visibility.includes("POS"));
  const visibleItems = menuItems.filter((item) => item.menuGroups?.length);

  let categoriesUpserted = 0;
  let itemsUpserted = 0;

  for (const [index, group] of visibleGroups.entries()) {
    const slug = slugify(group.name) || `category-${index + 1}`;
    await prisma.menuCategory.upsert({
      where: { slug },
      update: {
        name: group.name,
        toastGroupGuid: group.guid,
        active: true,
        sortOrder: index
      },
      create: {
        id: slug,
        name: group.name,
        slug,
        toastGroupGuid: group.guid,
        active: true,
        sortOrder: index
      }
    });
    categoriesUpserted += 1;
  }

  const toastItemGuids = new Set<string>();

  for (const item of visibleItems) {
    const group = item.menuGroups?.[0];
    if (!group) continue;

    const categorySlug = slugify(group.name || group.guid) || "menu";
    const category = await prisma.menuCategory.findUnique({ where: { slug: categorySlug } });
    if (!category) continue;

    const localId = slugify(item.name || item.guid) || item.guid;
    toastItemGuids.add(item.guid);

    await prisma.menuItem.upsert({
      where: { toastItemGuid: item.guid },
      update: {
        categoryId: category.id,
        name: item.name,
        description: item.description || "",
        priceCents: toCents(item.price),
        image: item.image?.url || `/images/menu/items/${localId}.png`,
        toastGroupGuid: group.guid,
        active: true,
        lastSyncedAt: new Date()
      },
      create: {
        id: localId,
        categoryId: category.id,
        name: item.name,
        description: item.description || "",
        priceCents: toCents(item.price),
        image: item.image?.url || `/images/menu/items/${localId}.png`,
        toastItemGuid: item.guid,
        toastGroupGuid: group.guid,
        tags: [],
        spiceLevel: 0,
        active: true,
        lastSyncedAt: new Date()
      }
    });

    const dbItem = await prisma.menuItem.findUnique({ where: { toastItemGuid: item.guid } });
    if (dbItem && item.modifierGroups?.length) {
      await prisma.modifierGroup.deleteMany({ where: { menuItemId: dbItem.id } });
      for (const [modifierIndex, modifierGroup] of item.modifierGroups.entries()) {
        await prisma.modifierGroup.create({
          data: {
            menuItemId: dbItem.id,
            label: modifierGroup.name || "Option",
            choices: (modifierGroup.modifiers || []).map((modifier) => modifier.name),
            required: Boolean(modifierGroup.required),
            sortOrder: modifierIndex,
            toastModifierGroupGuid: modifierGroup.guid
          }
        });
      }
    }

    itemsUpserted += 1;
  }

  const deactivated = await prisma.menuItem.updateMany({
    where: {
      toastItemGuid: { not: null, notIn: [...toastItemGuids] }
    },
    data: { active: false }
  });

  await setIntegrationMeta("toast.menu.lastSyncAt", syncedAt);

  const unmappedRemaining = await prisma.menuItem.count({
    where: { active: true, toastItemGuid: null }
  });

  return {
    synced: true,
    mode: "live",
    categoriesUpserted,
    itemsUpserted,
    itemsDeactivated: deactivated.count,
    unmappedRemaining,
    syncedAt
  };
}

export async function getToastIntegrationStatus() {
  const lastMenuSyncAt = await getLastMenuSyncAt();
  const unmappedItems = hasDatabaseUrl()
    ? await prisma.menuItem.count({ where: { active: true, toastItemGuid: null } })
    : 0;
  const failedOrders = hasDatabaseUrl()
    ? await prisma.order.count({
        where: {
          paymentStatus: "paid",
          toastOrderGuid: null,
          integrationError: { not: null }
        }
      })
    : 0;
  const pendingToastPush = hasDatabaseUrl()
    ? await prisma.order.count({
        where: {
          paymentStatus: "paid",
          toastOrderGuid: null,
          integrationError: null
        }
      })
    : 0;

  return {
    apiConfigured: isToastApiConfigured(),
    paymentsConfigured: Boolean(getToastConfig().merchantUuid),
    lastMenuSyncAt,
    unmappedItems,
    failedOrders,
    pendingToastPush
  };
}
