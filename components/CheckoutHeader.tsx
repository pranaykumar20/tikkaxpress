"use client";

import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function CheckoutHeader({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <header className="border-b border-black/8 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center" aria-label="TikkaXpress home">
          <BrandLogo size={44} className="h-11 w-11 sm:h-12 sm:w-12" />
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-bold text-charcoal/65 md:flex">
          <Link href="/menu" className="rounded-full px-4 py-2 transition hover:bg-cream hover:text-ink">
            Menu
          </Link>
          <Link href="/#specials" className="rounded-full px-4 py-2 transition hover:bg-cream hover:text-ink">
            Specials
          </Link>
          <Link href="/#visit" className="rounded-full px-4 py-2 transition hover:bg-cream hover:text-ink">
            Visit
          </Link>
        </nav>

        <Link
          href="/menu"
          className="relative inline-flex shrink-0 items-center gap-2 rounded-full border border-black/8 bg-cream px-3 py-2 text-sm font-bold text-ink transition hover:bg-white sm:px-4"
        >
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden min-[380px]:inline">Cart</span>
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
        <Link href="/menu" className="shrink-0 rounded-full px-4 py-2.5 text-xs font-bold text-charcoal/70 transition hover:bg-cream hover:text-ink">
          Menu
        </Link>
        <Link href="/#specials" className="shrink-0 rounded-full px-4 py-2.5 text-xs font-bold text-charcoal/70 transition hover:bg-cream hover:text-ink">
          Specials
        </Link>
        <Link href="/#visit" className="shrink-0 rounded-full px-4 py-2.5 text-xs font-bold text-charcoal/70 transition hover:bg-cream hover:text-ink">
          Visit
        </Link>
      </nav>
    </header>
  );
}
