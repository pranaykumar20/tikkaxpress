import { restaurantConfig } from "@/lib/restaurant";
import type { StoredOrder } from "@/lib/orders";

export async function sendOrderConfirmationEmail(order: StoredOrder) {
  const provider = process.env.EMAIL_PROVIDER;
  if (!provider) {
    console.info("Email confirmation queued in demo mode", {
      to: order.customer.email,
      orderId: order.id,
      totalCents: order.totalCents
    });
    return { sent: false, provider: "demo" };
  }

  console.info("Email provider configured, implement provider adapter.", {
    provider,
    to: order.customer.email,
    restaurant: restaurantConfig.name
  });
  return { sent: false, provider };
}
