"use client";

import type { GeoCoords } from "@/lib/giybet/types";
import type { PlaceDetail } from "@/lib/places-api";
import { useI18n } from "@/lib/i18n/provider";
import { VenueCombobox } from "@/components/map/VenueCombobox";

export function PlaceSearchBar({
  userLocation,
  onSelectPlace,
  inputClass,
}: {
  userLocation: GeoCoords | null;
  onSelectPlace: (place: PlaceDetail) => void;
  inputClass: string;
}) {
  const { t } = useI18n();
  return (
    <VenueCombobox
      userLocation={userLocation}
      fallbackVenues={[]}
      selected={null}
      onSelect={(place) => place && onSelectPlace(place)}
      inputClass={inputClass}
      label={t("venue.searchLabel")}
      placeholder={t("venue.searchPlaceholderLong")}
      clearOnSelect={false}
    />
  );
}
