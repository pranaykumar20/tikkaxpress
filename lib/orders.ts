import type Stripe from "stripe";
import { formatMoney, menuItems, type FulfillmentType, type MenuItem } from "@/lib/menu";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import type { PriceResult } from "@/lib/pricing";
import { findRestaurantLocation, type RestaurantLocation } from "@/lib/restaurant";

export type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
  address?: string;
  scheduledTime?: string;
  notes?: string;
};

export type OrderStatus = "new" | "accepted" | "preparing" | "ready" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type StoredOrder = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentType: FulfillmentType;
  location: Pick<RestaurantLocation, "id" | "name" | "shortName" | "address" | "phone">;
  customer: CustomerDetails;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  totalCents: number;
  payment?: {
    stripeSessionId?: string | null;
    stripePaymentIntentId?: string | null;
    amountCents: number;
    status: PaymentStatus;
  } | null;
  items: {
    id: string;
    menuItemId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    modifiers?: Record<string, string> | null;
    notes?: string | null;
  }[];
};

type OrderSource = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  paymentStatus: string;
  fulfillmentType: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  locationPhone: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string | null;
  scheduledTime: string | null;
  notes: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  totalCents: number;
  items?: {
    id: string;
    menuItemId: string;
    name: string;
    unitPriceCents: number;
    quantity: number;
    modifiers: unknown;
    notes: string | null;
    lineTotalCents: number;
  }[];
  payment?: {
    stripeSessionId: string | null;
    stripePaymentIntentId: string | null;
    amountCents: number;
    status: string;
  } | null;
};

export type AdminDashboard = {
  orders: StoredOrder[];
  revenueCents: number;
  averageTicketCents: number;
  openOrders: number;
  topItem: string;
  menuItems: MenuItem[];
};

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for production order storage.");
  }
}

function normalizeOrder(orderWithChildren: OrderSource): StoredOrder {
  return {
    id: orderWithChildren.id,
    createdAt: orderWithChildren.createdAt.toISOString(),
    updatedAt: orderWithChildren.updatedAt.toISOString(),
    status: orderWithChildren.status as OrderStatus,
    paymentStatus: orderWithChildren.paymentStatus as PaymentStatus,
    fulfillmentType: orderWithChildren.fulfillmentType as FulfillmentType,
    location: {
      id: orderWithChildren.locationId,
      name: orderWithChildren.locationName,
      shortName: orderWithChildren.locationName.replace("TikkaXpress ", ""),
      address: orderWithChildren.locationAddress,
      phone: orderWithChildren.locationPhone
    },
    customer: {
      name: orderWithChildren.customerName,
      email: orderWithChildren.customerEmail,
      phone: orderWithChildren.customerPhone,
      address: orderWithChildren.deliveryAddress || undefined,
      scheduledTime: orderWithChildren.scheduledTime || undefined,
      notes: orderWithChildren.notes || undefined
    },
    subtotalCents: orderWithChildren.subtotalCents,
    discountCents: orderWithChildren.discountCents,
    taxCents: orderWithChildren.taxCents,
    deliveryFeeCents: orderWithChildren.deliveryFeeCents,
    tipCents: orderWithChildren.tipCents,
    totalCents: orderWithChildren.totalCents,
    payment: orderWithChildren.payment
      ? {
          ...orderWithChildren.payment,
          status: orderWithChildren.payment.status as PaymentStatus
        }
      : null,
    items: (orderWithChildren.items || []).map((item) => ({
      ...item,
      modifiers: (item.modifiers || null) as Record<string, string> | null
    }))
  };
}

export async function createPendingOrder({
  fulfillmentType,
  locationId,
  customer,
  pricing
}: {
  fulfillmentType: FulfillmentType;
  locationId?: string;
  customer: CustomerDetails;
  pricing: PriceResult;
}) {
  requireDatabase();
  const location = findRestaurantLocation(locationId);

  const customerRecord = await prisma.customer.upsert({
    where: { email: customer.email.toLowerCase() },
    update: {
      name: customer.name,
      phone: customer.phone
    },
    create: {
      email: customer.email.toLowerCase(),
      name: customer.name,
      phone: customer.phone
    }
  });

  const order = await prisma.order.create({
    data: {
      customerId: customerRecord.id,
      locationId: location.id,
      locationName: location.name,
      locationAddress: location.address,
      locationPhone: location.phone,
      customerName: customer.name,
      customerEmail: customer.email.toLowerCase(),
      customerPhone: customer.phone,
      fulfillmentType,
      deliveryAddress: customer.address || null,
      scheduledTime: customer.scheduledTime || null,
      notes: customer.notes || null,
      subtotalCents: pricing.subtotalCents,
      discountCents: pricing.discountCents,
      taxCents: pricing.taxCents,
      deliveryFeeCents: pricing.deliveryFeeCents,
      tipCents: pricing.tipCents,
      totalCents: pricing.totalCents,
      paymentStatus: "pending",
      status: "new",
      items: {
        create: pricing.normalizedItems.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          unitPriceCents: item.unitPriceCents,
          quantity: item.quantity,
          modifiers: item.modifiers || undefined,
          notes: item.notes || null,
          lineTotalCents: item.lineTotalCents
        }))
      },
      payment: {
        create: {
          amountCents: pricing.totalCents,
          status: "pending"
        }
      }
    },
    include: { items: true, payment: true }
  });

  return normalizeOrder(order);
}

