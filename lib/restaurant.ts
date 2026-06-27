import type { MenuItem } from "@/lib/menu";

export type RestaurantLocation = {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  phone: string;
  mapsEmbedUrl: string;
  active: boolean;
  sortOrder: number;
};

function numberFromEnv(name: string, fallback: number) {
  const value = process.env[`NEXT_PUBLIC_${name}`] || process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const restaurantLocations: RestaurantLocation[] = [
  {
    id: "northside",
    name: "TikkaXpress Northside",
    shortName: "Northside",
    slug: "northside",
    address: "4110 Hamilton Ave, Cincinnati, OH 45223",
    city: "Cincinnati",
    region: "OH",
    postalCode: "45223",
    phone: "513-620-7002",
    mapsEmbedUrl: "https://www.google.com/maps?q=4110%20Hamilton%20Ave%2C%20Cincinnati%2C%20OH%2045223&output=embed",
    active: true,
    sortOrder: 1
  },
  {
    id: "factory-52",
    name: "TikkaXpress Factory 52",
    shortName: "Factory 52",
    slug: "factory-52",
    address: "2750 Park Ave, Cincinnati, OH 45208",
    city: "Cincinnati",
    region: "OH",
    postalCode: "45208",
    phone: "513-501-8040",
    mapsEmbedUrl: "https://www.google.com/maps?q=2750%20Park%20Ave%2C%20Cincinnati%2C%20OH%2045208&output=embed",
    active: true,
    sortOrder: 2
  }
];

export const defaultRestaurantLocation = restaurantLocations[0];

export function findRestaurantLocation(id?: string | null) {
  return restaurantLocations.find((location) => location.id === id && location.active) || defaultRestaurantLocation;
}

export const restaurantConfig = {
  name: "TikkaXpress Indian Kitchen",
  phone: defaultRestaurantLocation.phone,
  address: defaultRestaurantLocation.address,
  city: defaultRestaurantLocation.city,
  region: defaultRestaurantLocation.region,
  postalCode: defaultRestaurantLocation.postalCode,
  timeZone: process.env.NEXT_PUBLIC_RESTAURANT_TIME_ZONE || process.env.RESTAURANT_TIME_ZONE || "America/New_York",
  openHour: numberFromEnv("RESTAURANT_OPEN_HOUR", 11),
  closeHour: numberFromEnv("RESTAURANT_CLOSE_HOUR", 21),
  prepMinutes: numberFromEnv("ORDER_PREP_MINUTES", 25),
  taxRate: numberFromEnv("TAX_RATE", 0.078),
  deliveryFeeCents: numberFromEnv("DELIVERY_FEE_CENTS", 399),
  minimumOrderCents: numberFromEnv("MINIMUM_ORDER_CENTS", 0),
  mapsEmbedUrl:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ||
    process.env.GOOGLE_MAPS_EMBED_URL ||
    defaultRestaurantLocation.mapsEmbedUrl
};

type ClockParts = {
  day: number;
  hour: number;
  minute: number;
};

function localClock(date = new Date()): ClockParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: restaurantConfig.timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value || "Sun";
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  return { day: Math.max(day, 0), hour, minute };
}

export function isRestaurantOpen(date = new Date()) {
  const { hour } = localClock(date);
  return hour >= restaurantConfig.openHour && hour < restaurantConfig.closeHour;
}

export function isLunchSpecialActive(date = new Date()) {
  const { day, hour } = localClock(date);
  return day >= 1 && day <= 5 && hour >= 11 && hour < 15;
}

export function isWeekendSpecialActive(date = new Date()) {
  const { day } = localClock(date);
  return day === 0 || day === 6;
}

export function isMenuItemAvailableNow(item: Pick<MenuItem, "active" | "categoryId">, date = new Date()) {
  if (!item.active) return false;
  if (item.categoryId === "lunch-special") return isLunchSpecialActive(date);
  if (item.categoryId === "weekend-specials") return isWeekendSpecialActive(date);
  return true;
}

export function getOrderTimeOptions(now = new Date()) {
  const options: { label: string; value: string }[] = [];
  if (isRestaurantOpen(now)) {
    options.push({ label: "ASAP - 20-30 minutes", value: "ASAP" });
  }

  const cursor = new Date(now);
  cursor.setMinutes(Math.ceil((cursor.getMinutes() + restaurantConfig.prepMinutes) / 30) * 30, 0, 0);

  while (options.length < 14) {
    if (isRestaurantOpen(cursor)) {
      const value = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}T${String(cursor.getHours()).padStart(2, "0")}:${String(cursor.getMinutes()).padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(cursor);
      options.push({ label, value });
    }

    cursor.setMinutes(cursor.getMinutes() + 30);
    if (cursor.getHours() >= restaurantConfig.closeHour) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(restaurantConfig.openHour, 0, 0, 0);
    }
  }

  return options;
}

export function validateScheduledTime(value?: string | null, now = new Date()) {
  if (!value || value === "ASAP") return isRestaurantOpen(now);
  const scheduled = new Date(value);
  if (Number.isNaN(scheduled.getTime())) return false;
  const max = new Date(now);
  max.setDate(max.getDate() + 7);
  return scheduled >= now && scheduled <= max && isRestaurantOpen(scheduled);
}

export function formatScheduledTime(value?: string | null) {
  if (!value || value === "ASAP") return "ASAP";
  const scheduled = new Date(value);
  if (Number.isNaN(scheduled.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(scheduled);
}
