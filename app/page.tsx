import Storefront from "@/components/Storefront";
import { getPublicMenu } from "@/lib/menu-repository";

export default async function HomePage() {
  const menu = await getPublicMenu();
  return <Storefront initialCategories={menu.categories} initialMenuItems={menu.menuItems} />;
}
