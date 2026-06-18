import { NextRequest, NextResponse } from "next/server";

type TomTomSearchResult = {
  id: string;
  type?: string;
  score?: number;
  dist?: number;
  poi?: {
    name?: string;
  };
  address?: {
    freeformAddress?: string;
  };
  position?: {
    lat: number;
    lon: number;
  };
};

type TomTomSearchResponse = {
  results?: TomTomSearchResult[];
};

function getTomTomKey(): string | null {
  return process.env.NEXT_PUBLIC_TOMTOM_KEY ?? process.env.TOMTOM_API_KEY ?? null;
}

function formatDistanceLabel(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function mapTomTomResult(item: TomTomSearchResult) {
  const lat = item.position?.lat;
  const lng = item.position?.lon;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const poiName = item.poi?.name?.trim();
  const freeformAddress = item.address?.freeformAddress?.trim();
  const name =
    poiName ||
    freeformAddress?.split(",")[0]?.trim() ||
    "Mekan";
  const displayName = freeformAddress || poiName || name;
  const distanceMeters =
    item.dist != null && Number.isFinite(item.dist) ? item.dist : null;

  return {
    placeId: `tomtom:${item.id}`,
    name,
    displayName,
    lat,
    lng,
    distanceMeters,
    distanceLabel:
      distanceMeters != null ? formatDistanceLabel(distanceMeters) : null,
  };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const key = getTomTomKey();
  if (!key) {
    return NextResponse.json({ results: [] });
  }

  const langParam = request.nextUrl.searchParams.get("lang");
  const language = langParam?.startsWith("tr") ? "tr-TR" : "en-US";
  const latParam = request.nextUrl.searchParams.get("lat");
  const lonParam = request.nextUrl.searchParams.get("lon");
  const userLat = latParam != null ? Number(latParam) : null;
  const userLon = lonParam != null ? Number(lonParam) : null;
  const hasUserLocation =
    userLat != null &&
    userLon != null &&
    Number.isFinite(userLat) &&
    Number.isFinite(userLon);

  const url = new URL(
    `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json`,
  );
  url.searchParams.set("key", key);
  url.searchParams.set("language", language);
  url.searchParams.set("limit", "10");

  if (hasUserLocation) {
    url.searchParams.set("lat", String(userLat));
    url.searchParams.set("lon", String(userLon));
    url.searchParams.set("radius", "50000");
  }

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "TomTom araması yanıt vermedi." },
        { status: response.status },
      );
    }

    const data = (await response.json()) as TomTomSearchResponse;
    const results = (data.results ?? [])
      .map(mapTomTomResult)
      .filter((item): item is NonNullable<typeof item> => item != null)
      .sort((a, b) => {
        if (a.distanceMeters != null && b.distanceMeters != null) {
          return a.distanceMeters - b.distanceMeters;
        }
        return 0;
      });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Mekan araması sırasında bir hata oluştu." },
      { status: 502 },
    );
  }
}
