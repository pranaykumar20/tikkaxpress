import Link from "next/link";
import { CheckCircle2, Clock, Mail, MapPin, Phone } from "lucide-react";
import { formatMoney } from "@/lib/menu";
import { getOrder, getOrderByStripeSession } from "@/lib/orders";
import { formatScheduledTime, restaurantConfig } from "@/lib/restaurant";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string; order_id?: string }> }) {
  const params = await searchParams;
  const order = params.order_id ? await getOrder(params.order_id) : params.session_id ? await getOrderByStripeSession(params.session_id) : null;
  const orderId = order?.id || params.order_id || params.session_id || "pending";
  const paymentLabel = order?.paymentStatus === "paid" ? "Payment confirmed" : "Payment pending";

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-3xl rounded-[8px] bg-white p-8 shadow-card">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-herb" />
          <p className="mt-6 text-sm font-black uppercase tracking-[0.22em] text-ember">Order received</p>
          <h1 className="mt-2 text-4xl font-black">Thanks for ordering TikkaXpress.</h1>
          <p className="mt-4 text-charcoal/68">
            {order
              ? `${paymentLabel}. Your order is ${order.status}, and the kitchen will contact you if anything needs attention.`
              : "We could not load full order details yet. If you just paid, refresh this page in a few seconds."}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Info icon={<Clock className="h-5 w-5" />} title="ETA" body={order?.customer.scheduledTime ? formatScheduledTime(order.customer.scheduledTime) : "20-30 minutes"} />
          <Info icon={<Mail className="h-5 w-5" />} title="Receipt" body={order?.customer.email || "Email confirmation"} />
          <Info icon={<Phone className="h-5 w-5" />} title="Contact" body={restaurantConfig.phone} />
          <Info icon={<MapPin className="h-5 w-5" />} title={order?.fulfillmentType === "delivery" ? "Delivery" : "Pickup"} body={order?.customer.address || "4110 Hamilton Ave"} />
        </div>

        {order && (
          <div className="mt-6 overflow-hidden rounded-[8px] border border-black/8">
            <div className="bg-ink p-4 text-white">
              <div className="font-black">Order reference: {order.id}</div>
              <div className="mt-1 text-sm font-semibold capitalize text-white/60">
                {order.fulfillmentType} · {order.paymentStatus} · {order.status}
              </div>
            </div>
            <div className="divide-y divide-black/8">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 p-4">
                  <div>
                    <div className="font-black">
                      {item.quantity}x {item.name}
                    </div>
                    {item.modifiers && (
                      <div className="mt-1 text-xs font-semibold text-charcoal/55">
                        {Object.entries(item.modifiers)
                          .map(([label, value]) => `${label}: ${value}`)
                          .join(" · ")}
                      </div>
                    )}
                    {item.notes && <div className="mt-1 text-xs font-semibold text-charcoal/55">Note: {item.notes}</div>}
                  </div>
                  <div className="shrink-0 font-black">{formatMoney(item.lineTotalCents)}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2 bg-cream p-4 text-sm font-semibold">
              <SummaryRow label="Subtotal" value={formatMoney(order.subtotalCents)} />
              {order.discountCents > 0 && <SummaryRow label="Discount" value={`-${formatMoney(order.discountCents)}`} />}
              <SummaryRow label="Tax" value={formatMoney(order.taxCents)} />
              <SummaryRow label="Delivery" value={order.deliveryFeeCents ? formatMoney(order.deliveryFeeCents) : "Free"} />
              <SummaryRow label="Tip" value={formatMoney(order.tipCents)} />
              <div className="flex justify-between border-t border-black/8 pt-3 text-xl font-black">
                <span>Total</span>
                <span>{formatMoney(order.totalCents)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="inline-flex justify-center rounded-full bg-ink px-6 py-3 font-black text-white">
            Back to menu
          </Link>
          <Link href="/admin" className="inline-flex justify-center rounded-full border border-black/10 bg-cream px-6 py-3 font-black text-ink">
            Restaurant dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

function Info({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-[8px] bg-cream p-4">
      <div className="text-tandoori">{icon}</div>
      <div className="mt-3 font-black">{title}</div>
      <div className="mt-1 break-words text-sm text-charcoal/62">{body}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
