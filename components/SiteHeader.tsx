"use client";

import { defaultRestaurantLocation } from "@/lib/restaurant";
import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";

type SiteHeaderProps = {
  cartCount?: number;
};

function navLinkClass(active: boolean, compact = false) {
  return `${compact ? "shrink-0 px-4 py-2.5 text-xs" : "px-4 py-2 text-sm"} rounded-full font-bold transition ${
    active ? "bg-cream text-ink" : "text-charcoal/70 hover:bg-cream hover:text-ink"
  }`;
}

export default function SiteHeader({ cartCount = 0 }: SiteHeaderProps) {
  const pathname = usePathname();
  const onMenu = pathname === "/menu";
  const onHome = pathname === "/";
  const onAbout = pathname === "/about";
  const onOurStory = pathname === "/our-story";

  return (
    <header className="sticky top-0 z-40 border-b border-black/8 bg-cream/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center" aria-label="TikkaXpress home">
          <BrandLogo size={44} className="h-11 w-11 sm:h-14 sm:w-14" priority />
        </Link>

        <nav className="hidden items-center rounded-full border border-black/8 bg-white/70 p-1 text-sm font-bold text-charcoal/70 shadow-card md:flex">
          <Link href="/menu" className={navLinkClass(onMenu)}>
            Menu
          </Link>
          <Link href="/#specials" className={navLinkClass(false)}>
            Specials
          </Link>
          <Link href="/#visit" className={navLinkClass(false)}>
            Visit
          </Link>
          <Link href="/about" className={navLinkClass(onAbout)}>
            About
          </Link>
        </nav>

        <Link
          href="/menu"
          className="relative inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-black text-white shadow-card transition hover:-translate-y-0.5 hover:bg-charcoal sm:px-5 sm:py-3"
        >
          <ShoppingBag className="h-4 w-4 text-tandoori" />
          <span className="hidden min-[380px]:inline">Order</span>
          {cartCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-tandoori px-1 text-xs font-black text-ink">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto border-t border-black/6 px-4 py-2 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Mobile navigation"
      >
        <Link href="/menu" className={navLinkClass(onMenu, true)}>
          Menu
        </Link>
        <Link href="/#specials" className={navLinkClass(onHome, true)}>
          Specials
        </Link>
        <Link href="/#visit" className={navLinkClass(onHome, true)}>
          Visit
        </Link>
        <Link href="/our-story" className={navLinkClass(onOurStory, true)}>
          Our Story
        </Link>
        <Link href="/about" className={navLinkClass(onAbout, true)}>
          About
        </Link>
        <a
          href={`tel:${defaultRestaurantLocation.phone.replace(/[^+\d]/g, "")}`}
          className="shrink-0 rounded-full px-4 py-2.5 text-xs font-bold text-charcoal/70 transition hover:bg-cream hover:text-ink"
        >
          Call
        </a>
      </nav>
    </header>
  );
}
