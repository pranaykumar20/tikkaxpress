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
    <div className="relative z-10 overflow-hidden rounded-[8px] border border-white/12 bg-white/8 p-2 shadow-glow backdrop-blur-xl sm:p-3">
      <div className="relative h-[360px] w-full overflow-hidden rounded-[6px] sm:h-[460px] lg:h-[560px]">
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
      </div>

      <div className="absolute bottom-4 left-4 right-4 rounded-[8px] border border-white/70 bg-cream/94 p-4 text-ink shadow-card backdrop-blur-xl sm:bottom-8 sm:left-8 sm:right-8 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-ember transition-opacity duration-500">
              {activeSlide.tag}
            </div>
            <div className="mt-1 text-xl font-black sm:text-2xl">{activeSlide.title}</div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
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
  );
}
