import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { MapPin, Phone, Share2 } from "lucide-react";
import { defaultRestaurantLocation, restaurantConfig } from "@/lib/restaurant";

const footerLinks = [
  { href: "/our-story", label: "Our Story" },
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms of Service" }
] as const;

type SiteFooterProps = {
  offsetMobileCart?: boolean;
};

export default function SiteFooter({ offsetMobileCart = false }: SiteFooterProps) {
  const openHour = restaurantConfig.openHour;
  const closeHour = restaurantConfig.closeHour;
  const fmt = (hour: number) => {
    const h = hour % 12 || 12;
    return `${h} ${hour >= 12 ? "PM" : "AM"}`;
  };

  return (
    <footer
      className={`border-t border-black/8 bg-ink text-white ${offsetMobileCart ? "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0" : ""}`}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center" aria-label="TikkaXpress home">
              <BrandLogo size={52} className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-tandoori/30" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/65">
              Indian comfort food, made express. Fresh curries, biryani, naan, and weekday lunch combos from Northside Cincinnati.
            </p>
            <Link
              href="/menu"
              className="mt-5 inline-flex rounded-full bg-tandoori px-5 py-2.5 text-sm font-black text-ink transition hover:bg-orange-300"
            >
              Order now
            </Link>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.22em] text-tandoori">Explore</h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/menu" className="text-sm font-semibold text-white/72 transition hover:text-white">
                  Menu
                </Link>
              </li>
              <li>
                <Link href="/#specials" className="text-sm font-semibold text-white/72 transition hover:text-white">
                  Specials
                </Link>
              </li>
              <li>
                <Link href="/#visit" className="text-sm font-semibold text-white/72 transition hover:text-white">
                  Visit
                </Link>
              </li>
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-semibold text-white/72 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.22em] text-tandoori">Contact</h2>
            <ul className="mt-4 space-y-3 text-sm font-semibold text-white/72">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-tandoori" />
                <span>{defaultRestaurantLocation.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-tandoori" />
                <a href={`tel:${defaultRestaurantLocation.phone.replace(/[^+\d]/g, "")}`} className="transition hover:text-white">
                  {defaultRestaurantLocation.phone}
                </a>
              </li>
              <li>
                Open daily {fmt(openHour)} – {fmt(closeHour)}
              </li>
              <li>
                <a
                  href="https://www.instagram.com/tikkaxpresscincy/"
                  className="inline-flex items-center gap-2 transition hover:text-white"
                >
                  <Share2 className="h-4 w-4 text-tandoori" />
                  @tikkaxpresscincy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs font-semibold text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TikkaXpress. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-white/70">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
