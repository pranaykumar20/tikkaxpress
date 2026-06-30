import { getToastConfig } from "@/lib/integrations/toast/config";
import type { FulfillmentType } from "@/lib/menu";
import type { PriceResult } from "@/lib/pricing";
import type { CustomerDetails } from "@/lib/orders";

export type ToastOrderBuildInput = {
  orderId: string;
  fulfillmentType: FulfillmentType;
  customer: CustomerDetails;
  pricing: PriceResult;
  paymentIntentId?: string;
  payAtStore?: boolean;
};

export type ToastOrderPayload = {
  externalId: string;
  entityType: "Order";
  diningOption: { guid: string; entityType: "DiningOption" };
  revenueCenter?: { guid: string; entityType: "RevenueCenter" };
  checks: ToastCheck[];
  deliveryInfo?: {
    address1: string;
    city?: string;
    state?: string;
    zipCode?: string;
    notes?: string;
  };
};

type ToastCheck = {
  externalId: string;
  entityType: "Check";
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  selections: ToastSelection[];
  payments?: ToastPayment[];
};

type ToastSelection = {
  externalId: string;
  entityType: "MenuItemSelection";
  itemGroup: { guid: string; entityType: "MenuGroup" };
  item: { guid: string; entityType: "MenuItem" };
  quantity: number;
  modifiers?: { guid: string; entityType: "Modifier" }[];
  specialInstructions?: string;
};

type ToastPayment =
  | {
      guid: string;
      entityType: "OrderPayment";
      type: "CREDIT";
      tipAmount?: number;
    }
  | {
      entityType: "OrderPayment";
      type: "OTHER";
      otherPayment: { guid: string; entityType: "AlternatePaymentType" };
      amount: number;
      tipAmount?: number;
    };

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || "Guest",
    lastName: parts.slice(1).join(" ") || "Customer"
  };
}

function parseAddress(address: string) {
  const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  const stateMatch = address.match(/\b([A-Z]{2})\b/);
  return {
    address1: address,
    zipCode: zipMatch?.[1],
    state: stateMatch?.[1]
  };
}

export function buildToastOrderPayload(input: ToastOrderBuildInput): ToastOrderPayload {
  const config = getToastConfig();
  const diningOptionGuid =
    input.fulfillmentType === "delivery" ? config.deliveryDiningOptionGuid : config.pickupDiningOptionGuid;

  if (!diningOptionGuid) {
    throw new Error("Toast dining option GUID is not configured.");
  }

  const unmapped = input.pricing.normalizedItems.filter((item) => !item.toastItemGuid || !item.toastGroupGuid);
  if (unmapped.length) {
    throw new Error(`Menu items are not mapped to Toast: ${unmapped.map((item) => item.name).join(", ")}`);
  }

  const { firstName, lastName } = splitName(input.customer.name);
  const checkExternalId = `${input.orderId}-check`;

  const selections: ToastSelection[] = input.pricing.normalizedItems.map((item, index) => ({
    externalId: `${input.orderId}-selection-${index + 1}`,
    entityType: "MenuItemSelection",
    itemGroup: { guid: item.toastGroupGuid!, entityType: "MenuGroup" },
    item: { guid: item.toastItemGuid!, entityType: "MenuItem" },
    quantity: item.quantity,
    specialInstructions: item.notes || undefined
  }));

  const payments: ToastPayment[] = [];

  if (input.payAtStore) {
    if (!config.payAtStorePaymentTypeGuid) {
      throw new Error("Toast pay-at-store payment type GUID is not configured.");
    }
    payments.push({
      entityType: "OrderPayment",
      type: "OTHER",
      otherPayment: { guid: config.payAtStorePaymentTypeGuid, entityType: "AlternatePaymentType" },
      amount: input.pricing.totalCents / 100,
      tipAmount: input.pricing.tipCents / 100
    });
  } else if (input.paymentIntentId) {
    payments.push({
      guid: input.paymentIntentId,
      entityType: "OrderPayment",
      type: "CREDIT",
      tipAmount: input.pricing.tipCents / 100
    });
  }

  const payload: ToastOrderPayload = {
    externalId: input.orderId,
    entityType: "Order",
    diningOption: { guid: diningOptionGuid, entityType: "DiningOption" },
    checks: [
      {
        externalId: checkExternalId,
        entityType: "Check",
        customer: {
          firstName,
          lastName,
          email: input.customer.email,
          phone: input.customer.phone
        },
        selections,
        payments: payments.length ? payments : undefined
      }
    ]
  };

  if (config.revenueCenterGuid) {
    payload.revenueCenter = { guid: config.revenueCenterGuid, entityType: "RevenueCenter" };
  }

  if (input.fulfillmentType === "delivery" && input.customer.address) {
    payload.deliveryInfo = {
      ...parseAddress(input.customer.address),
      notes: input.customer.notes || undefined
    };
  }

  return payload;
}

export type ToastPriceResponse = {
  checks?: { totalAmount?: number; taxAmount?: number; amount?: number }[];
};

export function extractToastTotals(priceResponse: ToastPriceResponse) {
  const check = priceResponse.checks?.[0];
  return {
    totalCents: Math.round((check?.totalAmount || check?.amount || 0) * 100),
    taxCents: Math.round((check?.taxAmount || 0) * 100)
  };
}
