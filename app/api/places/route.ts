import { NextRequest, NextResponse } from "next/server";

const GOOGLE_BASE = "https://maps.googleapis.com/maps/api/place";

const NEARBY_TYPES = [
  "park",
  "cafe",
  "restaurant",
  "shopping_mall",
  "school",
  "lodging",
  "store",
  "gym",
] as const;

type GoogleAutocompletePrediction = {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

type GooglePlaceResult = {
  place_id: string;
  name: string;
  geometry?: { location?: { lat: number; lng: number } };
  vicinity?: string;
  formatted_address?: string;
  types?: string[];
};

function getApiKey(): string | null {
  return process.env.GOOGLE_PLACES_API_KEY ?? null;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function googleGet<T>(url: string): Promise<T> {
  const response = await fetch(url, { next: { revalidate: 0 } });
  const json = (await response.json()) as T & { status?: string; error_message?: string };
  if (!response.ok || json.status === "REQUEST_DENIED" || json.status === "INVALID_REQUEST") {
    throw new Error(json.error_message || json.status || "Google Places isteği başarısız.");
  }
  if (json.status && json.status !== "OK" && json.status !== "ZERO_RESULTS") {
    throw new Error(json.error_message || json.status);
  }
  return json;
}

export async function GET(request: NextRequest) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY tanımlı değil. .env.local dosyasına ekleyin." },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const lang = searchParams.get("lang")?.startsWith("tr") ? "tr" : "en";

  try {
    if (type === "autocomplete") {
      const input = searchParams.get("input")?.trim() ?? "";
      if (input.length < 2) {
        return NextResponse.json({ suggestions: [] });
      }

      const lat = searchParams.get("lat");
      const lng = searchParams.get("lng");
      const params = new URLSearchParams({
        input,
        key: apiKey,
        language: lang,
      });
      if (lat && lng) {
        params.set("location", `${lat},${lng}`);
        params.set("radius", "50000");
      }

      const data = await googleGet<{ predictions: GoogleAutocompletePrediction[] }>(
        `${GOOGLE_BASE}/autocomplete/json?${params.toString()}`,
      );

      const suggestions = (data.predictions ?? []).map((item) => ({
        placeId: item.place_id,
        mainText: item.structured_formatting?.main_text ?? item.description,
        secondaryText: item.structured_formatting?.secondary_text ?? "",
        description: item.description,
      }));

      return NextResponse.json({ suggestions });
    }

    if (type === "details") {
      const placeId = searchParams.get("placeId");
      if (!placeId) {
        return NextResponse.json({ error: "placeId gerekli." }, { status: 400 });
      }

      const params = new URLSearchParams({
        place_id: placeId,
        fields: "place_id,name,geometry,formatted_address,types",
        key: apiKey,
        language: lang,
      });

      const data = await googleGet<{ result: GooglePlaceResult }>(
        `${GOOGLE_BASE}/details/json?${params.toString()}`,
      );

      const result = data.result;
      const lat = result.geometry?.location?.lat;
      const lng = result.geometry?.location?.lng;
      if (lat == null || lng == null) {
        return NextResponse.json({ error: "Mekan koordinatları alınamadı." }, { status: 502 });
      }

      return NextResponse.json({
        place: {
          placeId: result.place_id,
          name: result.name,
          lat,
          lng,
          address: result.formatted_address ?? "",
          types: result.types ?? [],
        },
      });
    }

    if (type === "nearby") {
      const north = searchParams.get("north");
      const east = searchParams.get("east");
      const south = searchParams.get("south");
      const west = searchParams.get("west");

      let lat: number;
      let lng: number;
      let radius: number;

      if (north && east && south && west) {
        const n = Number(north);
        const e = Number(east);
        const s = Number(south);
        const w = Number(west);
        lat = (n + s) / 2;
        lng = (e + w) / 2;
        const cornerDistance = haversineMeters(n, e, s, w);
        radius = Math.min(Math.max(Math.round(cornerDistance / 2), 400), 8000);
      } else {
        lat = Number(searchParams.get("lat"));
        lng = Number(searchParams.get("lng"));
        radius = Math.min(Number(searchParams.get("radius") ?? 1200), 8000);
      }

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return NextResponse.json({ error: "Geçerli konum gerekli." }, { status: 400 });
      }

      const merged = new Map<string, GooglePlaceResult>();

      await Promise.all(
        NEARBY_TYPES.map(async (placeType) => {
          const params = new URLSearchParams({
            location: `${lat},${lng}`,
            radius: String(radius),
            type: placeType,
            key: apiKey,
            language: lang,
          });
          try {
            const data = await googleGet<{ results: GooglePlaceResult[] }>(
              `${GOOGLE_BASE}/nearbysearch/json?${params.toString()}`,
            );
            for (const item of data.results ?? []) {
              if (!merged.has(item.place_id)) merged.set(item.place_id, item);
            }
          } catch {
            // Tek tip başarısız olursa diğer tiplerle devam et
          }
        }),
      );

      const places = Array.from(merged.values())
        .filter((item) => item.geometry?.location)
        .slice(0, 40)
        .map((item) => ({
          placeId: item.place_id,
          name: item.name,
          lat: item.geometry!.location!.lat,
          lng: item.geometry!.location!.lng,
          types: item.types ?? [],
        }));

      return NextResponse.json({ places });
    }

    return NextResponse.json({ error: "Geçersiz type parametresi." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Places API hatası.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
