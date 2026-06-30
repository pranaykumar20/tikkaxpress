"use client";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import Image from "next/image";
import Link from "next/link";
import { CreditCard, MapPin, Minus, Plus, Search, ShoppingBag, Truck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatMoney, type FulfillmentType, type MenuCategory, type MenuItem } from "@/lib/menu";
import type { SavedCart } from "@/lib/cart-storage";
import { defaultRestaurantLocation, isMenuItemAvailableNow, restaurantConfig } from "@/lib/restaurant";

export type CartLine = {
  id: string;
  quantity: number;
  modifiers?: Record<string, string>;
  notes?: string;
};

type Filter = "all" | "Vegetarian" | "Chicken" | "Lamb" | "Spicy" | "Gluten Free" | "Lunch Special";

function spiceText(level: number) {
  if (level === 0) return "Mild";
  if (level === 1) return "Warm";
  if (level === 2) return "Spicy";
  return "Fire";
}

function sameLine(a: CartLine, b: CartLine) {
  return a.id === b.id && JSON.stringify(a.modifiers || {}) === JSON.stringify(b.modifiers || {}) && (a.notes || "") === (b.notes || "");
}

function displayTag(tag: string) {
  if (tag === "Popular") return "Customer Favorite";
  if (tag === "Lunch Special") return "Lunch Deal";
  return tag;
}

function defaultActiveCategory(categories: MenuCategory[], menuItems: MenuItem[], now = new Date()) {
  const available = categories.filter((category) =>
    menuItems.some((item) => item.categoryId === category.id && isMenuItemAvailableNow(item, now))
  );
  return available.find((category) => category.id === "curries")?.id ?? available[0]?.id ?? categories[0]?.id ?? "curries";
}

