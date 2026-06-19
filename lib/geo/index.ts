import { reverseGeocodeNominatim } from "@/lib/nominatim-api";
import type { PlaceDetail } from "@/lib/places-api";
import { formatFeedCityLabel, formatLocationLabel, mockDistrictForCity } from "@/lib/feed/format";
import { DEFAULT_GOSSIP_LOCATION } from "@/lib/gossip/constants";
import type {
  City,
  FeedPost,
  GeoCoords,
  MapBounds,
  NearbyVenue,
  ShareLocationFields,
  VenuePoint,
} from "@/lib/giybet/types";

export function detectCityFromCoords(lat: number, lng: number): City {
  const toAnkara = Math.hypot(lat - 39.9334, lng - 32.8597);
  const toIstanbul = Math.hypot(lat - 41.0082, lng - 28.9784);
  return toAnkara < toIstanbul ? "Ankara" : "Istanbul";
}
export const VENUE_POINTS: VenuePoint[] = [
  { name: "Starbucks", lat: 40.9901, lng: 29.0289, city: "Istanbul" },
  { name: "Espresso Lab", lat: 41.0442, lng: 29.0025, city: "Istanbul" },
  { name: "Kahve Dünyası", lat: 41.0082, lng: 28.9784, city: "Istanbul" },
  { name: "Millet Kütüphanesi", lat: 41.0478, lng: 28.9865, city: "Istanbul" },
  { name: "AVM Yemek Katı", lat: 41.0628, lng: 28.985, city: "Istanbul" },
  { name: "Mahalle Parkı", lat: 41.0235, lng: 28.975, city: "Istanbul" },
  { name: "Kampüs Çimenlik", lat: 41.105, lng: 29.025, city: "Istanbul" },
  { name: "Starbucks", lat: 41.0425, lng: 29.0085, city: "Istanbul" },
  { name: "Espresso Lab", lat: 41.034, lng: 28.985, city: "Istanbul" },
  { name: "Kahve Dünyası", lat: 40.982, lng: 29.04, city: "Istanbul" },
  { name: "Starbucks", lat: 39.9208, lng: 32.8541, city: "Ankara" },
  { name: "Espresso Lab", lat: 39.9185, lng: 32.861, city: "Ankara" },
  { name: "Kahve Dünyası", lat: 39.925, lng: 32.848, city: "Ankara" },
  { name: "Millet Kütüphanesi", lat: 39.915, lng: 32.852, city: "Ankara" },
  { name: "AVM Yemek Katı", lat: 39.909, lng: 32.864, city: "Ankara" },
  { name: "Kampüs Çimenlik", lat: 39.9334, lng: 32.8597, city: "Ankara" },
  { name: "Mahalle Parkı", lat: 39.928, lng: 32.855, city: "Ankara" },
];
export function resolvePostDistanceMeters(post: FeedPost, origin: GeoCoords | null): number | undefined {
  if (!origin || post.lat == null || post.lng == null) return post.distanceMeters;
  return haversineDistanceMeters(origin.lat, origin.lng, post.lat, post.lng);
}
export function isCoordInMapBounds(
  lat: number,
  lng: number,
  bounds: MapBounds,
): boolean {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}

export function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Küçük GPS sıçramalarını yoksay (metre) */
export const GEO_STABILITY_MIN_METERS = 250;

export function coordsMovedSignificantly(
  prev: GeoCoords | null,
  next: GeoCoords,
  minMeters = GEO_STABILITY_MIN_METERS,
): boolean {
  if (!prev) return true;
  return haversineDistanceMeters(prev.lat, prev.lng, next.lat, next.lng) >= minMeters;
}

export function getNearbyVenues(lat: number, lng: number, limit = 6): NearbyVenue[] {
  const ranked = VENUE_POINTS.map((venue) => ({
    ...venue,
    distanceMeters: haversineDistanceMeters(lat, lng, venue.lat, venue.lng),
  })).sort((a, b) => a.distanceMeters - b.distanceMeters);

  const seen = new Set<string>();
  const result: NearbyVenue[] = [];

  for (const venue of ranked) {
    if (seen.has(venue.name)) continue;
    seen.add(venue.name);
    result.push({
      name: venue.name,
      lat: venue.lat,
      lng: venue.lng,
      distanceMeters: venue.distanceMeters,
    });
    if (result.length >= limit) break;
  }

  return result;
}

