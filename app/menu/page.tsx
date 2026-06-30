import Storefront from "@/components/Storefront";
import { getPublicMenu } from "@/lib/menu-repository";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu | TikkaXpress",
  description: "Browse curries, biryani, naan, lunch combos, and more. Order pickup or delivery from TikkaXpress Northside.",
  alternates: {
    canonical: "/menu"
  }
};

export default async function MenuPage() {
  const menu = await getPublicMenu();
  return <Storefront initialCategories={menu.categories} initialMenuItems={menu.menuItems} />;
}
