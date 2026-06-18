import { describe, expect, it } from "vitest";
import {
  MAP_PIN_MAX_AGE_MS,
  filterFreshMapPins,
  isMapPinWithinWindow,
} from "@/lib/map/pin-age";

describe("map pin age", () => {
  const now = Date.parse("2026-06-17T12:00:00.000Z");

  it("accepts pins younger than 24 hours", () => {
    const createdAt = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    expect(isMapPinWithinWindow(createdAt, now)).toBe(true);
  });

  it("rejects pins older than 24 hours", () => {
    const createdAt = new Date(now - MAP_PIN_MAX_AGE_MS - 1).toISOString();
    expect(isMapPinWithinWindow(createdAt, now)).toBe(false);
  });

  it("filters pin list", () => {
    const fresh = { createdAt: new Date(now - 1000).toISOString() };
    const stale = { createdAt: new Date(now - MAP_PIN_MAX_AGE_MS - 1).toISOString() };
    expect(filterFreshMapPins([fresh, stale, { createdAt: undefined }], now)).toEqual([fresh]);
  });
});
