import type { PlaceDetail } from "./places-api";

export type VenueSearchSuggestion = {
  placeId: string;
  displayName: string;
  name: string;
  lat: number;
  lng: number;
  distanceMeters?: number | null;
  distanceLabel?: string | null;
};

type TomTomSearchResponse = {
  results: VenueSearchSuggestion[];
};

type TomTomApiError = {
  error: string;
};

export function isPersistableGooglePlaceId(placeId: string): boolean {
  return (
    !placeId.startsWith("local:") &&
    !placeId.startsWith("nominatim:") &&
    !placeId.startsWith("tomtom:") &&
    !placeId.startsWith("osm:")
  );
}

export function venueSuggestionToPlaceDetail(
  suggestion: VenueSearchSuggestion,
): PlaceDetail {
  return {
    placeId: suggestion.placeId,
    name: suggestion.name,
    lat: suggestion.lat,
    lng: suggestion.lng,
    address: suggestion.displayName,
    types: ["establishment"],
  };
}

export async function searchTomTomPlaces(
  query: string,
  lat?: number,
  lng?: number,
  language = "tr-TR",
): Promise<VenueSearchSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({ q: trimmed, lang: language });
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    params.set("lat", String(lat));
    params.set("lon", String(lng));
  }

  const response = await fetch(`/api/tomtom/search?${params.toString()}`);
  const json = (await response.json()) as TomTomSearchResponse | TomTomApiError;

  if (!response.ok || (json && typeof json === "object" && "error" in json)) {
    throw new Error(
      json && typeof json === "object" && "error" in json
        ? json.error
        : "Mekan araması başarısız.",
    );
  }

  return (json as TomTomSearchResponse).results;
}
