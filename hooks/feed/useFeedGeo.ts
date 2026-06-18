"use client";

import { useCallback, useEffect, useState } from "react";
import { reverseGeocodeNominatim } from "@/lib/nominatim-api";
import { formatFeedCityLabel } from "@/lib/feed/format";
import {
  detectCityFromCoords,
  getNearbyVenues,
  requestGeolocation,
} from "@/lib/geo";
import { DEFAULT_GOSSIP_LOCATION } from "@/lib/gossip/constants";
import type { GeoCoords, NearbyVenue } from "@/lib/giybet/types";

type UseFeedGeoOptions = {
  nominatimLanguage: string;
  t: (key: string) => string;
  onOpenMap?: () => void;
};

export function useFeedGeo({ nominatimLanguage, t, onOpenMap }: UseFeedGeoOptions) {
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [geoError, setGeoError] = useState("");
  const [geoCoords, setGeoCoords] = useState<GeoCoords | null>(null);
  const [nearbyVenues, setNearbyVenues] = useState<NearbyVenue[]>([]);
  const [userCity, setUserCity] = useState<string | null>(null);

  const applyUserLocation = useCallback(
    async (coords: GeoCoords, openMap = false) => {
      setGeoCoords(coords);
      const fastCity =
        formatFeedCityLabel(detectCityFromCoords(coords.lat, coords.lng)) ?? null;
      setUserCity(fastCity);
      setGeoStatus("success");
      setGeoError("");
      setNearbyVenues(getNearbyVenues(coords.lat, coords.lng));
      if (openMap) onOpenMap?.();

      void reverseGeocodeNominatim(coords.lat, coords.lng, nominatimLanguage).then(
        (geocoded) => {
          if (geocoded?.cityLabel) setUserCity(geocoded.cityLabel);
        },
      );
    },
    [nominatimLanguage, onOpenMap],
  );

  useEffect(() => {
    let cancelled = false;

    setGeoStatus("loading");
    requestGeolocation()
      .then((coords) => {
        if (!cancelled) applyUserLocation(coords);
      })
      .catch(() => {
        if (cancelled) return;
        setGeoStatus("error");
        setGeoError(
          "Konum izni verilmedi. Yakın mekanlar varsayılan bölgeye göre listeleniyor.",
        );
        applyUserLocation({
          lat: DEFAULT_GOSSIP_LOCATION.lat,
          lng: DEFAULT_GOSSIP_LOCATION.lng,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [applyUserLocation]);

  const handleRequestLocation = async () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoError(t("feed.geoNoSupport"));
      applyUserLocation(
        { lat: DEFAULT_GOSSIP_LOCATION.lat, lng: DEFAULT_GOSSIP_LOCATION.lng },
        true,
      );
      return;
    }

    setGeoStatus("loading");
    try {
      const coords = await requestGeolocation({ highAccuracy: true });
      applyUserLocation(coords, true);
    } catch {
      setGeoStatus("error");
      setGeoError(t("feed.geoDenied"));
      applyUserLocation(
        { lat: DEFAULT_GOSSIP_LOCATION.lat, lng: DEFAULT_GOSSIP_LOCATION.lng },
        true,
      );
    }
  };

  return {
    geoStatus,
    geoError,
    geoCoords,
    setGeoCoords,
    userCity,
    setUserCity,
    nearbyVenues,
    setGeoStatus,
    applyUserLocation,
    handleRequestLocation,
  };
}
