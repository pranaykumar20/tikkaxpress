"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { updateMenuItem, updateOrderStatus, type OrderStatus } from "@/lib/orders";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "new") as OrderStatus;
  await updateOrderStatus(orderId, status);
  revalidatePath("/admin");
}

export async function updateMenuItemAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("itemId") || "");
  const price = Number(formData.get("priceCents") || 0);
  const spiceLevel = Number(formData.get("spiceLevel") || 0);
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  await updateMenuItem(id, {
    active: formData.get("active") === "on",
    featured: formData.get("featured") === "on",
    priceCents: Math.max(0, Math.floor(price)),
    description: String(formData.get("description") || ""),
    tags,
    spiceLevel: Math.max(0, Math.min(3, Math.floor(spiceLevel)))
  });
  revalidatePath("/admin");
  revalidatePath("/");
}
