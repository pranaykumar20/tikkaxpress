import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import ChatWidgetLoader from "@/components/ChatWidgetLoader";
import { restaurantLocations } from "@/lib/restaurant";
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
    "@graph": restaurantLocations.map((location) => ({
      "@type": "Restaurant",
      name: location.name,
      servesCuisine: "Indian",
      telephone: location.phone,
      priceRange: "$$",
      image: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003"}/images/tikkaxpress-hero.png`,
      address: {
        "@type": "PostalAddress",
        streetAddress: location.address.split(",")[0],
        addressLocality: location.city,
        addressRegion: location.region,
        postalCode: location.postalCode,
        addressCountry: "US"
      },
      acceptsReservations: false,
      hasMenu: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003"}/#menu`
    }))
  };

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
        <ChatWidgetLoader />
      </body>
    </html>
  );
}
