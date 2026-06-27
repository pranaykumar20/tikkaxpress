import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const seedPath = path.join(process.cwd(), "prisma", "menu-seed.json");
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

for (const location of seed.locations || []) {
  await prisma.restaurantLocation.upsert({
    where: { id: location.id },
    update: {
      name: location.name,
      shortName: location.shortName,
      slug: location.slug,
      address: location.address,
      city: location.city,
      region: location.region,
      postalCode: location.postalCode,
      phone: location.phone,
      mapsEmbedUrl: location.mapsEmbedUrl,
      active: location.active,
      sortOrder: location.sortOrder
    },
    create: location
  });
}

for (const category of seed.categories) {
  await prisma.menuCategory.upsert({
    where: { id: category.id },
    update: {
      name: category.name,
      slug: category.slug,
      sortOrder: category.sortOrder,
      active: category.active
    },
    create: category
  });
}

for (const item of seed.menuItems) {
  await prisma.menuItem.upsert({
    where: { id: item.id },
    update: {
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      priceCents: item.priceCents,
      image: item.image,
      tags: item.tags,
      spiceLevel: item.spiceLevel,
      active: item.active,
      featured: Boolean(item.featured)
    },
    create: {
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      priceCents: item.priceCents,
      image: item.image,
      tags: item.tags,
      spiceLevel: item.spiceLevel,
      active: item.active,
      featured: Boolean(item.featured)
    }
  });

  await prisma.modifierGroup.deleteMany({ where: { menuItemId: item.id } });
  for (const [index, option] of (item.options || []).entries()) {
    await prisma.modifierGroup.create({
      data: {
        id: `${item.id}-${index}`,
        menuItemId: item.id,
        label: option.label,
        choices: option.choices,
        required: true,
        sortOrder: index
      }
    });
  }
}

await prisma.$disconnect();

console.log(`Seeded ${(seed.locations || []).length} locations, ${seed.categories.length} categories, and ${seed.menuItems.length} menu items.`);
