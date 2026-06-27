import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/notifications";
import { markOrderPaidFromCheckoutSession, markOrderPaymentFailedBySession } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ received: true, demo: true });
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const order = await markOrderPaidFromCheckoutSession(session);
      await sendOrderConfirmationEmail(order);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      await markOrderPaymentFailedBySession(session.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid webhook." }, { status: 400 });
  }
}
