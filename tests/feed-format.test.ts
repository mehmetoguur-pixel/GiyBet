import { describe, expect, it } from "vitest";
import {
  clampRadarMeters,
  formatDistance,
  formatFeedCityLabel,
  formatLocationLabel,
  formatVenueDistance,
  radarMetersToLabel,
  RADAR_MIN_METERS,
  RADAR_MAX_METERS,
} from "@/lib/feed/format";

describe("feed format", () => {
  it("formats venue distance", () => {
    expect(formatVenueDistance(450)).toBe("450m");
    expect(formatVenueDistance(1500)).toBe("1.5km");
  });

  it("formats feed city labels", () => {
    expect(formatFeedCityLabel("Istanbul")).toBe("İstanbul");
    expect(formatFeedCityLabel("Ankara")).toBe("Ankara");
    expect(formatFeedCityLabel(undefined, "Kadıköy")).toBe("Kadıköy");
  });

  it("builds location labels from parts", () => {
    expect(
      formatLocationLabel({
        city: "Istanbul",
        district: "Kadıköy",
        venue: "Starbucks",
      }),
    ).toBe("İstanbul - Kadıköy · Starbucks");
    expect(formatLocationLabel({ locationLabel: "Özel konum" })).toBe("Özel konum");
  });

  it("formats radar radius labels", () => {
    expect(radarMetersToLabel(500)).toBe("500 m");
    expect(radarMetersToLabel(2000)).toBe("2 km");
    expect(radarMetersToLabel(1500)).toBe("1.5 km");
  });

  it("clamps radar meters to slider bounds", () => {
    expect(clampRadarMeters(100)).toBe(RADAR_MIN_METERS);
    expect(clampRadarMeters(99999)).toBe(RADAR_MAX_METERS);
    expect(clampRadarMeters(1250)).toBe(1500);
  });

  it("formats post distance shorthand", () => {
    expect(formatDistance(800)).toBe("800m");
    expect(formatDistance(2000)).toBe("2km");
  });
});
