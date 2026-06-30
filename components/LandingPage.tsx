import HeroImageCarousel from "@/components/HeroImageCarousel";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import Image from "next/image";
import Link from "next/link";
import {
  BadgePercent,
  Clock,
  Flame,
  Gift,
  Leaf,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star
} from "lucide-react";
import { defaultRestaurantLocation, isRestaurantOpen, restaurantConfig } from "@/lib/restaurant";

export default function LandingPage() {
  const now = new Date();
  const orderingOpen = isRestaurantOpen(now);
  const selectedLocation = defaultRestaurantLocation;

  return (
    <main className="max-w-[100vw] overflow-hidden">
      <SiteHeader />

      <section className="bg-tandoori px-4 py-3 text-ink sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-black">
              <Gift className="h-5 w-5 shrink-0" />
              <span>Order Direct & Save</span>
            </div>
            <p className="mt-1 text-xs font-semibold leading-5 text-ink/85 sm:text-sm">
              Pickup or delivery · Fresh Indian food · Order direct from TikkaXpress
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href="/menu" className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm text-white">
              Order Pickup
            </Link>
            <a href={`tel:${selectedLocation.phone.replace(/[^+\d]/g, "")}`} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-4 py-2 text-sm">
              <Phone className="h-4 w-4" />
              Call
            </a>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLocation.address)}`} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-4 py-2 text-sm">
              <Navigation className="h-4 w-4" />
              Directions
            </a>
            <a href="#specials" className="shrink-0 rounded-full bg-white px-4 py-2 text-sm">
              Lunch $10.99
            </a>
          </div>
        </div>
      </section>

      <section className="relative w-full overflow-hidden bg-cream text-ink">
        <Image
          src="/images/tikkaxpress-mural.png"
          alt="TikkaXpress mural with Indian and Cincinnati landmarks"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cream/96 via-cream/82 to-cream/28" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream/92 via-cream/20 to-white/72" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-cream to-transparent" />
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14 lg:min-h-[680px] lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:px-8">
          <div className="relative z-10 min-w-0 max-w-2xl">
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-black/10 bg-white/88 px-3 py-2 text-xs font-bold text-charcoal shadow-card backdrop-blur-xl sm:mb-5 sm:px-4 sm:text-sm">
              <Clock className="h-4 w-4 shrink-0 text-tandoori" />
              <span>Mon–Fri lunch special, 11 AM–3 PM</span>
            </div>
            <h1 className="max-w-full [font-family:var(--font-display)]">
              <span className="block text-[2rem] font-black leading-[0.98] tracking-[-0.025em] text-ink min-[390px]:text-[2.15rem] sm:text-[2.65rem] lg:text-[4.35rem]">
                Indian comfort food,
              </span>
              <span className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0 sm:mt-4 sm:gap-x-3 lg:gap-x-4">
                <span className="text-[1.65rem] font-medium italic leading-none tracking-[-0.01em] text-charcoal/72 min-[390px]:text-[1.85rem] sm:text-[2.35rem] lg:text-[3.15rem]">
                  made
                </span>
                <span className="relative inline-block text-[2rem] font-black leading-none tracking-[-0.03em] min-[390px]:text-[2.15rem] sm:text-[2.65rem] lg:text-[4.35rem]">
                  <span className="bg-gradient-to-r from-ember via-tandoori to-curry bg-clip-text text-transparent">
                    express.
                  </span>
                  <span
                    className="absolute -bottom-0.5 left-0 h-1 w-[88%] rounded-full bg-gradient-to-r from-tandoori via-ember/70 to-transparent sm:-bottom-1.5 sm:h-1.5"
                    aria-hidden
                  />
                </span>
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-charcoal/78 sm:mt-6 sm:text-lg sm:leading-8">
              Rich curries, fragrant biryani, warm naan, and weekday lunch combos from TikkaXpress Northside. Order pickup or delivery with secure checkout.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <Link href="/menu" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-tandoori px-7 py-4 text-base font-black text-ink shadow-glow transition hover:-translate-y-0.5 hover:bg-orange-300 sm:w-auto">
                <ShoppingBag className="h-5 w-5" />
                Start Order
              </Link>
              <a href="#specials" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/12 bg-white/88 px-7 py-4 text-base font-black text-ink shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white sm:w-auto">
                <Star className="h-5 w-5 text-tandoori" />
                View Specials
              </a>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-2 sm:mt-10 sm:gap-3">
              {[
                ["20-30", "min prep"],
                ["4.8", "guest rating"],
                ["Toast", "secure pay"]
              ].map(([value, label]) => (
                <div key={label} className="surface-card-soft p-3 transition duration-300 sm:p-4">
                  <div className="text-lg font-black text-tandoori sm:text-2xl">{value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-charcoal/56 sm:text-xs sm:tracking-[0.18em]">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-charcoal/74">
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/88 px-4 py-2 shadow-card backdrop-blur-xl">
                <ShieldCheck className="h-4 w-4 text-tandoori" />
                Fresh, server-priced checkout
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/88 px-4 py-2 shadow-card backdrop-blur-xl">
                <Leaf className="h-4 w-4 text-tandoori" />
                Veg-friendly filters
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/88 px-4 py-2 shadow-card backdrop-blur-xl">
                <Clock className="h-4 w-4 text-tandoori" />
                {orderingOpen ? "Open now" : "Schedule for next opening"}
              </span>
            </div>
          </div>
          <div className="relative z-10 min-w-0">
            <HeroImageCarousel />
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
          <div className="flex min-h-56 flex-col rounded-3xl bg-ink p-6 text-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-lift">
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-tandoori/16">
              <Flame className="h-7 w-7 text-tandoori" />
            </div>
            <h2 className="text-2xl font-black">Lunch that moves fast</h2>
            <p className="mt-3 text-white/70">Combos include curry, rice, naan, side, and dessert for a complete weekday meal.</p>
          </div>
          <div className="relative flex min-h-56 flex-col overflow-hidden rounded-3xl bg-tandoori p-6 text-ink shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-glow">
            <Sparkles className="absolute right-5 top-5 h-8 w-8 text-ink/25" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Veg Combo</h3>
            <p className="mt-2 text-5xl font-black">$10.99</p>
            <p className="mt-3 font-semibold">Paneer tikka masala or dal makhani with rice, naan, samosa, and gulab jamun.</p>
          </div>
          <div className="relative flex min-h-56 flex-col overflow-hidden rounded-3xl border border-black/6 bg-white p-6 text-ink shadow-card transition duration-300 hover:-translate-y-1 hover:border-tandoori/25 hover:shadow-card-lift">
            <BadgePercent className="absolute right-5 top-5 h-8 w-8 text-tandoori/35" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-ember">Non-Veg Combo</h3>
            <p className="mt-2 text-5xl font-black">$11.99</p>
            <p className="mt-3 font-semibold text-charcoal/75">Butter chicken or chicken tikka masala with Chicken 65, rice, naan, and dessert.</p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link href="/menu" className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-4 text-base font-black text-white shadow-card transition hover:-translate-y-0.5 hover:bg-charcoal">
            <ShoppingBag className="h-5 w-5 text-tandoori" />
            Order from the menu
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-ember">Social specials</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">What is hot this week</h2>
          </div>
          <a
            href="https://www.instagram.com/tikkaxpresscincy/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#FCAF45] px-6 py-3.5 text-sm font-black text-white shadow-[0_14px_36px_rgba(225,48,108,0.32)] ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:brightness-105 sm:w-auto"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 shrink-0 fill-current">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            Follow Instagram
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Lunch Combo", "Monday-Friday, 11 AM-3 PM", "/images/menu/items/veg-lunch.png"],
            ["Indo-Chinese Night", "Chicken 65, Manchurian, and fried rice", "/images/menu/items/chicken-65.png"],
            ["Weekend Biryani", "Limited weekend specials when available", "/images/menu/items/chicken-boneless-biryani.png"]
          ].map(([title, body, image]) => (
            <article key={title} className="food-card group overflow-hidden rounded-3xl border border-black/6 hover:-translate-y-1">
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

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="surface-card p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-ember">Google reviews</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Customer favorites</h2>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-cream px-4 py-2 font-black text-ink">
              <Star className="h-4 w-4 fill-tandoori text-tandoori" />
              4.8
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ["A.P.", "Butter chicken, garlic naan, and mango lassi are always fresh."],
              ["M.K.", "Fast pickup and the lunch combo is a great deal."],
              ["J.S.", "Chicken tikka masala has become my regular order."]
            ].map(([name, review]) => (
              <article key={name} className="surface-inset p-4 transition duration-300 hover:-translate-y-0.5">
                <div className="mb-3 flex gap-1 text-tandoori">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm font-semibold leading-6 text-charcoal/70">{review}</p>
                <p className="mt-3 text-sm font-black">{name}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-ink p-6 text-white shadow-card">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-tandoori">Deals list</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Get $5 off next pickup order</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/64">Join for pickup promos, birthday coupons, lunch reminders, and loyalty rewards.</p>
          <div className="mt-5 grid gap-3">
            <input aria-label="Email signup" placeholder="Email address" className="rounded-xl border border-white/12 bg-white px-4 py-3 font-bold text-ink outline-none transition focus:ring-2 focus:ring-tandoori/40" />
            <input aria-label="SMS signup" placeholder="Mobile number for SMS deals" className="rounded-xl border border-white/12 bg-white px-4 py-3 font-bold text-ink outline-none transition focus:ring-2 focus:ring-tandoori/40" />
            <button type="button" className="rounded-xl bg-tandoori px-5 py-3 font-black text-ink transition hover:bg-orange-300">Send me pickup deals</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-ink">
            {["PICKUP5", "UC15", "LUNCH10", "Buy 5 lunch combos, get 1 free"].map((deal) => (
              <span key={deal} className="rounded-full bg-white px-3 py-1">{deal}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="visit" className="relative bg-ink px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-15 spice-pattern" />
        <div className="relative mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-tandoori">Visit TikkaXpress</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Northside pickup and delivery</h2>
            <p className="mt-4 max-w-xl text-white/70">Order direct from TikkaXpress Northside for pickup, delivery details, and restaurant contact.</p>
            <p className="mt-4 text-sm font-semibold text-white/60">
              Open daily {restaurantConfig.openHour > 12 ? restaurantConfig.openHour - 12 : restaurantConfig.openHour} AM –{" "}
              {restaurantConfig.closeHour > 12 ? restaurantConfig.closeHour - 12 : restaurantConfig.closeHour} PM
            </p>
            <Link href="/menu" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-tandoori px-6 py-3 font-black text-ink shadow-glow transition hover:bg-orange-300 sm:w-auto">
              <ShoppingBag className="h-5 w-5" />
              Order for pickup or delivery
            </Link>
          </div>
          <div className="space-y-3">
            <iframe
              title={`${selectedLocation.name} location map`}
              src={selectedLocation.mapsEmbedUrl}
              className="min-h-72 w-full rounded-3xl border border-white/12 bg-white/8 shadow-card"
              loading="lazy"
            />
            <div className="rounded-3xl border border-tandoori/80 bg-tandoori p-5 text-left text-ink shadow-glow backdrop-blur-xl">
              <MapPin className="mb-5 h-7 w-7 text-ink" />
              <div className="font-black">{selectedLocation.shortName}</div>
              <div className="mt-1 text-sm text-ink/72">{selectedLocation.address}</div>
              <div className="mt-2 text-sm font-bold text-ink/80">{selectedLocation.phone}</div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