export async function attachStripeSession(orderId: string, stripeSessionId: string) {
  requireDatabase();
  await prisma.payment.update({
    where: { orderId },
    data: { stripeSessionId }
  });
}

export async function markOrderPaidFromCheckoutSession(session: Stripe.Checkout.Session) {
  requireDatabase();
  const orderId = session.metadata?.orderId || session.client_reference_id || undefined;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  if (orderId) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "paid",
        payment: {
          update: {
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            amountCents: session.amount_total || undefined,
            status: "paid"
          }
        }
      },
      include: { items: true, payment: true }
    });
    return normalizeOrder(order);
  }

  const payment = await prisma.payment.findUnique({ where: { stripeSessionId: session.id } });
  if (!payment) throw new Error(`No order found for Stripe session ${session.id}.`);
  const order = await prisma.order.update({
    where: { id: payment.orderId },
    data: {
      paymentStatus: "paid",
      payment: {
        update: {
          stripePaymentIntentId: paymentIntentId,
          amountCents: session.amount_total || undefined,
          status: "paid"
        }
      }
    },
    include: { items: true, payment: true }
  });
  return normalizeOrder(order);
}

export async function markOrderPaymentFailedBySession(sessionId: string) {
  requireDatabase();
  const payment = await prisma.payment.findUnique({ where: { stripeSessionId: sessionId } });
  if (!payment) return null;
  const order = await prisma.order.update({
    where: { id: payment.orderId },
    data: {
      paymentStatus: "failed",
      payment: { update: { status: "failed" } }
    },
    include: { items: true, payment: true }
  });
  return normalizeOrder(order);
}

export async function getOrder(id: string) {
  if (!hasDatabaseUrl()) return null;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payment: true }
  });
  return order ? normalizeOrder(order) : null;
}

export async function getOrderByStripeSession(sessionId: string) {
  if (!hasDatabaseUrl()) return null;
  const payment = await prisma.payment.findUnique({ where: { stripeSessionId: sessionId } });
  if (!payment) return null;
  return getOrder(payment.orderId);
}

export async function listPaidOrders(limit = 50) {
  if (!hasDatabaseUrl()) return [];
  const orders = await prisma.order.findMany({
    where: { paymentStatus: "paid" },
    include: { items: true, payment: true },
    orderBy: { createdAt: "desc" },
    take: limit
  });
  return orders.map(normalizeOrder);
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  if (!hasDatabaseUrl()) {
    return {
      orders: [] as StoredOrder[],
      revenueCents: 0,
      averageTicketCents: 0,
      openOrders: 0,
      topItem: "No paid orders",
      menuItems
    };
  }

  const orders = await listPaidOrders(100);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((order: StoredOrder) => new Date(order.createdAt) >= today);
  const revenueCents = todayOrders.reduce((sum: number, order: StoredOrder) => sum + order.totalCents, 0);
  const openOrders = orders.filter((order: StoredOrder) => !["completed", "cancelled"].includes(order.status)).length;
  const itemCounts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + item.quantity);
  }
  const topItem = [...itemCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "No paid orders";
  const dbMenuItems = (await prisma.menuItem.findMany({ orderBy: [{ categoryId: "asc" }, { name: "asc" }] })) as {
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
  }[];

  return {
    orders,
    revenueCents,
    averageTicketCents: todayOrders.length ? Math.round(revenueCents / todayOrders.length) : 0,
    openOrders,
    topItem,
    menuItems: dbMenuItems.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      priceCents: item.priceCents,
      image: item.image,
      tags: item.tags,
      spiceLevel: Math.max(0, Math.min(3, item.spiceLevel)) as 0 | 1 | 2 | 3,
      active: item.active,
      featured: item.featured
    }))
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  requireDatabase();
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: { items: true, payment: true }
  });
  return normalizeOrder(order);
}

export async function updateMenuItem(
  id: string,
  data: Partial<{
    active: boolean;
    featured: boolean;
    priceCents: number;
    description: string;
    tags: string[];
    spiceLevel: number;
  }>
) {
  requireDatabase();
  return prisma.menuItem.update({
    where: { id },
    data
  });
}

export function formatOrderSummary(order: StoredOrder) {
  return `${order.id} · ${order.customer.name} · ${formatMoney(order.totalCents)}`;
}
