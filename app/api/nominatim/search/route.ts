import { NextRequest, NextResponse } from "next/server";

const VIEWBOX_RADIUS_KM = 25; // ~50 km çap
const POI_CLASSES = new Set(["amenity", "leisure", "building"]);
const POI_CLASS_PRIORITY: Record<string, number> = {
  amenity: 0,
  leisure: 0,
  building: 0,
  tourism: 1,
  shop: 1,
};

type NominatimRawResult = {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  importance?: number;
};

function shortNameFromDisplayName(displayName: string): string {
  const first = displayName.split(",")[0]?.trim();
  return first || displayName;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceLabel(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function computeViewbox(lat: number, lon: number): string {
  const latDelta = VIEWBOX_RADIUS_KM / 111.32;
  const lonDelta = VIEWBOX_RADIUS_KM / (111.32 * Math.cos((lat * Math.PI) / 180));
  const west = lon - lonDelta;
  const east = lon + lonDelta;
  const south = lat - latDelta;
  const north = lat + latDelta;
  return `${west},${north},${east},${south}`;
}

function poiSortScore(item: NominatimRawResult): number {
  if (item.class && POI_CLASSES.has(item.class)) return 0;
  return POI_CLASS_PRIORITY[item.class ?? ""] ?? 2;
}

function buildNominatimUrl(
  q: string,
  userLat: number | null,
  userLon: number | null,
  bounded: boolean,
): URL {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("countrycodes", "tr");
  url.searchParams.set("limit", "10");
  url.searchParams.set("q", q);

  if (userLat != null && userLon != null) {
    url.searchParams.set("lat", String(userLat));
    url.searchParams.set("lon", String(userLon));
    if (bounded) {
      url.searchParams.set("viewbox", computeViewbox(userLat, userLon));
      url.searchParams.set("bounded", "1");
    }
  }

  return url;
}

async function fetchNominatim(url: URL): Promise<NominatimRawResult[]> {
  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "GiyBet/1.0 (venue search; contact@giybet.local)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("OpenStreetMap araması yanıt vermedi.");
  }

  return (await response.json()) as NominatimRawResult[];
}

function mapAndSortResults(
  data: NominatimRawResult[],
  userLat: number | null,
  userLon: number | null,
) {
  const mapped = data
    .map((item) => {
      const lat = Number(item.lat);
      const lng = Number(item.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const distanceMeters =
        userLat != null && userLon != null
          ? haversineMeters(userLat, userLon, lat, lng)
          : null;

      return {
        placeId: `nominatim:${item.place_id}`,
        displayName: item.display_name,
        name: item.name?.trim() || shortNameFromDisplayName(item.display_name),
        lat,
        lng,
        distanceMeters,
        distanceLabel:
          distanceMeters != null ? formatDistanceLabel(distanceMeters) : null,
        poiScore: poiSortScore(item),
        importance: item.importance ?? 0,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

  mapped.sort((a, b) => {
    if (a.poiScore !== b.poiScore) return a.poiScore - b.poiScore;
    if (a.distanceMeters != null && b.distanceMeters != null) {
      return a.distanceMeters - b.distanceMeters;
    }
    return b.importance - a.importance;
  });

  return mapped.slice(0, 10).map(({ poiScore, importance, ...rest }) => {
    void poiScore;
    void importance;
    return rest;
  });
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const latParam = request.nextUrl.searchParams.get("lat");
  const lonParam = request.nextUrl.searchParams.get("lon");
  const userLat = latParam != null ? Number(latParam) : null;
  const userLon = lonParam != null ? Number(lonParam) : null;
  const hasUserLocation =
    userLat != null &&
    userLon != null &&
    Number.isFinite(userLat) &&
    Number.isFinite(userLon);

  try {
    let data: NominatimRawResult[] = [];

    if (hasUserLocation) {
      data = await fetchNominatim(
        buildNominatimUrl(q, userLat, userLon, true),
      );
      if (data.length === 0) {
        data = await fetchNominatim(
          buildNominatimUrl(q, userLat, userLon, false),
        );
      }
    } else {
      data = await fetchNominatim(buildNominatimUrl(q, null, null, false));
    }

    const results = mapAndSortResults(
      data,
      hasUserLocation ? userLat : null,
      hasUserLocation ? userLon : null,
    );

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Mekan araması sırasında bir hata oluştu." },
      { status: 502 },
    );
  }
}
