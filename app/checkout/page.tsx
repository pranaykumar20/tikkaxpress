"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, CreditCard, Lock, MapPin, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatMoney, menuItems, type FulfillmentType } from "@/lib/menu";
import { findRestaurantLocation, getOrderTimeOptions, restaurantConfig, restaurantLocations } from "@/lib/restaurant";
import type { CartLine } from "@/components/Storefront";

type SavedCart = {
  locationId?: string;
  fulfillmentType: FulfillmentType;
  promoCode?: string;
  tipCents?: number;
  items: CartLine[];
};

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<SavedCart>({ fulfillmentType: "pickup", items: [], tipCents: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const orderTimeOptions = useMemo(() => getOrderTimeOptions(), []);
  const selectedLocation = findRestaurantLocation(cart.locationId);

  useEffect(() => {
    const saved = localStorage.getItem("tikkaxpress-cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  const lines = useMemo(() => {
    return cart.items.map((line) => {
      const item = menuItems.find((menuItem) => menuItem.id === line.id)!;
      return { ...line, item, lineTotalCents: item.priceCents * line.quantity };
    });
  }, [cart.items]);

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const discountCents = cart.promoCode?.trim().toUpperCase() === "LUNCH10" ? Math.round(subtotalCents * 0.1) : 0;
  const taxCents = Math.round(Math.max(0, subtotalCents - discountCents) * restaurantConfig.taxRate);
  const deliveryFeeCents = cart.fulfillmentType === "delivery" ? restaurantConfig.deliveryFeeCents : 0;
  const totalCents = subtotalCents - discountCents + taxCents + deliveryFeeCents + (cart.tipCents || 0);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cart,
          locationId: selectedLocation.id,
          customer: {
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone"),
            address: form.get("address"),
            scheduledTime: form.get("scheduledTime"),
            notes: form.get("notes")
          }
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to start checkout.");
      if (payload.url) window.location.href = payload.url;
      else if (payload.orderId) router.push(`/order/success?session_id=demo&order_id=${payload.orderId}`);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/70 px-4 py-2 font-black text-charcoal/70 shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Back to menu
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <form onSubmit={submitOrder} className="overflow-hidden rounded-[8px] border border-black/8 bg-white shadow-card">
            <div className="bg-ink p-6 text-white">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-tandoori">Secure checkout</p>
                  <h1 className="mt-2 text-3xl font-black sm:text-4xl">Confirm your order</h1>
                  <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/62">Pickup or delivery details stay simple, while payment moves through Stripe-hosted checkout.</p>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 sm:h-14 sm:w-14">
                  <Lock className="h-7 w-7 text-tandoori sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>

            <div className="p-6">
            <div className="mb-6 rounded-[8px] border border-black/8 bg-cream p-4">
              <label className="block text-sm font-black text-charcoal/70" htmlFor="locationId">
                Ordering location
              </label>
              <select
                id="locationId"
                value={selectedLocation.id}
                onChange={(event) => setCart((current) => ({ ...current, locationId: event.target.value }))}
                className="mt-2 w-full rounded-[8px] border border-black/10 bg-white px-4 py-3 font-bold outline-none focus:focus-ring"
              >
                {restaurantLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.shortName} - {location.address}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm font-semibold text-charcoal/58">
                {selectedLocation.phone} · {selectedLocation.address}
              </p>
            </div>
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {(["pickup", "delivery"] as FulfillmentType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCart((current) => ({ ...current, fulfillmentType: type }))}
                  className={`rounded-[8px] border p-4 text-left font-black capitalize shadow-card transition hover:-translate-y-0.5 ${
                    cart.fulfillmentType === type ? "border-ink bg-ink text-white" : "border-black/10 bg-cream text-ink"
                  }`}
                >
                  {type === "delivery" ? <Truck className="mb-3 h-5 w-5 text-tandoori" /> : <ShoppingBag className="mb-3 h-5 w-5 text-tandoori" />}
                  {type}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="name" label="Name" required />
              <Field name="phone" label="Phone" required />
              <Field name="email" label="Email" type="email" required />
              <label className="block">
                <span className="text-sm font-black text-charcoal/70">Pickup/delivery time</span>
                <select name="scheduledTime" defaultValue={orderTimeOptions[0]?.value || "ASAP"} className="mt-2 w-full rounded-[8px] border border-black/10 bg-cream px-4 py-3 outline-none focus:focus-ring">
                  {orderTimeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {cart.fulfillmentType === "delivery" && <Field name="address" label="Delivery address" required className="mt-4" />}
            <label className="mt-4 block">
              <span className="text-sm font-black text-charcoal/70">Order notes</span>
              <textarea name="notes" rows={4} className="mt-2 w-full rounded-[8px] border border-black/10 bg-cream px-4 py-3 outline-none focus:focus-ring" placeholder="Allergies, spice notes, utensils..." />
            </label>

            <div className="mt-5 rounded-[8px] border border-black/8 bg-cream p-4">
              <label className="block text-sm font-black text-charcoal/70" htmlFor="tip">
                Tip
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {[0, 200, 400, 600].map((tip) => (
                  <button
                    key={tip}
                    type="button"
                    onClick={() => setCart((current) => ({ ...current, tipCents: tip }))}
                    className={`rounded-full px-4 py-2 text-sm font-black ${cart.tipCents === tip ? "bg-ink text-white" : "bg-white text-ink"}`}
                  >
                    {tip === 0 ? "No tip" : formatMoney(tip)}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="mt-4 rounded-[8px] bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading || cart.items.length === 0}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-[8px] bg-tandoori px-6 py-4 text-lg font-black text-ink shadow-glow transition hover:-translate-y-0.5 hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CreditCard className="h-5 w-5" />
              {loading ? "Starting payment..." : "Pay securely with Stripe"}
            </button>
            <p className="mt-3 text-center text-xs font-bold text-charcoal/50">Orders are stored as pending first and marked paid only after Stripe confirms payment.</p>
            </div>
          </form>

          <aside className="overflow-hidden rounded-[8px] bg-ink text-white shadow-card lg:self-start">
            <div className="border-b border-white/10 p-6">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-tandoori">TikkaXpress</p>
              <h2 className="mt-2 text-2xl font-black">Order summary</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[8px] border border-white/12 bg-white/8 p-3">
                  <Clock className="mb-2 h-4 w-4 text-tandoori" />
                  <div className="text-sm font-black">20-30 min</div>
                </div>
                <div className="rounded-[8px] border border-white/12 bg-white/8 p-3">
                  <ShieldCheck className="mb-2 h-4 w-4 text-tandoori" />
                  <div className="text-sm font-black">Stripe pay</div>
                </div>
              </div>
            </div>
            <div className="p-6">
            <div className="space-y-4">
              {lines.map((line, index) => (
                <div key={`${line.id}-${index}`} className="flex justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="min-w-0">
                    <div className="font-black">{line.quantity}x {line.item.name}</div>
                    <div className="mt-1 text-xs text-white/52">
                      {Object.entries(line.modifiers || {})
                        .map(([label, value]) => `${label}: ${value}`)
                        .join(" · ")}
                    </div>
                  </div>
                  <div className="shrink-0 font-black text-tandoori">{formatMoney(line.lineTotalCents)}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2 text-sm font-semibold text-white/72">
              <SummaryRow label="Subtotal" value={formatMoney(subtotalCents)} />
              {discountCents > 0 && <SummaryRow label="Discount" value={`-${formatMoney(discountCents)}`} />}
              <SummaryRow label="Tax" value={formatMoney(taxCents)} />
              <SummaryRow label="Delivery" value={deliveryFeeCents ? formatMoney(deliveryFeeCents) : "Free"} />
              <SummaryRow label="Tip" value={formatMoney(cart.tipCents || 0)} />
              <div className="flex justify-between border-t border-white/10 pt-4 text-2xl font-black text-white">
                <span>Total</span>
                <span>{formatMoney(totalCents)}</span>
              </div>
            </div>
            <div className="mt-6 rounded-[8px] border border-white/12 bg-white/8 p-4">
              <MapPin className="mb-3 h-5 w-5 text-tandoori" />
              <p className="font-black">{selectedLocation.name}</p>
              <p className="mt-1 text-sm text-white/62">{selectedLocation.address}</p>
              <p className="mt-1 text-sm text-white/62">{selectedLocation.phone}</p>
            </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({ label, className = "", ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-black text-charcoal/70">{label}</span>
      <input {...props} className="mt-2 w-full rounded-[8px] border border-black/10 bg-cream px-4 py-3 outline-none focus:focus-ring" />
    </label>
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
