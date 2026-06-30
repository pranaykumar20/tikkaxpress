import { describe, expect, it } from "vitest";
import { getOrderTimeOptions, validateDeliveryAddress, validateScheduledTime } from "@/lib/restaurant";

describe("restaurant ordering helpers", () => {
  it("generates only future order times in the restaurant time zone", () => {
    const now = new Date("2026-06-28T16:05:00.000Z");
    const options = getOrderTimeOptions(now);
    const scheduledOptions = options.filter((option) => option.value !== "ASAP");

    expect(scheduledOptions.length).toBeGreaterThan(0);
    expect(scheduledOptions.every((option) => new Date(option.value) > now)).toBe(true);
    expect(scheduledOptions.every((option) => validateScheduledTime(option.value, now))).toBe(true);
    expect(scheduledOptions[0].label).toContain("Sun, Jun 28");
  });

  it("rejects past scheduled times", () => {
    const now = new Date("2026-06-28T16:05:00.000Z");

    expect(validateScheduledTime("2026-06-27T17:00:00.000Z", now)).toBe(false);
  });

  it("checks delivery addresses by configured ZIP code", () => {
    expect(validateDeliveryAddress("4110 Hamilton Ave, Cincinnati, OH 45223")).toBe(true);
    expect(validateDeliveryAddress("1 Far Away Rd, Columbus, OH 43215")).toBe(false);
  });
});