export function requestGeolocation(options?: {
  highAccuracy?: boolean;
  maximumAge?: number;
}): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Tarayıcın konum özelliğini desteklemiyor."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => reject(err),
      {
        enableHighAccuracy: options?.highAccuracy ?? true,
        timeout: 15000,
        maximumAge: options?.maximumAge ?? 0,
      },
    );
  });
}

const geocodeCache = new Map<string, ShareLocationFields>();

function geocodeCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/** GPS koordinatından gerçek adres (Nominatim / yedek API) */
export async function resolveLocationFromGps(
  lat: number,
  lng: number,
  options?: { city?: City; venue?: string; manualDistrict?: string; language?: string },
): Promise<ShareLocationFields> {
  const venue = options?.venue?.trim();
  if (!venue) {
    const cached = geocodeCache.get(geocodeCacheKey(lat, lng));
    if (cached) return cached;
  }

  const result = await resolveShareLocationAtCoords(lat, lng, options);
  if (!venue) {
    geocodeCache.set(geocodeCacheKey(lat, lng), result);
  }
  return result;
}

/** Ağ çağrısı olmadan konum etiketi — paylaşım ve önizleme için */
export function buildShareLocationFast(
  lat: number,
  lng: number,
  options?: { city?: City; venue?: string; manualDistrict?: string },
): ShareLocationFields {
  const feedCity: City = options?.city ?? detectCityFromCoords(lat, lng);
  const cityLabel = formatFeedCityLabel(feedCity) ?? feedCity;
  const district = options?.manualDistrict?.trim() || mockDistrictForCity(feedCity, lat, lng);
  const venue = options?.venue?.trim();
  const locationLabel =
    formatLocationLabel({ city: feedCity, cityLabel, district, venue }) ??
    `${cityLabel} - ${district}`;

  return {
    city: feedCity,
    cityLabel,
    district,
    locationLabel,
    ...(venue ? { venue } : {}),
  };
}
export async function resolveShareLocationAtCoords(
  lat: number,
  lng: number,
  options?: { city?: City; venue?: string; manualDistrict?: string; language?: string },
): Promise<ShareLocationFields> {
  const geocoded = await reverseGeocodeNominatim(
    lat,
    lng,
    options?.language ?? "tr",
  );
  const feedCity: City = options?.city ?? detectCityFromCoords(lat, lng);
  const cityLabel =
    geocoded?.cityLabel?.trim() ||
    formatFeedCityLabel(options?.city) ||
    formatFeedCityLabel(feedCity) ||
    feedCity;
  const district =
    options?.manualDistrict?.trim() ||
    geocoded?.district?.trim() ||
    mockDistrictForCity(feedCity, lat, lng);
  const venue = options?.venue?.trim();
  const locationLabel =
    formatLocationLabel({
      city: feedCity,
      cityLabel,
      district,
      venue,
    }) ?? `${cityLabel} - ${district}`;

  return {
    city: feedCity,
    cityLabel,
    district,
    locationLabel,
    ...(venue ? { venue } : {}),
  };
}

export function isDefaultGossipCoords(coords: GeoCoords): boolean {
  const eps = 0.08;
  return (
    Math.abs(coords.lat - DEFAULT_GOSSIP_LOCATION.lat) < eps &&
    Math.abs(coords.lng - DEFAULT_GOSSIP_LOCATION.lng) < eps
  );
}

export async function ensureCoordsForShare(
  sharePlace: PlaceDetail | null,
  geoCoords: GeoCoords | null,
): Promise<GeoCoords | null> {
  if (sharePlace) {
    return { lat: sharePlace.lat, lng: sharePlace.lng };
  }

  if (geoCoords && !isDefaultGossipCoords(geoCoords)) {
    return geoCoords;
  }

  try {
    return await requestGeolocation({ highAccuracy: true, maximumAge: 0 });
  } catch {
    if (geoCoords) return geoCoords;
    return null;
  }
}
