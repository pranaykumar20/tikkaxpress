import { NextRequest, NextResponse } from "next/server";
import { calculateCartPrice, getUnmappedToastItems } from "@/lib/pricing";
import { attachToastPaymentIntent, createPendingOrder, type CustomerDetails } from "@/lib/orders";
import { buildToastOrderPayload } from "@/lib/integrations/toast/order-builder";
import { isToastApiConfigured } from "@/lib/integrations/toast/config";
import { createToastPaymentIntent, buildToastCheckoutIframeUrl } from "@/lib/integrations/toast/payments";
import { priceOrderWithToast } from "@/lib/integrations/toast/submit-order";
import { findRestaurantLocation, validateDeliveryAddress, validateScheduledTime } from "@/lib/restaurant";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();
    const location = findRestaurantLocation(body.locationId);
    const pricing = await calculateCartPrice({ ...body, now });

    if (pricing.totalCents <= 0) {
      return NextResponse.json({ error: "Add at least one item before checkout." }, { status: 400 });
    }
    if (!body.customer?.name || !body.customer?.email || !body.customer?.phone) {
      return NextResponse.json({ error: "Name, email, and phone are required." }, { status: 400 });
    }
    if (body.fulfillmentType === "delivery" && !body.customer?.address) {
      return NextResponse.json({ error: "Delivery address is required." }, { status: 400 });
    }
    if (body.fulfillmentType === "delivery" && !validateDeliveryAddress(String(body.customer.address))) {
      return NextResponse.json({ error: "Delivery is currently available only for nearby ZIP codes." }, { status: 400 });
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

    if (isToastApiConfigured()) {
      const unmapped = getUnmappedToastItems(pricing.normalizedItems);
      if (unmapped.length) {
        return NextResponse.json(
          {
            error: `These items are not synced to Toast yet: ${unmapped.map((item) => item.name).join(", ")}. Run menu sync from admin.`
          },
          { status: 400 }
        );
      }
    }

    const order = await createPendingOrder({
      fulfillmentType: body.fulfillmentType,
      locationId: location.id,
      customer,
      pricing
    });

    if (body.paymentMethod === "store") {
      const { submitOrderToToast } = await import("@/lib/integrations/toast/submit-order");
      const toastResult = await submitOrderToToast({
        orderId: order.id,
        fulfillmentType: body.fulfillmentType,
        customer,
        pricing,
        payAtStore: true
      });

      return NextResponse.json({
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        payAtStore: true,
        toastOrderGuid: toastResult.toastOrderGuid,
        demo: toastResult.demo
      });
    }

    if (isToastApiConfigured()) {
      const draftPayload = buildToastOrderPayload({
        orderId: order.id,
        fulfillmentType: body.fulfillmentType,
        customer,
        pricing
      });
      const toastPrices = await priceOrderWithToast(draftPayload);
      if (toastPrices) {
        const toastCheck = toastPrices.checks?.[0];
        const toastTotalCents = Math.round((toastCheck?.totalAmount || toastCheck?.amount || 0) * 100);
        if (toastTotalCents > 0 && Math.abs(toastTotalCents - pricing.totalCents) > 5) {
          return NextResponse.json(
            { error: "Toast pricing does not match checkout total. Refresh the menu and try again." },
            { status: 409 }
          );
        }
      }
    }

    const paymentIntent = await createToastPaymentIntent({
      orderId: order.id,
      amountCents: pricing.totalCents,
      tipCents: pricing.tipCents,
      email: customer.email
    });

    await attachToastPaymentIntent(order.id, paymentIntent.id, paymentIntent.status);

    return NextResponse.json({
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
      sessionSecret: paymentIntent.sessionSecret,
      checkoutUrl: paymentIntent.demo ? null : buildToastCheckoutIframeUrl(paymentIntent.sessionSecret),
      demo: Boolean(paymentIntent.demo),
      amountCents: pricing.totalCents
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to prepare checkout." }, { status: 400 });
  }
}
