import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { restaurantConfig } from "@/lib/restaurant";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003"),
  title: "TikkaXpress | Order Indian Favorites Fast",
  description: "Order pickup and delivery from TikkaXpress Indian Kitchen in Cincinnati.",
  keywords: ["TikkaXpress", "Indian food Cincinnati", "Northside Indian restaurant", "Indian pickup", "Indian delivery"],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "TikkaXpress",
    description: "Fresh Indian favorites, lunch specials, pickup, delivery, and secure Stripe checkout.",
    images: ["/images/tikkaxpress-hero.png"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurantConfig.name,
    servesCuisine: "Indian",
    telephone: restaurantConfig.phone,
    priceRange: "$$",
    image: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003"}/images/tikkaxpress-hero.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "4110 Hamilton Ave",
      addressLocality: restaurantConfig.city,
      addressRegion: restaurantConfig.region,
      postalCode: restaurantConfig.postalCode,
      addressCountry: "US"
    },
    acceptsReservations: false,
    hasMenu: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003"}/#menu`
  };

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
      </body>
    </html>
  );
}
