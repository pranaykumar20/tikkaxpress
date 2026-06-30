import { isToastApiConfigured } from "@/lib/integrations/toast/config";
import { toastRequest } from "@/lib/integrations/toast/client";
import {
  buildToastOrderPayload,
  extractToastTotals,
  type ToastOrderPayload,
  type ToastPriceResponse
} from "@/lib/integrations/toast/order-builder";
import type { ToastOrderBuildInput } from "@/lib/integrations/toast/order-builder";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import type { StoredOrder } from "@/lib/orders";

type ToastOrderResponse = {
  guid: string;
  externalId?: string;
  approvalStatus?: string;
};

export async function priceOrderWithToast(payload: ToastOrderPayload) {
  if (!isToastApiConfigured()) {
    return null;
  }

  return toastRequest<ToastPriceResponse>("/orders/v2/prices", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function submitOrderToToast(input: ToastOrderBuildInput): Promise<{ toastOrderGuid: string; demo: boolean }> {
  if (!isToastApiConfigured()) {
    const demoGuid = `demo-order-${input.orderId}`;
    await persistToastSubmission(input.orderId, demoGuid, null);
    return { toastOrderGuid: demoGuid, demo: true };
  }

  const payload = buildToastOrderPayload(input);

  const priced = await priceOrderWithToast(payload);
  if (priced) {
    const toastTotals = extractToastTotals(priced);
    const toleranceCents = 5;
    if (Math.abs(toastTotals.totalCents - input.pricing.totalCents) > toleranceCents) {
      throw new Error(
        `Toast total ${toastTotals.totalCents} cents does not match checkout total ${input.pricing.totalCents} cents.`
      );
    }
  }

  const response = await toastRequest<ToastOrderResponse>("/orders/v2/orders", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  await persistToastSubmission(input.orderId, response.guid, null);
  return { toastOrderGuid: response.guid, demo: false };
}

async function persistToastSubmission(orderId: string, toastOrderGuid: string, integrationError: string | null) {
  if (!hasDatabaseUrl()) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      toastOrderGuid,
      toastExternalId: orderId,
      integrationError
    }
  });
}

export async function recordToastSubmissionFailure(orderId: string, error: unknown) {
  if (!hasDatabaseUrl()) return;
  const message = error instanceof Error ? error.message : "Unknown Toast submission error.";
  await prisma.order.update({
    where: { id: orderId },
    data: { integrationError: message }
  });
}

export async function retryToastSubmission(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true }
  });
  if (!order) throw new Error("Order not found.");
  if (order.toastOrderGuid) return { toastOrderGuid: order.toastOrderGuid, alreadySubmitted: true };

  const input: ToastOrderBuildInput = {
    orderId: order.id,
    fulfillmentType: order.fulfillmentType,
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: order.deliveryAddress || undefined,
      scheduledTime: order.scheduledTime || undefined,
      notes: order.notes || undefined
    },
    pricing: {
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      taxCents: order.taxCents,
      deliveryFeeCents: order.deliveryFeeCents,
      tipCents: order.tipCents,
      totalCents: order.totalCents,
      normalizedItems: order.items.map((item) => ({
        id: item.menuItemId,
        quantity: item.quantity,
        modifiers: (item.modifiers || undefined) as Record<string, string> | undefined,
        notes: item.notes || undefined,
        name: item.name,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
        toastItemGuid: undefined,
        toastGroupGuid: undefined
      }))
    },
    paymentIntentId: order.payment?.toastPaymentIntentId || order.toastPaymentIntentId || undefined,
    payAtStore: order.paymentStatus === "pending"
  };

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: order.items.map((item) => item.menuItemId) } }
  });
  const menuById = new Map(menuItems.map((item) => [item.id, item]));
  input.pricing.normalizedItems = input.pricing.normalizedItems.map((item) => {
    const menuItem = menuById.get(item.id);
    return {
      ...item,
      toastItemGuid: menuItem?.toastItemGuid || undefined,
      toastGroupGuid: menuItem?.toastGroupGuid || undefined
    };
  });

  try {
    const result = await submitOrderToToast(input);
    return { ...result, alreadySubmitted: false };
  } catch (error) {
    await recordToastSubmissionFailure(orderId, error);
    throw error;
  }
}

export function mapToastStatusToLocal(payload: {
  approvalStatus?: string;
  guestOrderStatus?: string;
  voided?: boolean;
}) {
  if (payload.voided) return "cancelled" as const;
  const guest = payload.guestOrderStatus?.toUpperCase();
  if (guest === "READY_FOR_PICKUP") return "ready" as const;
  if (guest === "IN_PREPARATION") return "preparing" as const;
  if (guest === "CLOSED") return "completed" as const;

  const approval = payload.approvalStatus?.toUpperCase();
  if (approval === "APPROVED") return "accepted" as const;
  if (approval === "NOT_APPROVED") return "cancelled" as const;
  return null;
}

export async function applyToastOrderStatusUpdate({
  toastOrderGuid,
  externalId,
  status
}: {
  toastOrderGuid?: string;
  externalId?: string;
  status: StoredOrder["status"];
}) {
  if (!hasDatabaseUrl()) return null;

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        toastOrderGuid ? { toastOrderGuid } : undefined,
        externalId ? { id: externalId } : undefined,
        externalId ? { toastExternalId: externalId } : undefined
      ].filter(Boolean) as { toastOrderGuid?: string; id?: string; toastExternalId?: string }[]
    },
    include: { items: true, payment: true }
  });

  if (!order) return null;

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status },
    include: { items: true, payment: true }
  });

  return updated;
}

export async function fulfillPaidOrder(order: StoredOrder, paymentIntentId?: string) {
  try {
    const menuItemIds = order.items.map((item) => item.menuItemId);
    const menuItems = hasDatabaseUrl()
      ? await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } })
      : [];
    const menuById = new Map(menuItems.map((item) => [item.id, item]));

    await submitOrderToToast({
      orderId: order.id,
      fulfillmentType: order.fulfillmentType,
      customer: order.customer,
      pricing: {
        subtotalCents: order.subtotalCents,
        discountCents: order.discountCents,
        taxCents: order.taxCents,
        deliveryFeeCents: order.deliveryFeeCents,
        tipCents: order.tipCents,
        totalCents: order.totalCents,
        normalizedItems: order.items.map((item) => {
          const menuItem = menuById.get(item.menuItemId);
          return {
            id: item.menuItemId,
            quantity: item.quantity,
            modifiers: item.modifiers || undefined,
            notes: item.notes || undefined,
            name: item.name,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents,
            toastItemGuid: menuItem?.toastItemGuid || undefined,
            toastGroupGuid: menuItem?.toastGroupGuid || undefined
          };
        })
      },
      paymentIntentId
    });
  } catch (error) {
    await recordToastSubmissionFailure(order.id, error);
    throw error;
  }
}
