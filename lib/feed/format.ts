import type { City } from "@/lib/giybet/types";

export function formatVenueDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatFeedCityLabel(city?: City, cityLabel?: string): string | null {
  const trimmed = cityLabel?.trim();
  if (trimmed) return trimmed;
  if (city === "Istanbul") return "İstanbul";
  if (city === "Ankara") return "Ankara";
  return null;
}

export function formatLocationLabel(post: {
  locationLabel?: string;
  district?: string;
  venue?: string;
  city?: City;
  cityLabel?: string;
}): string | null {
  if (post.locationLabel?.trim()) return post.locationLabel.trim();

  const cityName = formatFeedCityLabel(post.city, post.cityLabel);
  if (cityName && post.district && post.venue) {
    return `${cityName} - ${post.district} · ${post.venue}`;
  }
  if (cityName && post.district) {
    if (cityName.localeCompare(post.district, "tr", { sensitivity: "accent" }) === 0) {
      return cityName;
    }
    return `${cityName} - ${post.district}`;
  }
  if (post.district && post.venue) return `${post.district} - ${post.venue}`;
  if (post.district) return post.district;
  if (post.venue) return post.venue;
  if (cityName) return cityName;
  return null;
}
export function mockDistrictForCity(city: City, lat?: number, lng?: number): string {
  const districts: Record<City, string[]> = {
    Istanbul: ["Beşiktaş", "Kadıköy", "Şişli", "Taksim"],
    Ankara: ["Yenimahalle", "Kızılay", "Çankaya", "Ulus"],
  };
  const list = districts[city];
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    const latBucket = Math.round(lat * 100);
    const lngBucket = Math.round(lng * 100);
    const index = Math.abs(latBucket * 31 + lngBucket * 17) % list.length;
    return list[index];
  }
  return list[0];
}
export const RADAR_MIN_METERS = 500;
export const RADAR_MAX_METERS = 20000;
export const RADAR_DEFAULT_METERS = 20000;
export const RADAR_STEP_METERS = 500;

export function radarMetersToLabel(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
  }
  return `${meters} m`;
}

export function clampRadarMeters(meters: number): number {
  const stepped =
    RADAR_MIN_METERS +
    Math.round((meters - RADAR_MIN_METERS) / RADAR_STEP_METERS) * RADAR_STEP_METERS;
  return Math.min(RADAR_MAX_METERS, Math.max(RADAR_MIN_METERS, stepped));
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return km % 1 === 0 ? `${km}km` : `${km.toFixed(1)}km`;
  }
  return `${meters}m`;
}

export function randomPostDistance(): number {
  const pool = [280, 300, 450, 680, 1200, 1500, 2200, 3800, 5200, 8500];
  return pool[Math.floor(Math.random() * pool.length)];
}
