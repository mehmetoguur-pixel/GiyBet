import { NextRequest, NextResponse } from "next/server";

type NominatimReverseAddress = Record<string, string>;

type NominatimReverseResult = {
  display_name?: string;
  address?: NominatimReverseAddress;
};

type BigDataCloudReverse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  localityInfo?: {
    administrative?: Array<{ name?: string; order?: number }>;
  };
};

function pickAddressPart(address: NominatimReverseAddress, keys: string[]): string {
  for (const key of keys) {
    const value = address[key]?.trim();
    if (value) return value;
  }
  return "";
}

function parseDisplayName(displayName?: string) {
  if (!displayName) return { cityLabel: "", district: "" };
  const parts = displayName
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) {
    return { cityLabel: parts[0] ?? "", district: "" };
  }
  return {
    district: parts[0],
    cityLabel: parts[1],
  };
}

function parseReverseAddress(
  address: NominatimReverseAddress | undefined,
  displayName?: string,
) {
  if (!address) {
    return parseDisplayName(displayName);
  }

  const cityLabel = pickAddressPart(address, [
    "province",
    "state",
    "city",
    "town",
    "municipality",
    "region",
  ]);

  const district = pickAddressPart(address, [
    "city_district",
    "suburb",
    "borough",
    "county",
    "district",
    "neighbourhood",
    "quarter",
    "hamlet",
    "village",
  ]);

  if (cityLabel && district) {
    const same =
      cityLabel.localeCompare(district, "tr", { sensitivity: "accent" }) === 0;
    if (same) {
      const finer = pickAddressPart(address, [
        "neighbourhood",
        "quarter",
        "suburb",
        "hamlet",
      ]);
      if (
        finer &&
        finer.localeCompare(cityLabel, "tr", { sensitivity: "accent" }) !== 0
      ) {
        return { cityLabel, district: finer };
      }
    }
    return { cityLabel, district };
  }

  if (cityLabel) return { cityLabel, district: district || cityLabel };
  if (district) return { cityLabel: district, district };

  return parseDisplayName(displayName);
}

function parseBigDataCloud(data: BigDataCloudReverse) {
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

  return { cityLabel, district };
}

function resolveApiLanguage(param: string | null): string {
  const lang = param?.trim().toLowerCase() ?? "";
  return lang.startsWith("tr") ? "tr" : "en";
}

function mapCityLabelToFeedCity(cityLabel: string): string {
  return cityLabel.trim() || "Unknown";
}

async function reverseWithNominatim(lat: number, lon: number, lang: string) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", lang);
  url.searchParams.set("zoom", "14");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "GiyBet/1.0 (reverse geocode; contact@giybet.local)",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as NominatimReverseResult;
  const { cityLabel, district } = parseReverseAddress(data.address, data.display_name);
  if (!cityLabel && !district) return null;

  const resolvedCityLabel = cityLabel || district;
  const resolvedDistrict = district || cityLabel;

  return {
    cityLabel: resolvedCityLabel,
    district: resolvedDistrict,
    city: mapCityLabelToFeedCity(resolvedCityLabel),
  };
}

async function reverseWithBigDataCloud(lat: number, lon: number, lang: string) {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("localityLanguage", lang);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) return null;

  const data = (await response.json()) as BigDataCloudReverse;
  const { cityLabel, district } = parseBigDataCloud(data);
  if (!cityLabel && !district) return null;

  const resolvedCityLabel = cityLabel || district;
  const resolvedDistrict = district || cityLabel;

  return {
    cityLabel: resolvedCityLabel,
    district: resolvedDistrict,
    city: mapCityLabelToFeedCity(resolvedCityLabel),
  };
}

export async function GET(request: NextRequest) {
  const latParam = request.nextUrl.searchParams.get("lat");
  const lonParam = request.nextUrl.searchParams.get("lon");
  const lang = resolveApiLanguage(request.nextUrl.searchParams.get("lang"));
  const lat = latParam != null ? Number(latParam) : NaN;
  const lon = lonParam != null ? Number(lonParam) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Geçersiz koordinat." }, { status: 400 });
  }

  try {
    const nominatim = await reverseWithNominatim(lat, lon, lang);
    if (nominatim) return NextResponse.json(nominatim);

    const bigData = await reverseWithBigDataCloud(lat, lon, lang);
    if (bigData) return NextResponse.json(bigData);

    return NextResponse.json({ error: "Konum çözümlenemedi." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Konum bilgisi alınamadı." }, { status: 502 });
  }
}
