import type { PlaceDetail } from "./places-api";

export type NominatimVenueSuggestion = {
  placeId: string;
  displayName: string;
  name: string;
  lat: number;
  lng: number;
  distanceMeters?: number | null;
  distanceLabel?: string | null;
};

type NominatimSearchResponse = {
  results: NominatimVenueSuggestion[];
};

type NominatimApiError = {
  error: string;
};

export function isNominatimPlaceId(placeId: string): boolean {
  return placeId.startsWith("nominatim:");
}

export function isPersistableGooglePlaceId(placeId: string): boolean {
  return (
    !placeId.startsWith("local:") &&
    !placeId.startsWith("nominatim:") &&
    !placeId.startsWith("osm:")
  );
}

export function shortNameFromDisplayName(displayName: string): string {
  const first = displayName.split(",")[0]?.trim();
  return first || displayName;
}

export function nominatimSuggestionToPlaceDetail(
  suggestion: NominatimVenueSuggestion,
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

export async function searchNominatimPlaces(
  query: string,
  lat?: number,
  lng?: number,
  language = "tr",
): Promise<NominatimVenueSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({ q: trimmed, lang: language });
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    params.set("lat", String(lat));
    params.set("lon", String(lng));
  }
  const response = await fetch(`/api/nominatim/search?${params.toString()}`);
  const json = (await response.json()) as NominatimSearchResponse | NominatimApiError;

  if (!response.ok || (json && typeof json === "object" && "error" in json)) {
    throw new Error(
      json && typeof json === "object" && "error" in json
        ? json.error
        : "Mekan araması başarısız.",
    );
  }

  return (json as NominatimSearchResponse).results;
}

export type NominatimReverseLocation = {
  cityLabel: string;
  district: string;
  city: string;
};

export async function reverseGeocodeNominatim(
  lat: number,
  lng: number,
  language = "tr",
): Promise<NominatimReverseLocation | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      lang: language,
    });
    const response = await fetch(`/api/nominatim/reverse?${params.toString()}`);
    const json = (await response.json()) as NominatimReverseLocation | { error: string };

    if (response.ok && !("error" in json)) {
      return json as NominatimReverseLocation;
    }

    console.warn(
      "Konum API yanıtı başarısız, istemci yedeklemesi deneniyor:",
      "error" in json ? json.error : `HTTP ${response.status}`,
    );
  } catch (err) {
    console.warn("Konum API erişilemedi, istemci yedeklemesi deneniyor:", err);
  }

  return reverseGeocodeBigDataCloudClient(lat, lng, language);
}

async function reverseGeocodeBigDataCloudClient(
  lat: number,
  lng: number,
  language = "tr",
): Promise<NominatimReverseLocation | null> {
  try {
    const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("localityLanguage", language);

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = (await response.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      localityInfo?: { administrative?: Array<{ name?: string; order?: number }> };
    };

    const cityLabel =
      data.principalSubdivision?.trim() ||
      data.city?.trim() ||
      "";
    const district =
      data.locality?.trim() ||
      data.city?.trim() ||
      data.localityInfo?.administrative
        ?.sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
        .find((entry) => entry.name && entry.name !== cityLabel)?.name?.trim() ||
      "";

    if (!cityLabel && !district) return null;

    const resolvedCityLabel = cityLabel || district;
    const resolvedDistrict = district || cityLabel;

    return {
      cityLabel: resolvedCityLabel,
      district: resolvedDistrict,
      city: resolvedCityLabel,
    };
  } catch (err) {
    console.warn("Konum çözümlenemedi:", err);
    return null;
  }
}
