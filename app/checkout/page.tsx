"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, Globe, Lock, Mail, MapPin, Phone, ShoppingBag, Truck, User } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import CheckoutHeader from "@/components/CheckoutHeader";
import ToastCheckout from "@/components/ToastCheckout";
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

type CheckoutSession = {
  orderId: string;
  paymentIntentId?: string;
  sessionSecret?: string;
  checkoutUrl?: string | null;
  demo?: boolean;
  payAtStore?: boolean;
  amountCents?: number;
};

function formatHoursLabel() {
  const open = restaurantConfig.openHour;
  const close = restaurantConfig.closeHour;
  const fmt = (hour: number) => {
    const h = hour % 12 || 12;
    const meridiem = hour >= 12 ? "PM" : "AM";
    return `${h}:00 ${meridiem}`;
  };
  return `Mon – Sun: ${fmt(open)} – ${fmt(close)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [cart, setCart] = useState<SavedCart>({ fulfillmentType: "pickup", items: [], tipCents: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "store">("online");
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  const [checkoutNow, setCheckoutNow] = useState(() => new Date());
  const orderTimeOptions = useMemo(() => getOrderTimeOptions(checkoutNow), [checkoutNow]);
  const selectedLocation = findRestaurantLocation(cart.locationId);

  useEffect(() => {
    setCheckoutNow(new Date());
    const saved = localStorage.getItem("tikkaxpress-cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  const lines = useMemo(() => {
    return cart.items
      .map((line) => {
        const item = menuItems.find((menuItem) => menuItem.id === line.id);
        if (!item) return null;
        return { ...line, item, lineTotalCents: item.priceCents * line.quantity };
      })
      .filter((line): line is CartLine & { item: (typeof menuItems)[number]; lineTotalCents: number } => Boolean(line));
  }, [cart.items]);

  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const discountCents = cart.promoCode?.trim().toUpperCase() === "LUNCH10" ? Math.round(subtotalCents * 0.1) : 0;
  const taxCents = Math.round(Math.max(0, subtotalCents - discountCents) * restaurantConfig.taxRate);
  const deliveryFeeCents = cart.fulfillmentType === "delivery" ? restaurantConfig.deliveryFeeCents : 0;
  const totalCents = subtotalCents - discountCents + taxCents + deliveryFeeCents + (cart.tipCents || 0);
  const canCheckout = lines.length > 0 && totalCents > 0;

  function getCustomerFromForm() {
    if (!formRef.current) throw new Error("Checkout form is not ready.");
    const form = new FormData(formRef.current);
    return {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      address: form.get("address") ? String(form.get("address")) : undefined,
      scheduledTime: form.get("scheduledTime") ? String(form.get("scheduledTime")) : "ASAP",
      notes: form.get("notes") ? String(form.get("notes")) : undefined
    };
  }

  async function submitCheckout(event?: FormEvent, method: "online" | "store" = paymentMethod) {
    event?.preventDefault();
    if (!canCheckout) {
      setError("Add at least one item before checkout.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const customer = getCustomerFromForm();
      const response = await fetch("/api/checkout/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cart,
          locationId: selectedLocation.id,
          paymentMethod: method,
          customer
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to start checkout.");

      if (payload.payAtStore) {
        router.push(`/order/success?order_id=${payload.orderId}`);
        return;
      }

      setCheckoutSession(payload);

      if (payload.demo) {
        const complete = await fetch("/api/checkout/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: payload.orderId, paymentIntentId: payload.paymentIntentId })
        });
        const completePayload = await complete.json();
        if (!complete.ok) throw new Error(completePayload.error || "Payment could not be completed.");
        router.push(`/order/success?order_id=${completePayload.orderId || payload.orderId}`);
        return;
      }

      if (!payload.checkoutUrl) {
        throw new Error("Toast checkout could not be loaded.");
      }
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to complete checkout.");
      setCheckoutSession(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <CheckoutHeader cartCount={cartCount} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          <form ref={formRef} onSubmit={(event) => submitCheckout(event, "online")} className="surface-card overflow-hidden">
            <div className="bg-ink px-6 py-8 sm:px-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-tandoori">Secure checkout</p>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Confirm your order</h1>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <IconField name="name" label="Full name" icon={<User className="h-4 w-4" />} placeholder="Full name" required />
                <IconField name="phone" label="Phone number" icon={<Phone className="h-4 w-4" />} placeholder="513-555-0100" required />
              </div>

              <IconField
                name="email"
                label="Email address"
                type="email"
                icon={<Mail className="h-4 w-4" />}
                placeholder="you@example.com"
                required
              />

              <div>
                <p className="mb-3 text-sm font-black text-charcoal/70">Order type</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["pickup", "delivery"] as FulfillmentType[]).map((type) => {
                    const selected = cart.fulfillmentType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCart((current) => ({ ...current, fulfillmentType: type }))}
                        className={`relative rounded-2xl border-2 p-5 text-left transition ${
                          selected ? "border-tandoori bg-orange-50/60" : "border-black/10 bg-white hover:border-black/20"
                        }`}
                      >
                        {selected && (
                          <span className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-tandoori text-ink">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        )}
                        {type === "delivery" ? (
                          <Truck className={`mb-3 h-6 w-6 ${selected ? "text-tandoori" : "text-charcoal/45"}`} />
                        ) : (
                          <ShoppingBag className={`mb-3 h-6 w-6 ${selected ? "text-tandoori" : "text-charcoal/45"}`} />
                        )}
                        <span className="block text-lg font-black capitalize text-ink">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-sm font-black text-charcoal/70">Pickup / delivery time</span>
                  <select
                    name="scheduledTime"
                    defaultValue={orderTimeOptions[0]?.value || "ASAP"}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-cream/40 px-4 py-3.5 font-semibold outline-none focus:focus-ring"
                  >
                    {orderTimeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {cart.fulfillmentType === "delivery" && (
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-black text-charcoal/70">Delivery address</span>
                    <input
                      name="address"
                      required
                      placeholder="Street, city, ZIP"
                      className="mt-2 w-full rounded-xl border border-black/10 bg-cream/40 px-4 py-3.5 font-semibold outline-none focus:focus-ring"
                    />
                  </label>
                )}
              </div>

              <details className="rounded-xl border border-black/8 bg-cream/30 p-4">
                <summary className="cursor-pointer text-sm font-black text-charcoal/70">Add order notes or choose location</summary>
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="text-sm font-black text-charcoal/70">Ordering location</span>
                    <select
                      id="locationId"
                      value={selectedLocation.id}
                      onChange={(event) => setCart((current) => ({ ...current, locationId: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-semibold outline-none focus:focus-ring"
                    >
                      {restaurantLocations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.shortName} - {location.address}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-black text-charcoal/70">Order notes</span>
                    <textarea
                      name="notes"
                      rows={3}
                      placeholder="Allergies, spice notes, utensils..."
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:focus-ring"
                    />
                  </label>
                  <div>
                    <span className="text-sm font-black text-charcoal/70">Tip</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[0, 200, 400, 600].map((tip) => (
                        <button
                          key={tip}
                          type="button"
                          onClick={() => setCart((current) => ({ ...current, tipCents: tip }))}
                          className={`rounded-full px-4 py-2 text-sm font-black ${cart.tipCents === tip ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-black/10"}`}
                        >
                          {tip === 0 ? "No tip" : formatMoney(tip)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </details>

              {paymentMethod === "online" && (
                <ToastCheckout
                  orderId={checkoutSession?.orderId}
                  paymentIntentId={checkoutSession?.paymentIntentId}
                  sessionSecret={checkoutSession?.sessionSecret}
                  checkoutUrl={checkoutSession?.checkoutUrl}
                  demo={checkoutSession?.demo ?? true}
                  amountLabel={formatMoney(checkoutSession?.amountCents || totalCents)}
                  loading={loading}
                  liveReady={Boolean(checkoutSession && !checkoutSession.demo && checkoutSession.checkoutUrl)}
                  onPay={() => submitCheckout(undefined, "online")}
                />
              )}

              {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

              <div className="flex flex-col gap-3 border-t border-black/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod((current) => (current === "online" ? "store" : "online"));
                    setCheckoutSession(null);
                  }}
                  className="text-sm font-bold text-charcoal/55 underline-offset-2 hover:text-ink hover:underline"
                >
                  {paymentMethod === "online" ? "Pay at store instead" : "Pay online with Toast instead"}
                </button>

                {paymentMethod === "store" && (
                  <button
                    type="button"
                    disabled={loading || !canCheckout}
                    onClick={() => submitCheckout(undefined, "store")}
                    className="rounded-xl bg-ink px-6 py-3.5 font-black text-white transition hover:bg-charcoal disabled:opacity-50"
                  >
                    {loading ? "Placing order..." : "Place order — pay at store"}
                  </button>
                )}
              </div>
            </div>
          </form>

          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="overflow-hidden rounded-3xl bg-ink text-white shadow-card">
              <div className="border-b border-white/10 p-6">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-tandoori">TikkaXpress</p>
                <h2 className="mt-2 text-2xl font-black">Order summary</h2>
              </div>

              <div className="p-6">
                <div className="space-y-5">
                  {lines.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-sm font-semibold text-white/65">
                      Your cart is empty. <Link href="/" className="text-tandoori underline">Return to menu</Link>
                    </div>
                  ) : (
                    lines.map((line, index) => (
                      <div key={`${line.id}-${index}`} className="flex justify-between gap-4 border-b border-white/10 pb-4">
                        <div className="min-w-0">
                          <div className="font-black">
                            {line.quantity}x {line.item.name}
                          </div>
                          {line.modifiers && Object.keys(line.modifiers).length > 0 && (
                            <div className="mt-1 text-xs font-semibold text-white/50">
                              {Object.values(line.modifiers).join(", ")}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 font-black text-tandoori">{formatMoney(line.lineTotalCents)}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 space-y-2.5 text-sm font-semibold text-white/72">
                  <SummaryRow label="Subtotal" value={formatMoney(subtotalCents)} />
                  {discountCents > 0 && <SummaryRow label="Discount" value={`-${formatMoney(discountCents)}`} />}
                  <SummaryRow label="Tax" value={formatMoney(taxCents)} />
                  {deliveryFeeCents > 0 && <SummaryRow label="Delivery" value={formatMoney(deliveryFeeCents)} />}
                  <SummaryRow label="Tip" value={formatMoney(cart.tipCents || 0)} />
                  <div className="flex justify-between border-t border-white/10 pt-4 text-3xl font-black text-white">
                    <span>Total</span>
                    <span>{formatMoney(totalCents)}</span>
                  </div>
                </div>

                <p className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-white/45">
                  <Lock className="h-3.5 w-3.5" />
                  Secure checkout powered by Toast
                </p>
              </div>
            </div>

            <div className="mt-4 surface-card overflow-hidden p-5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-tandoori" />
                <div>
                  <p className="font-black text-ink">{selectedLocation.name}</p>
                  <p className="mt-1 text-sm font-semibold text-charcoal/60">{selectedLocation.address}</p>
                  <p className="mt-1 text-sm font-semibold text-charcoal/60">{selectedLocation.phone}</p>
                  <a href="https://tikkaxpress.com" className="mt-2 inline-flex items-center gap-1 text-sm font-black text-tandoori">
                    <Globe className="h-3.5 w-3.5" />
                    tikkaxpress.com
                  </a>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-3 border-t border-black/8 pt-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-tandoori" />
                <div>
                  <p className="text-sm font-black text-ink">Hours</p>
                  <p className="mt-1 text-sm font-semibold text-charcoal/60">{formatHoursLabel()}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function IconField({
  label,
  icon,
  className = "",
  ...props
}: {
  label: string;
  icon: React.ReactNode;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-black text-charcoal/70">{label}</span>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/35">{icon}</span>
        <input
          {...props}
          className="w-full rounded-xl border border-black/10 bg-cream/40 py-3.5 pl-10 pr-4 font-semibold outline-none focus:focus-ring"
        />
      </div>
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
