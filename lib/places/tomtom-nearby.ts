type TomTomNearbyResult = {
  id: string;
  poi?: { name?: string };
  position?: { lat: number; lon: number };
  entryTypes?: string[];
};

type TomTomNearbyResponse = {
  results?: TomTomNearbyResult[];
};

export function getTomTomApiKey(): string | null {
  return process.env.NEXT_PUBLIC_TOMTOM_KEY ?? process.env.TOMTOM_API_KEY ?? null;
}

export async function fetchTomTomNearbyPlaces(
  lat: number,
  lng: number,
  radius: number,
  lang: "tr" | "en",
): Promise<Array<{ placeId: string; name: string; lat: number; lng: number; types: string[] }>> {
  const key = getTomTomApiKey();
  if (!key) return [];

  const language = lang === "tr" ? "tr-TR" : "en-US";
  const url = new URL("https://api.tomtom.com/search/2/nearbySearch/.json");
  url.searchParams.set("key", key);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("radius", String(Math.min(Math.max(radius, 400), 8000)));
  url.searchParams.set("limit", "40");
  url.searchParams.set("language", language);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return [];

  const data = (await response.json()) as TomTomNearbyResponse;
  return (data.results ?? [])
    .map((item) => {
      const plat = item.position?.lat;
      const plng = item.position?.lon;
      if (plat == null || plng == null) return null;
      const name = item.poi?.name?.trim() || "Mekan";
      return {
        placeId: `tomtom:${item.id}`,
        name,
        lat: plat,
        lng: plng,
        types: item.entryTypes ?? [],
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);
}

export async function fetchTomTomAutocomplete(
  input: string,
  lat?: number,
  lng?: number,
  lang: "tr" | "en" = "tr",
): Promise<
  Array<{ placeId: string; mainText: string; secondaryText: string; description: string }>
> {
  const key = getTomTomApiKey();
  if (!key || input.length < 2) return [];

  const language = lang === "tr" ? "tr-TR" : "en-US";
  const url = new URL(
    `https://api.tomtom.com/search/2/search/${encodeURIComponent(input)}.json`,
  );
  url.searchParams.set("key", key);
  url.searchParams.set("language", language);
  url.searchParams.set("limit", "10");
  if (lat != null && lng != null) {
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("radius", "50000");
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return [];

  const data = (await response.json()) as {
    results?: Array<{
      id: string;
      poi?: { name?: string };
      address?: { freeformAddress?: string };
    }>;
  };

  return (data.results ?? []).map((item) => {
    const main =
      item.poi?.name?.trim() || item.address?.freeformAddress?.split(",")[0]?.trim() || input;
    const secondary = item.address?.freeformAddress?.trim() || "";
    return {
      placeId: `tomtom:${item.id}`,
      mainText: main,
      secondaryText: secondary,
      description: secondary ? `${main}, ${secondary}` : main,
    };
  });
}
