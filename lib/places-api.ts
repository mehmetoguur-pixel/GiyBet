export type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
};

export type PlaceDetail = {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  types: string[];
};

export type NearbyPlace = {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  types: string[];
};

type PlacesApiResponse<T> = T | { error: string };

async function placesFetch<T>(
  params: Record<string, string>,
  language = "tr",
): Promise<T> {
  const query = new URLSearchParams({ ...params, lang: language });
  const response = await fetch(`/api/places?${query.toString()}`);
  const json = (await response.json()) as PlacesApiResponse<T>;
  if (!response.ok || (json && typeof json === "object" && "error" in json)) {
    throw new Error(
      json && typeof json === "object" && "error" in json
        ? json.error
        : "Mekan servisi yanıt vermedi.",
    );
  }
  return json as T;
}

export async function autocompletePlaces(
  input: string,
  lat?: number,
  lng?: number,
  language = "tr",
): Promise<PlaceSuggestion[]> {
  const params: Record<string, string> = {
    type: "autocomplete",
    input,
  };
  if (lat != null && lng != null) {
    params.lat = String(lat);
    params.lng = String(lng);
  }
  const data = await placesFetch<{ suggestions: PlaceSuggestion[] }>(params, language);
  return data.suggestions;
}

export async function getPlaceDetails(placeId: string, language = "tr"): Promise<PlaceDetail> {
  const data = await placesFetch<{ place: PlaceDetail }>(
    {
      type: "details",
      placeId,
    },
    language,
  );
  return data.place;
}

export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radius = 1200,
  language = "tr",
): Promise<NearbyPlace[]> {
  const data = await placesFetch<{ places: NearbyPlace[] }>(
    {
      type: "nearby",
      lat: String(lat),
      lng: String(lng),
      radius: String(radius),
    },
    language,
  );
  return data.places;
}

export async function fetchNearbyPlacesInBounds(
  north: number,
  east: number,
  south: number,
  west: number,
  language = "tr",
): Promise<NearbyPlace[]> {
  const data = await placesFetch<{ places: NearbyPlace[] }>(
    {
      type: "nearby",
      north: String(north),
      east: String(east),
      south: String(south),
      west: String(west),
    },
    language,
  );
  return data.places;
}

export function placeTypeEmoji(types: string[]): string {
  if (types.includes("park")) return "🌳";
  if (types.includes("cafe") || types.includes("coffee_shop")) return "☕";
  if (types.includes("restaurant")) return "🍽️";
  if (types.includes("shopping_mall") || types.includes("store")) return "🛍️";
  if (types.includes("school") || types.includes("university")) return "🎓";
  if (types.includes("lodging")) return "🏨";
  if (types.includes("hospital")) return "🏥";
  if (types.includes("gym")) return "💪";
  return "📍";
}
