import { randomUUID } from "crypto";
import { getToastConfig, isToastPaymentsConfigured } from "@/lib/integrations/toast/config";
import { toastRequest } from "@/lib/integrations/toast/client";

export type ToastPaymentIntent = {
  id: string;
  externalReferenceId: string;
  sessionSecret: string;
  amount: number;
  currency: string;
  status: string;
  demo?: boolean;
};

type CreatePaymentIntentBody = {
  amount: number;
  currency: string;
  externalReferenceId: string;
  captureMethod: "MANUAL" | "AUTOMATIC";
  email?: string;
  amountDetails?: { tip: number };
  paymentMethodConfigurationId?: string;
};

export async function createToastPaymentIntent({
  orderId,
  amountCents,
  tipCents,
  email
}: {
  orderId: string;
  amountCents: number;
  tipCents: number;
  email: string;
}): Promise<ToastPaymentIntent> {
  if (!isToastPaymentsConfigured()) {
    return {
      id: `demo_pi_${orderId}`,
      externalReferenceId: orderId,
      sessionSecret: `demo_secret_${orderId}`,
      amount: amountCents,
      currency: "USD",
      status: "REQUIRES_PAYMENT_METHOD",
      demo: true
    };
  }

  const config = getToastConfig();
  const body: CreatePaymentIntentBody = {
    amount: amountCents,
    currency: "USD",
    externalReferenceId: orderId,
    captureMethod: "MANUAL",
    email,
    amountDetails: { tip: tipCents }
  };

  if (config.paymentMethodConfigId) {
    body.paymentMethodConfigurationId = config.paymentMethodConfigId;
  }

  const response = await toastRequest<ToastPaymentIntent>("/v1/payment-intents", {
    method: "POST",
    baseUrl: config.paymentsApiBaseUrl,
    restaurantScoped: false,
    body: JSON.stringify(body)
  });

  return response;
}

export async function getToastPaymentIntent(paymentIntentId: string) {
  if (!isToastPaymentsConfigured() || paymentIntentId.startsWith("demo_pi_")) {
    return {
      id: paymentIntentId,
      status: paymentIntentId.startsWith("demo_pi_") ? "REQUIRES_PAYMENT_METHOD" : "SUCCEEDED",
      demo: true
    };
  }

  const config = getToastConfig();
  return toastRequest<{ id: string; status: string }>(`/v1/payment-intents/${paymentIntentId}`, {
    method: "GET",
    baseUrl: config.paymentsApiBaseUrl,
    restaurantScoped: false
  });
}

export function buildToastCheckoutIframeUrl(sessionSecret: string) {
  const config = getToastConfig();
  const url = new URL("/checkout", config.paymentsCheckoutOrigin);
  url.searchParams.set("sessionSecret", sessionSecret);
  return url.toString();
}

export function createDemoPaymentIntentId(orderId: string) {
  return `demo_pi_${orderId}_${randomUUID().slice(0, 8)}`;
}

export function isDemoPaymentIntent(paymentIntentId?: string | null) {
  return !paymentIntentId || paymentIntentId.startsWith("demo_pi_");
}

export function isPaymentSucceeded(status: string) {
  return ["SUCCEEDED", "CAPTURED", "AUTHORIZED"].includes(status.toUpperCase());
}
