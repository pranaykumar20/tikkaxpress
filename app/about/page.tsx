import ContentPageShell from "@/components/ContentPageShell";
import type { Metadata } from "next";
import Link from "next/link";
import { defaultRestaurantLocation, restaurantConfig } from "@/lib/restaurant";

export const metadata: Metadata = {
  title: "About | TikkaXpress",
  description: "About TikkaXpress Indian Kitchen in Northside Cincinnati — hours, location, pickup, and delivery."
};

function formatHours() {
  const fmt = (hour: number) => {
    const h = hour % 12 || 12;
    return `${h}:00 ${hour >= 12 ? "PM" : "AM"}`;
  };
  return `Daily ${fmt(restaurantConfig.openHour)} – ${fmt(restaurantConfig.closeHour)}`;
}

export default function AboutPage() {
  return (
    <ContentPageShell
      eyebrow="Northside Cincinnati"
      title="About TikkaXpress"
      lead="Indian comfort food made express — curries, biryani, naan, Indo-Chinese favorites, and weekday lunch combos from our Hamilton Avenue kitchen."
    >
      <ContentPageShell.Section title="Who we are">
        <p>
          {restaurantConfig.name} is a neighborhood Indian kitchen serving Northside and greater Cincinnati. We specialize
          in classic curries, tandoor breads, rice dishes, starters, and value-packed lunch combos designed for busy
          weekdays.
        </p>
        <p>
          Order online for pickup or delivery. Our menu is priced server-side and checkout is secured through Toast, so
          what you see is what you pay.
        </p>
      </ContentPageShell.Section>

      <ContentPageShell.Section title="Location & hours">
        <p className="font-black text-ink">{defaultRestaurantLocation.name}</p>
        <p>{defaultRestaurantLocation.address}</p>
        <p>
          Phone:{" "}
          <a href={`tel:${defaultRestaurantLocation.phone.replace(/[^+\d]/g, "")}`} className="font-bold text-ember">
            {defaultRestaurantLocation.phone}
          </a>
        </p>
        <p>Hours: {formatHours()}</p>
        <p>
          <Link href="/#visit" className="font-black text-ember underline-offset-2 hover:underline">
            Get directions on the home page →
          </Link>
        </p>
      </ContentPageShell.Section>

      <ContentPageShell.Section title="What you can order">
        <ul className="list-disc space-y-2 pl-5">
          <li>Signature curries — butter chicken, tikka masala, paneer, dal, and more</li>
          <li>Biryani, rice plates, and Indo-Chinese favorites like Chicken 65</li>
          <li>Fresh naan, samosas, lassi, and desserts</li>
          <li>Weekday lunch combos from $10.99 (vegetarian) and $11.99 (non-veg)</li>
        </ul>
        <p>
          Use menu filters for vegetarian, spice level, lunch specials, and dietary tags. Questions? Call us or use the
          order assistant on the site.
        </p>
        <p>
          <Link href="/menu" className="font-black text-ember underline-offset-2 hover:underline">
            Start an order →
          </Link>
        </p>
      </ContentPageShell.Section>

      <ContentPageShell.Section title="Follow along">
        <p>
          Catch weekly specials, new dishes, and community moments on{" "}
          <a
            href="https://www.instagram.com/tikkaxpresscincy/"
            className="font-black text-ember underline-offset-2 hover:underline"
          >
            Instagram @tikkaxpresscincy
          </a>
          .
        </p>
      </ContentPageShell.Section>
    </ContentPageShell>
  );
}
