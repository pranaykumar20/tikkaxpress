import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getToastConfig } from "@/lib/integrations/toast/config";

export function verifyToastWebhookSignature(body: string, signatureHeader: string | null) {
  const secret = getToastConfig().webhookSecret;
  if (!secret) return true;
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const provided = signatureHeader.replace(/^sha256=/, "");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

export async function readToastWebhook(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("toast-signature") || request.headers.get("x-toast-signature");

  if (!verifyToastWebhookSignature(body, signature)) {
    return { ok: false as const, response: NextResponse.json({ error: "Invalid Toast webhook signature." }, { status: 401 }) };
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return { ok: false as const, response: NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 }) };
  }

  return { ok: true as const, payload, body };
}

export function extractOrderWebhookDetails(payload: Record<string, unknown>) {
  const details = (payload.details || payload) as Record<string, unknown>;
  const order = (details.order || details) as Record<string, unknown>;
  return {
    eventType: String(payload.eventType || payload.type || ""),
    toastOrderGuid: String(order.guid || ""),
    externalId: String(order.externalId || ""),
    approvalStatus: String(order.approvalStatus || ""),
    guestOrderStatus: String(order.guestOrderStatus || ""),
    voided: Boolean(order.voided)
  };
}

export function extractPaymentWebhookDetails(payload: Record<string, unknown>) {
  const payment = (payload.paymentIntent || payload.data || payload) as Record<string, unknown>;
  return {
    eventType: String(payload.eventType || payload.type || ""),
    paymentIntentId: String(payment.id || payment.paymentIntentId || ""),
    externalReferenceId: String(payment.externalReferenceId || payment.externalId || ""),
    status: String(payment.status || ""),
    amount: Number(payment.amount || 0)
  };
}
