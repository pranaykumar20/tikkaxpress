import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/notifications";
import { getOrder, markOrderPaidFromToastPayment } from "@/lib/orders";
import { isDemoPaymentIntent, isPaymentSucceeded } from "@/lib/integrations/toast/payments";
import { fulfillPaidOrder } from "@/lib/integrations/toast/submit-order";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = String(body.orderId || "");
    const paymentIntentId = String(body.paymentIntentId || "");

    if (!orderId || !paymentIntentId) {
      return NextResponse.json({ error: "orderId and paymentIntentId are required." }, { status: 400 });
    }

    const existing = await getOrder(orderId);
    if (!existing) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (existing.paymentStatus === "paid" && existing.toastOrderGuid) {
      return NextResponse.json({
        orderId: existing.id,
        paymentStatus: existing.paymentStatus,
        toastOrderGuid: existing.toastOrderGuid,
        alreadyCompleted: true
      });
    }

    if (!isDemoPaymentIntent(paymentIntentId)) {
      return NextResponse.json(
        { error: "Live Toast payment completion must be confirmed through Toast webhooks." },
        { status: 400 }
      );
    }

    const paidOrder = await markOrderPaidFromToastPayment({
      orderId,
      paymentIntentId,
      toastPaymentStatus: "SUCCEEDED",
      amountCents: existing.totalCents
    });

    await fulfillPaidOrder(paidOrder, paymentIntentId);
    const refreshed = (await getOrder(orderId)) || paidOrder;
    await sendOrderConfirmationEmail(refreshed);

    return NextResponse.json({
      orderId: refreshed.id,
      paymentStatus: refreshed.paymentStatus,
      toastOrderGuid: refreshed.toastOrderGuid,
      demo: true
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to complete checkout." }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const paymentIntentId = request.nextUrl.searchParams.get("paymentIntentId");
  if (!paymentIntentId) {
    return NextResponse.json({ error: "paymentIntentId is required." }, { status: 400 });
  }

  const { getToastPaymentIntent } = await import("@/lib/integrations/toast/payments");
  const payment = await getToastPaymentIntent(paymentIntentId);
  return NextResponse.json({
    paymentIntentId,
    status: payment.status,
    succeeded: isPaymentSucceeded(payment.status)
  });
}
