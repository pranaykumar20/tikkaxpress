"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgePercent, Clock, CreditCard, Flame, Leaf, MapPin, Minus, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Star, Truck, Utensils, X } from "lucide-react";
import { useMemo, useState } from "react";
import { formatMoney, type FulfillmentType, type MenuCategory, type MenuItem } from "@/lib/menu";
import { isMenuItemAvailableNow, isRestaurantOpen, restaurantConfig } from "@/lib/restaurant";

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

export default function Storefront({ initialCategories, initialMenuItems }: { initialCategories: MenuCategory[]; initialMenuItems: MenuItem[] }) {
  const categories = initialCategories;
  const menuItems = initialMenuItems;
  const now = useMemo(() => new Date(), []);
  const orderingOpen = isRestaurantOpen(now);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("pickup");
  const [activeCategory, setActiveCategory] = useState("curries");
  const [filter, setFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [draftModifiers, setDraftModifiers] = useState<Record<string, string>>({});
  const [draftNotes, setDraftNotes] = useState("");
  const [draftQuantity, setDraftQuantity] = useState(1);

  const availableCategories = useMemo(() => {
    return categories.filter((category) => menuItems.some((item) => item.categoryId === category.id && isMenuItemAvailableNow(item, now)));
  }, [categories, menuItems, now]);

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
      const item = menuItems.find((menuItem) => menuItem.id === line.id)!;
      return {
        ...line,
        item,
        lineTotalCents: item.priceCents * line.quantity
      };
    });
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
        fulfillmentType,
        promoCode,
        tipCents: 0,
        items: cart
      })
    );
  }

  return (
    <main className="max-w-[100vw] overflow-hidden">
      <header className="sticky top-0 z-40 border-b border-black/8 bg-cream/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="TikkaXpress home">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-tandoori shadow-glow ring-4 ring-tandoori/12 sm:h-12 sm:w-12">
              <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-black tracking-tight sm:text-xl">TikkaXpress</span>
              <span className="hidden text-xs font-semibold uppercase tracking-[0.24em] text-charcoal/60 sm:block">Indian Kitchen</span>
            </span>
          </Link>
          <nav className="hidden items-center rounded-full border border-black/8 bg-white/70 p-1 text-sm font-bold text-charcoal/70 shadow-card md:flex">
            <a className="rounded-full px-4 py-2 transition hover:bg-cream hover:text-ink" href="#menu">Menu</a>
            <a className="rounded-full px-4 py-2 transition hover:bg-cream hover:text-ink" href="#specials">Specials</a>
            <a className="rounded-full px-4 py-2 transition hover:bg-cream hover:text-ink" href="#visit">Visit</a>
            <Link className="rounded-full px-4 py-2 transition hover:bg-cream hover:text-ink" href="/admin">Admin</Link>
          </nav>
          <a href="#menu" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-black text-white shadow-card transition hover:-translate-y-0.5 hover:bg-charcoal sm:px-5">
            <ShoppingBag className="h-4 w-4 text-tandoori" />
            <span className="hidden sm:inline">Order Now</span>
          </a>
        </div>
      </header>

      <section className="relative w-full overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 opacity-20 spice-pattern" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-tandoori/18 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:min-h-[760px] lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:px-8">
          <div className="relative z-10 min-w-0 max-w-2xl">
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-bold text-orange-100 shadow-card backdrop-blur-xl">
              <Clock className="h-4 w-4 text-tandoori" />
              <span className="truncate">Monday-Friday lunch special, 11 AM-3 PM</span>
            </div>
            <h1 className="max-w-full break-words [font-family:var(--font-display)] text-4xl font-black leading-[1.02] tracking-normal text-white sm:text-7xl sm:leading-[0.95]">
              Indian comfort food,
              <span className="block">made express.</span>
            </h1>
            <p className="mt-6 max-w-xl break-words text-lg leading-8 text-white/78">
              Rich curries, fragrant biryani, warm naan, and weekday lunch combos from TikkaXpress Northside. Order pickup or delivery with a checkout that feels fast and secure.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#menu" className="inline-flex items-center justify-center gap-2 rounded-full bg-tandoori px-7 py-4 text-base font-black text-ink shadow-glow transition hover:-translate-y-0.5 hover:bg-orange-300">
                <ShoppingBag className="h-5 w-5" />
                Start Order
              </a>
              <a href="#specials" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 text-base font-black text-white backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/16">
                <Star className="h-5 w-5" />
                View Specials
              </a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["20-30", "min prep"],
                ["4.8", "guest rating"],
                ["Stripe", "secure pay"]
              ].map(([value, label]) => (
                <div key={label} className="rounded-[8px] border border-white/12 bg-white/8 p-4 shadow-card backdrop-blur-xl">
                  <div className="text-2xl font-black text-tandoori">{value}</div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/56">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-white/74">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-tandoori" />
                Fresh, server-priced checkout
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2">
                <Leaf className="h-4 w-4 text-tandoori" />
                Veg-friendly filters
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2">
                <Clock className="h-4 w-4 text-tandoori" />
                {orderingOpen ? "Open now" : "Schedule for next opening"}
              </span>
            </div>
          </div>
          <div className="relative z-10 min-w-0">
            <div className="absolute -left-6 -top-6 z-20 hidden rounded-[8px] border border-white/14 bg-white/10 p-4 shadow-glow backdrop-blur-xl md:block">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-tandoori">Live prep</div>
              <div className="mt-1 text-2xl font-black">25 min</div>
            </div>
            <div className="relative z-10 overflow-hidden rounded-[8px] border border-white/12 bg-white/8 p-2 shadow-glow backdrop-blur-xl sm:p-3">
              <Image
                src="/images/tikkaxpress-hero.png"
                alt="TikkaXpress curry, rice, naan, and Indian sides"
                width={1200}
                height={900}
                priority
                className="h-[360px] w-full rounded-[6px] object-cover sm:h-[460px] lg:h-[560px]"
              />
              <div className="absolute bottom-4 left-4 right-4 rounded-[8px] border border-white/70 bg-cream/94 p-4 text-ink shadow-card backdrop-blur-xl sm:bottom-8 sm:left-8 sm:right-8 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-black uppercase tracking-[0.18em] text-ember">Lunch Special</div>
                    <div className="mt-1 text-xl font-black sm:text-2xl">Full Indian feast from $10.99</div>
                  </div>
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-tandoori/14 sm:h-14 sm:w-14">
                    <Utensils className="h-8 w-8 text-tandoori" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="specials" className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-ember">Weekday value</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Signature lunch combos</h2>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-6 text-charcoal/62">Built for quick campus lunches, work breaks, and no-compromise cravings.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex min-h-56 flex-col rounded-[8px] bg-ink p-6 text-white shadow-card">
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-tandoori/16">
              <Flame className="h-7 w-7 text-tandoori" />
            </div>
            <h2 className="text-2xl font-black">Lunch that moves fast</h2>
            <p className="mt-3 text-white/70">Combos include curry, rice, naan, side, and dessert for a complete weekday meal.</p>
          </div>
          <div className="relative flex min-h-56 flex-col overflow-hidden rounded-[8px] bg-tandoori p-6 text-ink shadow-card">
            <Sparkles className="absolute right-5 top-5 h-8 w-8 text-ink/25" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Veg Combo</h3>
            <p className="mt-2 text-5xl font-black">$10.99</p>
            <p className="mt-3 font-semibold">Paneer tikka masala or dal makhani with rice, naan, samosa, and gulab jamun.</p>
          </div>
          <div className="relative flex min-h-56 flex-col overflow-hidden rounded-[8px] border border-black/8 bg-white p-6 text-ink shadow-card">
            <BadgePercent className="absolute right-5 top-5 h-8 w-8 text-tandoori/35" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-ember">Non-Veg Combo</h3>
            <p className="mt-2 text-5xl font-black">$11.99</p>
            <p className="mt-3 font-semibold text-charcoal/75">Butter chicken or chicken tikka masala with Chicken 65, rice, naan, and dessert.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-ember">Social specials</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">What is hot this week</h2>
          </div>
          <a href="https://www.instagram.com/tikkaxpresscincy/" className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-black text-ink shadow-card">
            Follow Instagram
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Lunch Combo", "Monday-Friday, 11 AM-3 PM", "/images/menu/items/veg-lunch.png"],
            ["Indo-Chinese Night", "Chicken 65, Manchuria, and fried rice", "/images/menu/items/chicken-65.png"],
            ["Weekend Biryani", "Limited weekend specials when available", "/images/menu/items/chicken-boneless-biryani.png"]
          ].map(([title, body, image]) => (
            <article key={title} className="food-card overflow-hidden rounded-[8px] border border-black/8 bg-white shadow-card">
              <div className="relative h-48">
                <Image src={image} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm font-semibold text-charcoal/62">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="menu" className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8">
        <div className="min-w-0">
          <div className="mb-6 rounded-[8px] border border-black/8 bg-white/72 p-5 shadow-card backdrop-blur-xl">
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
          </div>

          <div className="mb-5 flex max-w-full gap-2 overflow-x-auto rounded-[8px] bg-cream/80 p-2 shadow-card [scrollbar-width:none]">
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

          <div className="mb-6 rounded-[8px] border border-black/8 bg-white p-3 shadow-card">
            <label className="flex items-center gap-3 rounded-[8px] bg-cream px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-charcoal/45" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search curries, biryani, naan, wings..."
                className="w-full bg-transparent text-sm font-bold outline-none"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["all", "Lunch Special", "Vegetarian", "Chicken", "Lamb", "Spicy", "Gluten Free"] as Filter[]).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFilter(tag)}
                  className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                    filter === tag ? "border-ink bg-ink text-white" : "border-black/10 bg-white text-charcoal/60"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid items-stretch gap-5 md:grid-cols-2">
            {visibleItems.map((item) => (
              <article key={item.id} className="food-card group flex h-full flex-col overflow-hidden rounded-[8px] border border-black/8 shadow-card transition hover:-translate-y-1 hover:border-tandoori/35 hover:shadow-glow">
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
                      <p className="mt-2 min-h-24 text-sm leading-6 text-charcoal/70">{item.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-curry ring-1 ring-tandoori/12">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className="mt-auto flex w-full items-center justify-center gap-2 rounded-[8px] bg-ink px-4 py-3 font-black text-white transition hover:bg-tandoori hover:text-ink"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-[8px] border border-black/8 bg-white shadow-card">
            <div className="bg-ink p-5 text-white">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-black">Your order</h2>
                  <p className="text-sm font-semibold capitalize text-white/58">{fulfillmentType} · {cart.length} items</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10">
                  <ShoppingBag className="h-6 w-6 text-tandoori" />
                </div>
              </div>
              <div className="rounded-[8px] border border-white/12 bg-white/8 p-3 text-sm font-semibold text-white/70">
                Secure Stripe checkout, server-side menu pricing, pickup or delivery.
              </div>
            </div>

            <div className="p-5">
              {cartDetails.lines.length === 0 ? (
                <div className="rounded-[8px] border border-dashed border-tandoori/35 bg-cream p-6 text-center">
                  <p className="font-black">Your cart is ready.</p>
                  <p className="mt-2 text-sm text-charcoal/65">Add a lunch combo or curry to begin.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartDetails.lines.map((line, index) => (
                    <div key={`${line.id}-${index}`} className="rounded-[8px] border border-black/8 bg-cream/55 p-3">
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
              className="mt-2 w-full rounded-[8px] border border-black/10 bg-cream px-4 py-3 font-bold outline-none focus:focus-ring"
            />

            <div className="mt-5 space-y-2 rounded-[8px] bg-cream p-4 text-sm font-semibold">
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
              onClick={persistCart}
              aria-disabled={cart.length === 0}
              className={`mt-5 flex w-full items-center justify-center gap-2 rounded-[8px] px-5 py-4 font-black ${
                cart.length === 0 ? "pointer-events-none bg-charcoal/20 text-charcoal/45" : "bg-tandoori text-ink shadow-glow hover:bg-orange-300"
              }`}
            >
              <CreditCard className="h-5 w-5" />
              Checkout
            </Link>
            <p className="mt-3 text-center text-xs font-bold text-charcoal/50">Pay securely with Stripe</p>
            </div>
          </div>
        </aside>
      </section>

      <section id="visit" className="relative bg-ink px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-15 spice-pattern" />
        <div className="relative mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-tandoori">Visit Northside</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">4110 Hamilton Ave, Cincinnati, OH</h2>
            <p className="mt-4 max-w-xl text-white/70">Order ahead for pickup, schedule delivery, or stop by for weekday lunch specials.</p>
          </div>
          <div className="space-y-3">
            <iframe
              title="TikkaXpress location map"
              src={restaurantConfig.mapsEmbedUrl}
              className="min-h-72 w-full rounded-[8px] border border-white/12 bg-white/8 shadow-card"
              loading="lazy"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [MapPin, "Northside", "Cincinnati, OH"],
                [Clock, "Hours", `${restaurantConfig.openHour} AM-${restaurantConfig.closeHour - 12} PM`],
                [Truck, "Delivery", "Restaurant-managed"]
              ].map(([Icon, title, body]) => (
                <div key={String(title)} className="rounded-[8px] border border-white/12 bg-white/8 p-5 shadow-card backdrop-blur-xl">
                  <Icon className="mb-5 h-7 w-7 text-tandoori" />
                  <div className="font-black">{String(title)}</div>
                  <div className="mt-1 text-sm text-white/62">{String(body)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
        <a href="#menu" className="flex items-center justify-between gap-4 rounded-full bg-ink px-5 py-4 text-white shadow-glow ring-1 ring-white/12">
          <span className="font-black">{cart.length} items</span>
          <span className="truncate font-black">{formatMoney(cartDetails.totalCents)} · View cart</span>
        </a>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-black/55 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[8px] bg-white shadow-glow sm:rounded-[8px]">
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
                    className="mt-2 w-full rounded-[8px] border border-black/10 bg-cream px-4 py-3 font-bold outline-none focus:focus-ring"
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
                  className="mt-2 w-full rounded-[8px] border border-black/10 bg-cream px-4 py-3 outline-none focus:focus-ring"
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
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] bg-tandoori px-5 py-4 font-black text-ink shadow-glow sm:flex-none"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Add {formatMoney(selectedItem.priceCents * draftQuantity)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
