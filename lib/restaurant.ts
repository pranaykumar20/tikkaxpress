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

function listFromEnv(name: string, fallback: string[]) {
  const value = process.env[`NEXT_PUBLIC_${name}`] || process.env[name];
  if (!value) return fallback;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
  deliveryPostalCodes: listFromEnv("DELIVERY_POSTAL_CODES", ["45223", "45224", "45229", "45216"]),
  minimumOrderCents: numberFromEnv("MINIMUM_ORDER_CENTS", 0),
  mapsEmbedUrl:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ||
    process.env.GOOGLE_MAPS_EMBED_URL ||
    defaultRestaurantLocation.mapsEmbedUrl
};

export function validateDeliveryAddress(address?: string | null) {
  if (!address) return false;
  const zip = address.match(/\b\d{5}(?:-\d{4})?\b/)?.[0].slice(0, 5);
  return Boolean(zip && restaurantConfig.deliveryPostalCodes.includes(zip));
}

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

  const cursor = new Date(now.getTime() + restaurantConfig.prepMinutes * 60_000);
  cursor.setUTCMinutes(Math.ceil(cursor.getUTCMinutes() / 30) * 30, 0, 0);

  while (options.length < 14) {
    if (cursor > now && isRestaurantOpen(cursor)) {
      const label = new Intl.DateTimeFormat("en-US", {
        timeZone: restaurantConfig.timeZone,
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(cursor);
      options.push({ label, value: cursor.toISOString() });
    }

    cursor.setTime(cursor.getTime() + 30 * 60_000);
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
    timeZone: restaurantConfig.timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(scheduled);
}