export default function Storefront({
  initialCategories,
  initialMenuItems
}: {
  initialCategories: MenuCategory[];
  initialMenuItems: MenuItem[];
}) {
  const categories = initialCategories;
  const menuItems = initialMenuItems;
  const now = useMemo(() => new Date(), []);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("pickup");
  const [activeCategory, setActiveCategory] = useState(() => defaultActiveCategory(initialCategories, initialMenuItems));
  const [filter, setFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [draftModifiers, setDraftModifiers] = useState<Record<string, string>>({});
  const [draftNotes, setDraftNotes] = useState("");
  const [draftQuantity, setDraftQuantity] = useState(1);
  const selectedLocation = defaultRestaurantLocation;

  useEffect(() => {
    const savedCart = localStorage.getItem("tikkaxpress-cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart) as SavedCart;
        if (Array.isArray(parsed.items)) setCart(parsed.items);
        if (parsed.fulfillmentType) setFulfillmentType(parsed.fulfillmentType);
        if (parsed.promoCode) setPromoCode(parsed.promoCode);
      } catch {
        localStorage.removeItem("tikkaxpress-cart");
      }
    }
  }, []);

  useEffect(() => {
    function handleCartUpdated(event: Event) {
      const detail = (event as CustomEvent<SavedCart>).detail;
      if (!detail?.items) return;
      setCart(detail.items);
      if (detail.fulfillmentType) setFulfillmentType(detail.fulfillmentType);
      if (detail.promoCode) setPromoCode(detail.promoCode);
    }

    window.addEventListener("tikkaxpress-cart-updated", handleCartUpdated);
    return () => window.removeEventListener("tikkaxpress-cart-updated", handleCartUpdated);
  }, []);

  const availableCategories = useMemo(() => {
    return categories.filter((category) => menuItems.some((item) => item.categoryId === category.id && isMenuItemAvailableNow(item, now)));
  }, [categories, menuItems, now]);

  useEffect(() => {
    if (availableCategories.length === 0) return;
    if (!availableCategories.some((category) => category.id === activeCategory)) {
      setActiveCategory(availableCategories[0].id);
    }
  }, [activeCategory, availableCategories]);

  const visibleItems = useMemo(() => {
    return menuItems.filter((item) => {
      const categoryMatch = item.categoryId === activeCategory;
      const query = searchQuery.trim().toLowerCase();
      const searchMatch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query));
      const filterMatch =
        filter === "all" ||
        item.tags.includes(filter) ||
        (filter === "Chicken" && item.name.toLowerCase().includes("chicken")) ||
        (filter === "Lamb" && item.name.toLowerCase().includes("lamb")) ||
        (filter === "Spicy" && item.spiceLevel >= 2) ||
        (filter === "Gluten Free" && item.tags.includes("Gluten Free"));
      return isMenuItemAvailableNow(item, now) && categoryMatch && filterMatch && searchMatch;
    });
  }, [activeCategory, filter, menuItems, now, searchQuery]);

  const cartDetails = useMemo(() => {
    const lines = cart.map((line) => {
      const item = menuItems.find((menuItem) => menuItem.id === line.id);
      if (!item) return null;
      return {
        ...line,
        item,
        lineTotalCents: item.priceCents * line.quantity
      };
    }).filter((line): line is CartLine & { item: MenuItem; lineTotalCents: number } => Boolean(line));
    const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
    const discountCents = promoCode.trim().toUpperCase() === "LUNCH10" ? Math.round(subtotalCents * 0.1) : 0;
    const taxCents = Math.round(Math.max(0, subtotalCents - discountCents) * restaurantConfig.taxRate);
    const deliveryFeeCents = fulfillmentType === "delivery" ? restaurantConfig.deliveryFeeCents : 0;
    const totalCents = subtotalCents - discountCents + taxCents + deliveryFeeCents;
    return { lines, subtotalCents, discountCents, taxCents, deliveryFeeCents, totalCents };
  }, [cart, fulfillmentType, promoCode]);

  function openItem(item: MenuItem) {
    const modifiers = Object.fromEntries((item.options || []).map((option) => [option.label, option.choices[0]]));
    setSelectedItem(item);
    setDraftModifiers(modifiers);
    setDraftNotes("");
    setDraftQuantity(1);
  }

  function addConfiguredItem() {
    if (!selectedItem) return;
    const newLine: CartLine = {
      id: selectedItem.id,
      quantity: draftQuantity,
      modifiers: draftModifiers,
      notes: draftNotes.trim() || undefined
    };
    setCart((current) => {
      const existing = current.find((line) => sameLine(line, newLine));
      if (existing) {
        return current.map((line) => (sameLine(line, newLine) ? { ...line, quantity: line.quantity + draftQuantity, notes: newLine.notes || line.notes } : line));
      }
      return [...current, newLine];
    });
    setSelectedItem(null);
  }

  function adjustItem(index: number, delta: number) {
    setCart((current) =>
      current
        .map((line, lineIndex) => (lineIndex === index ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0)
    );
  }

  function persistCart() {
    localStorage.setItem(
      "tikkaxpress-cart",
      JSON.stringify({
        locationId: selectedLocation.id,
        fulfillmentType,
        promoCode,
        tipCents: 0,
        items: cart
      })
    );
  }

  const cartItemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <main className="max-w-[100vw] overflow-hidden">
      <SiteHeader cartCount={cartItemCount} />

      <section id="menu" className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:gap-8 sm:px-6 sm:pb-24 sm:pt-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8">
        <div className="min-w-0">
          <div className="mb-6 surface-card-soft p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-ember">Build your order</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Menu</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-charcoal/62">Filter fast, add your favorites, and keep your running total visible while you browse.</p>
              </div>
              <div className="flex w-full rounded-full bg-cream p-1 shadow-card sm:w-auto">
                {(["pickup", "delivery"] as FulfillmentType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFulfillmentType(type)}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black capitalize transition sm:flex-none ${
                      fulfillmentType === type ? "bg-ink text-white" : "text-charcoal/70 hover:text-ink"
                    }`}
                  >
                    {type === "delivery" ? <Truck className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-ink bg-ink p-4 text-white shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-black">{selectedLocation.shortName}</div>
                  <div className="mt-1 text-sm font-semibold text-white/62">{selectedLocation.address}</div>
                </div>
                <MapPin className="h-5 w-5 shrink-0 text-tandoori" />
              </div>
              <div className="mt-3 text-sm font-bold text-white/70">{selectedLocation.phone}</div>
            </div>
          </div>

          <div className="mb-5 -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:rounded-2xl sm:bg-cream/80 sm:p-2 sm:shadow-card sm:ring-1 sm:ring-black/[0.04] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {availableCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-black transition ${
                  activeCategory === category.id ? "bg-tandoori text-ink shadow-card" : "bg-white text-charcoal/72 hover:bg-orange-100 hover:text-ink"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="mb-6 surface-card p-3">
            <label className="surface-inset flex items-center gap-3 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-charcoal/45" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search curries, biryani, naan, wings..."
                className="w-full bg-transparent text-sm font-bold outline-none"
              />
            </label>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0">
              {(["all", "Lunch Special", "Vegetarian", "Chicken", "Lamb", "Spicy", "Gluten Free"] as Filter[]).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFilter(tag)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                    filter === tag ? "border-ink bg-ink text-white" : "border-black/10 bg-white text-charcoal/60"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid items-stretch gap-5 md:grid-cols-2">
            {visibleItems.length === 0 ? (
              <div className="md:col-span-2 rounded-2xl border border-dashed border-tandoori/35 bg-cream p-10 text-center">
                <p className="text-xl font-black">No menu items found</p>
                <p className="mt-2 text-sm font-semibold text-charcoal/65">
                  Try another category, clear your search, or check back during restaurant hours.
                </p>
              </div>
            ) : (
              visibleItems.map((item) => (
              <article key={item.id} className="food-card group flex h-full flex-col overflow-hidden rounded-3xl border border-black/6 transition hover:-translate-y-1.5 hover:border-tandoori/30 hover:shadow-glow">
                <div className="relative h-52 overflow-hidden">
                  <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full bg-ink/92 px-3 py-1 text-xs font-black text-white backdrop-blur-xl">
                    {spiceText(item.spiceLevel)}
                  </div>
                  <div className="absolute bottom-3 right-3 rounded-full bg-cream px-3 py-1 text-sm font-black text-ember shadow-card">
                    {formatMoney(item.priceCents)}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black leading-7">{item.name}</h3>
                      <p className="mt-2 min-h-0 text-sm leading-6 text-charcoal/70 md:min-h-24">{item.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-curry ring-1 ring-tandoori/12">
                        {displayTag(tag)}
                      </span>
                    ))}
                    {item.featured && (
                      <span className="rounded-full bg-ink px-3 py-1 text-xs font-black text-white ring-1 ring-tandoori/20">
                        Best Seller
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 font-black text-white transition hover:bg-tandoori hover:text-ink"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </article>
              ))
            )}
          </div>
        </div>

        <aside id="cart-panel" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-black/6 bg-white shadow-card">
            <div className="bg-ink p-5 text-white">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-black">Your order</h2>
                  <p className="text-sm font-semibold capitalize text-white/58">{selectedLocation.shortName} · {fulfillmentType} · {cart.length} items</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10">
                  <ShoppingBag className="h-6 w-6 text-tandoori" />
                </div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 p-3 text-sm font-semibold text-white/70">
                Order from {selectedLocation.shortName}. Secure Toast checkout, server-side menu pricing, pickup or delivery.
              </div>
            </div>

            <div className="p-5">
              {cartDetails.lines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-tandoori/35 bg-cream p-6 text-center">
                  <p className="font-black">Your cart is ready.</p>
                  <p className="mt-2 text-sm text-charcoal/65">Add a lunch combo or curry to begin.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartDetails.lines.map((line, index) => (
                    <div key={`${line.id}-${index}`} className="surface-inset p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-black leading-5">{line.item.name}</div>
                          <div className="mt-1 text-xs font-semibold text-charcoal/55">
                            {Object.entries(line.modifiers || {})
                              .map(([label, value]) => `${label}: ${value}`)
                              .join(" · ")}
                          </div>
                          {line.notes && <div className="mt-1 text-xs font-semibold text-charcoal/55">Note: {line.notes}</div>}
                        </div>
                        <div className="shrink-0 font-black">{formatMoney(line.lineTotalCents)}</div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button type="button" aria-label="Decrease quantity" onClick={() => adjustItem(index, -1)} className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-card">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-black">{line.quantity}</span>
                        <button type="button" aria-label="Increase quantity" onClick={() => adjustItem(index, 1)} className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-card">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            <label className="mt-5 block text-sm font-black text-charcoal/70" htmlFor="promo">
              Promo code
            </label>
            <input
              id="promo"
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              placeholder="Try LUNCH10"
              className="mt-2 w-full rounded-xl border border-black/10 bg-cream px-4 py-3 font-bold outline-none focus:focus-ring"
            />

            <div className="mt-5 space-y-2 surface-inset p-4 text-sm font-semibold">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(cartDetails.subtotalCents)}</span>
              </div>
              {cartDetails.discountCents > 0 && (
                <div className="flex justify-between text-herb">
                  <span>Discount</span>
                  <span>-{formatMoney(cartDetails.discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatMoney(cartDetails.taxCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{cartDetails.deliveryFeeCents ? formatMoney(cartDetails.deliveryFeeCents) : "Free"}</span>
              </div>
              <div className="flex justify-between pt-3 text-xl font-black">
                <span>Total</span>
                <span>{formatMoney(cartDetails.totalCents)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              onClick={(event) => {
                if (cart.length === 0) {
                  event.preventDefault();
                  return;
                }
                persistCart();
              }}
              aria-disabled={cart.length === 0}
              tabIndex={cart.length === 0 ? -1 : 0}
              className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 font-black ${
                cart.length === 0 ? "pointer-events-none bg-charcoal/20 text-charcoal/45" : "bg-tandoori text-ink shadow-glow hover:bg-orange-300"
              }`}
            >
              <CreditCard className="h-5 w-5" />
              Checkout
            </Link>
            <p className="mt-3 text-center text-xs font-bold text-charcoal/50">Pay securely with Toast</p>
            </div>
          </div>
        </aside>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink/95 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => document.getElementById("cart-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="safe-bottom flex w-full items-center justify-between gap-4 px-4 py-3 text-white"
        >
          <span className="font-black">{cartItemCount} items</span>
          <span className="truncate font-black">{formatMoney(cartDetails.totalCents)} · View cart</span>
        </button>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-black/55 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-glow sm:rounded-3xl">
            <div className="relative h-64 overflow-hidden">
              <Image src={selectedItem.image} alt={selectedItem.name} fill sizes="100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <button
                type="button"
                aria-label="Close item details"
                onClick={() => setSelectedItem(null)}
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-card"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-tandoori">{spiceText(selectedItem.spiceLevel)}</div>
                <h2 className="mt-1 text-3xl font-black">{selectedItem.name}</h2>
                <p className="mt-2 text-sm font-semibold text-white/74">{selectedItem.description}</p>
              </div>
            </div>
            <div className="space-y-5 p-5">
              {(selectedItem.options || []).map((option) => (
                <label key={option.label} className="block">
                  <span className="text-sm font-black text-charcoal/70">{option.label}</span>
                  <select
                    value={draftModifiers[option.label] || option.choices[0]}
                    onChange={(event) => setDraftModifiers((current) => ({ ...current, [option.label]: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-cream px-4 py-3 font-bold outline-none focus:focus-ring"
                  >
                    {option.choices.map((choice) => (
                      <option key={choice} value={choice}>
                        {choice}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <label className="block">
                <span className="text-sm font-black text-charcoal/70">Special instructions</span>
                <textarea
                  value={draftNotes}
                  onChange={(event) => setDraftNotes(event.target.value)}
                  rows={3}
                  placeholder="Allergies, spice notes, no onions..."
                  className="mt-2 w-full rounded-xl border border-black/10 bg-cream px-4 py-3 outline-none focus:focus-ring"
                />
              </label>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setDraftQuantity((value) => Math.max(1, value - 1))} className="grid h-10 w-10 place-items-center rounded-full bg-cream shadow-card">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-lg font-black">{draftQuantity}</span>
                  <button type="button" onClick={() => setDraftQuantity((value) => Math.min(20, value + 1))} className="grid h-10 w-10 place-items-center rounded-full bg-cream shadow-card">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={addConfiguredItem}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-tandoori px-5 py-4 font-black text-ink shadow-glow sm:flex-none"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Add {formatMoney(selectedItem.priceCents * draftQuantity)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <SiteFooter offsetMobileCart />
    </main>
  );
}
