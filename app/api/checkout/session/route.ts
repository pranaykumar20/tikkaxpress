import { NextRequest, NextResponse } from "next/server";
import { attachStripeSession, createPendingOrder, type CustomerDetails } from "@/lib/orders";
import { calculateCartPrice } from "@/lib/pricing";
import { restaurantConfig, validateScheduledTime } from "@/lib/restaurant";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();
    const pricing = calculateCartPrice({ ...body, now });

    if (!body.customer?.name || !body.customer?.email || !body.customer?.phone) {
      return NextResponse.json({ error: "Name, email, and phone are required." }, { status: 400 });
    }
    if (body.fulfillmentType === "delivery" && !body.customer?.address) {
      return NextResponse.json({ error: "Delivery address is required." }, { status: 400 });
    }
    if (!validateScheduledTime(body.customer?.scheduledTime, now)) {
      return NextResponse.json({ error: "Choose an available pickup or delivery time." }, { status: 400 });
    }

    const customer: CustomerDetails = {
      name: String(body.customer.name),
      email: String(body.customer.email),
      phone: String(body.customer.phone),
      address: body.customer.address ? String(body.customer.address) : undefined,
      scheduledTime: body.customer.scheduledTime ? String(body.customer.scheduledTime) : "ASAP",
      notes: body.customer.notes ? String(body.customer.notes) : undefined
    };

    const order = await createPendingOrder({
      fulfillmentType: body.fulfillmentType,
      customer,
      pricing
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const stripe = getStripe();

    if (!stripe) {
      return NextResponse.json({ orderId: order.id, demo: true, paymentStatus: order.paymentStatus });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer.email,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        customerName: customer.name,
        phone: customer.phone,
        fulfillmentType: body.fulfillmentType,
        scheduledTime: customer.scheduledTime || "ASAP"
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pricing.totalCents,
            product_data: {
              name: `${restaurantConfig.name} order`,
              description: pricing.normalizedItems.map((item) => `${item.quantity}x ${item.name}`).join(", ").slice(0, 500)
            }
          }
        }
      ],
      success_url: `${appUrl}/order/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/order/cancelled?order_id=${order.id}`
    });

    await attachStripeSession(order.id, session.id);

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create checkout session." }, { status: 400 });
  }
}
