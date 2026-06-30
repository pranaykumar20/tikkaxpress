import { categories, menuItems, type MenuCategory, type MenuItem } from "@/lib/menu";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export type PublicMenu = {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  source: "database" | "seed";
};

function seedMenu(): PublicMenu {
  return { categories, menuItems, source: "seed" };
}

export async function getPublicMenu(): Promise<PublicMenu> {
  if (!hasDatabaseUrl()) {
    return seedMenu();
  }

  try {
    const [dbCategories, dbItems] = (await Promise.all([
      prisma.menuCategory.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" }
      }),
      prisma.menuItem.findMany({
        where: { active: true },
        include: { modifiers: { orderBy: { sortOrder: "asc" } } },
        orderBy: [{ categoryId: "asc" }, { name: "asc" }]
      })
    ])) as [
      {
        id: string;
        name: string;
        slug: string;
        sortOrder: number;
        active: boolean;
      }[],
      {
        id: string;
        categoryId: string;
        name: string;
        description: string;
        priceCents: number;
        image: string;
        tags: string[];
        spiceLevel: number;
        active: boolean;
        featured: boolean;
        modifiers: { label: string; choices: string[] }[];
      }[]
    ];

    if (dbCategories.length === 0 || dbItems.length === 0) {
      console.warn("Database menu is empty. Falling back to seeded menu data.");
      return seedMenu();
    }

    return {
      categories: dbCategories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        active: category.active
      })),
      menuItems: dbItems.map((item) => ({
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
        options: item.modifiers.map((modifier) => ({
          label: modifier.label,
          choices: modifier.choices
        }))
      })),
      source: "database"
    };
  } catch (error) {
    console.warn("Falling back to seeded menu data.", error);
    return seedMenu();
  }
}
