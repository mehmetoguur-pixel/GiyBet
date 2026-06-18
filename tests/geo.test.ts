import { describe, expect, it } from "vitest";
import {
  detectCityFromCoords,
  haversineDistanceMeters,
  isCoordInMapBounds,
} from "@/lib/geo";

describe("geo helpers", () => {
  it("detects Istanbul vs Ankara from coordinates", () => {
    expect(detectCityFromCoords(41.0082, 28.9784)).toBe("Istanbul");
    expect(detectCityFromCoords(39.9334, 32.8597)).toBe("Ankara");
  });

  it("computes haversine distance in meters", () => {
    const d = haversineDistanceMeters(41.0082, 28.9784, 41.0182, 28.9884);
    expect(d).toBeGreaterThan(1000);
    expect(d).toBeLessThan(2000);
  });

  it("checks whether coords fall inside map bounds", () => {
    const bounds = { north: 42, south: 40, east: 30, west: 28 };
    expect(isCoordInMapBounds(41, 29, bounds)).toBe(true);
    expect(isCoordInMapBounds(39, 29, bounds)).toBe(false);
  });
});
