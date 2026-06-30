import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/notifications";
import { markOrderPaidFromToastPayment, markOrderPaymentFailed } from "@/lib/orders";
import { isPaymentSucceeded } from "@/lib/integrations/toast/payments";
import { extractPaymentWebhookDetails, readToastWebhook } from "@/lib/integrations/toast/webhooks";
import { fulfillPaidOrder } from "@/lib/integrations/toast/submit-order";

export async function POST(request: NextRequest) {
  const parsed = await readToastWebhook(request);
  if (!parsed.ok) return parsed.response;

  const { paymentIntentId, externalReferenceId, status, eventType } = extractPaymentWebhookDetails(parsed.payload);

  if (!paymentIntentId && !externalReferenceId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const normalizedStatus = status.toUpperCase();
  const isFailure = ["FAILED", "CANCELED", "CANCELLED"].includes(normalizedStatus);
  const isSuccess = isPaymentSucceeded(normalizedStatus) || eventType.toLowerCase().includes("succeeded");

  if (isFailure && paymentIntentId) {
    await markOrderPaymentFailed(paymentIntentId);
    return NextResponse.json({ received: true, status: "failed" });
  }

  if (!isSuccess) {
    return NextResponse.json({ received: true, ignored: true, status: normalizedStatus || "pending" });
  }

  const orderId = externalReferenceId;
  if (!orderId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const paidOrder = await markOrderPaidFromToastPayment({
    orderId,
    paymentIntentId: paymentIntentId || `toast_${orderId}`,
    toastPaymentStatus: normalizedStatus || "SUCCEEDED"
  });

  try {
    await fulfillPaidOrder(paidOrder, paymentIntentId || undefined);
  } catch (error) {
    console.error("Toast order submission failed after payment.", error);
  }

  await sendOrderConfirmationEmail(paidOrder);
  return NextResponse.json({ received: true, status: "paid", orderId });
}
