import { Quote, Star } from "lucide-react";
import { defaultRestaurantLocation } from "@/lib/restaurant";

const REVIEWS = [
  {
    name: "A.P.",
    initials: "AP",
    review: "Butter chicken, garlic naan, and mango lassi are always fresh. Portions are generous and pickup is quick.",
    date: "2 weeks ago",
    rating: 5,
    accent: "from-orange-200 to-tandoori/30"
  },
  {
    name: "M.K.",
    initials: "MK",
    review: "Fast pickup and the lunch combo is a great deal. Perfect for a workday — rice, naan, and dessert included.",
    date: "1 month ago",
    rating: 5,
    accent: "from-amber-100 to-orange-200/80"
  },
  {
    name: "J.S.",
    initials: "JS",
    review: "Chicken tikka masala has become my regular order. Spice level is spot on and the naan is always warm.",
    date: "3 weeks ago",
    rating: 5,
    accent: "from-cream to-tandoori/20"
  }
] as const;

const GOOGLE_MAPS_REVIEWS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(defaultRestaurantLocation.name + " " + defaultRestaurantLocation.address)}`;

function GoogleMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-[#FBBC04] text-[#FBBC04]" : "fill-charcoal/15 text-charcoal/15"}`}
        />
      ))}
    </div>
  );
}

export default function GoogleReviewsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
      <div className="review-panel overflow-hidden rounded-3xl border border-black/6 bg-white p-5 shadow-card sm:p-7 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-cream/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-charcoal/70">
              <GoogleMark className="h-4 w-4" />
              Google reviews
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">Customer favorites</h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-charcoal/62">
              Real feedback from guests who order pickup and delivery from TikkaXpress Northside.
            </p>
          </div>

          <div className="review-score-card shrink-0 rounded-2xl border border-black/6 bg-gradient-to-br from-cream via-white to-orange-50/80 p-5 shadow-card sm:min-w-[220px]">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black leading-none text-ink">4.8</span>
              <div>
                <StarRow rating={5} />
                <p className="mt-1 text-xs font-bold text-charcoal/55">Based on Google reviews</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {[
                { stars: 5, pct: 82 },
                { stars: 4, pct: 12 },
                { stars: 3, pct: 4 },
                { stars: 2, pct: 1 },
                { stars: 1, pct: 1 }
              ].map((row) => (
                <div key={row.stars} className="flex items-center gap-2">
                  <span className="w-3 text-xs font-bold text-charcoal/50">{row.stars}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-charcoal/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FBBC04] to-tandoori"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <a
              href={GOOGLE_MAPS_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-black text-ember transition hover:text-curry"
            >
              <GoogleMark className="h-4 w-4" />
              Read on Google
            </a>
          </div>
        </div>

        <div className="-mx-1 mt-7 flex gap-4 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
          {REVIEWS.map((item) => (
            <article
              key={item.name}
              className="review-card group relative min-w-[min(100%,280px)] flex-1 overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-tandoori/20 hover:shadow-card-lift md:min-w-0"
            >
              <Quote
                className="absolute right-4 top-4 h-10 w-10 text-tandoori/10 transition group-hover:text-tandoori/18"
                aria-hidden
              />
              <div className="relative flex items-center gap-3">
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${item.accent} text-sm font-black text-ink ring-2 ring-white shadow-card`}
                >
                  {item.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-ink">{item.name}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-charcoal/55">
                      <GoogleMark className="h-3 w-3" />
                      Verified
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRow rating={item.rating} />
                    <span className="text-xs font-semibold text-charcoal/45">{item.date}</span>
                  </div>
                </div>
              </div>
              <p className="relative mt-4 text-sm leading-7 text-charcoal/75">&ldquo;{item.review}&rdquo;</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
