"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const ROTATION_MS = 3500;

const HERO_SLIDES = [
  {
    src: "/images/tikkaxpress-hero.png",
    alt: "TikkaXpress curry, rice, naan, and Indian sides",
    tag: "Chef's spread",
    title: "Full Indian feast from $10.99"
  },
  {
    src: "/images/menu/items/butter-chicken.png",
    alt: "Butter Chicken",
    tag: "Guest favorite",
    title: "Creamy butter chicken"
  },
  {
    src: "/images/menu/items/chicken-tikka-masala.png",
    alt: "Chicken Tikka Masala",
    tag: "House classic",
    title: "Chicken tikka masala"
  },
  {
    src: "/images/menu/items/paneer-tikka-masala.png",
    alt: "Paneer Tikka Masala",
    tag: "Vegetarian pick",
    title: "Paneer tikka masala"
  },
  {
    src: "/images/menu/items/chicken-boneless-biryani.png",
    alt: "Chicken Biryani",
    tag: "Weekend special",
    title: "Fragrant chicken biryani"
  },
  {
    src: "/images/menu/items/butter-naan.png",
    alt: "Butter Naan",
    tag: "Fresh from tandoor",
    title: "Warm butter naan"
  },
  {
    src: "/images/menu/items/vegetable-samosa.png",
    alt: "Vegetable Samosa",
    tag: "Crispy starter",
    title: "Golden vegetable samosa"
  },
  {
    src: "/images/menu/items/mango-lassi.png",
    alt: "Mango Lassi",
    tag: "Cool & sweet",
    title: "Mango lassi"
  }
] as const;

export default function HeroImageCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = HERO_SLIDES[activeIndex];

  return (
    <div className="relative z-10 mx-auto w-full max-w-[620px]">
      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-2 shadow-glow backdrop-blur-xl sm:p-3">
        <div className="relative aspect-[16/10] min-h-[300px] w-full overflow-hidden rounded-2xl sm:min-h-[360px] lg:min-h-0">
          {HERO_SLIDES.map((slide, index) => (
            <Image
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={`object-cover transition-opacity duration-1000 ease-in-out ${
                index === activeIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/8 to-transparent" />
        </div>

        <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/60 bg-cream/95 p-4 text-ink shadow-card-lift backdrop-blur-xl sm:bottom-5 sm:left-5 sm:right-auto sm:w-[78%] sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-ember transition-opacity duration-500 sm:text-sm">
                {activeSlide.tag}
              </div>
              <div className="mt-1 text-lg font-black leading-6 sm:text-2xl">{activeSlide.title}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em] text-charcoal/58">
                <span className="rounded-full bg-white px-3 py-1">20-30 min</span>
                <span className="rounded-full bg-white px-3 py-1">Pickup or delivery</span>
              </div>
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
              <div className="flex gap-1.5">
                {HERO_SLIDES.map((slide, index) => (
                  <button
                    key={slide.src}
                    type="button"
                    aria-label={`Show ${slide.alt}`}
                    onClick={() => setActiveIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === activeIndex ? "w-5 bg-tandoori" : "w-2 bg-ink/20 hover:bg-ink/35"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-1.5 sm:hidden">
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Show ${slide.alt}`}
            onClick={() => setActiveIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === activeIndex ? "w-5 bg-tandoori" : "w-2 bg-ink/25"
            }`}
          />
        ))}
      </div>

      <div className="absolute -right-3 -top-4 hidden rounded-2xl border border-white/20 bg-ink/90 px-4 py-3 text-white shadow-card-lift backdrop-blur-xl lg:block">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-tandoori">Live prep</div>
        <div className="mt-1 text-xl font-black">25 min</div>
      </div>

      <div className="absolute -bottom-4 left-6 hidden rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-black text-white shadow-card backdrop-blur-xl md:block">
        Northside Cincinnati
      </div>
    </div>
  );
}
