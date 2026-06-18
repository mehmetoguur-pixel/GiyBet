"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatFeedCityLabel } from "@/lib/feed/format";
import {
  coordsMovedSignificantly,
  detectCityFromCoords,
  getNearbyVenues,
  requestGeolocation,
} from "@/lib/geo";
import { DEFAULT_GOSSIP_LOCATION } from "@/lib/gossip/constants";
import type { GeoCoords, NearbyVenue } from "@/lib/giybet/types";

type UseFeedGeoOptions = {
  t: (key: string) => string;
  onOpenMap?: () => void;
};

export function useFeedGeo({ t, onOpenMap }: UseFeedGeoOptions) {
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [geoError, setGeoError] = useState("");
  const [geoCoords, setGeoCoords] = useState<GeoCoords | null>(null);
  const [nearbyVenues, setNearbyVenues] = useState<NearbyVenue[]>([]);
  const [userCity, setUserCity] = useState<string | null>(null);

  const geoCoordsRef = useRef<GeoCoords | null>(null);
  const onOpenMapRef = useRef(onOpenMap);
  onOpenMapRef.current = onOpenMap;

  const applyUserLocation = useCallback(
    (coords: GeoCoords, openMap = false, force = false) => {
      if (!force && !coordsMovedSignificantly(geoCoordsRef.current, coords)) {
        if (openMap) onOpenMapRef.current?.();
        return false;
      }

      geoCoordsRef.current = coords;
      setGeoCoords(coords);
      const fastCity =
        formatFeedCityLabel(detectCityFromCoords(coords.lat, coords.lng)) ?? null;
      setUserCity(fastCity);
      setGeoStatus("success");
      setGeoError("");
      setNearbyVenues(getNearbyVenues(coords.lat, coords.lng));
      if (openMap) onOpenMapRef.current?.();
      return true;
    },
    [],
  );

  const applyUserLocationRef = useRef(applyUserLocation);
  applyUserLocationRef.current = applyUserLocation;

  useEffect(() => {
    let cancelled = false;

    setGeoStatus("loading");
    requestGeolocation()
      .then((coords) => {
        if (!cancelled) applyUserLocationRef.current(coords, false, true);
      })
      .catch(() => {
        if (cancelled) return;
        setGeoStatus("error");
        setGeoError(
          "Konum izni verilmedi. Yakın mekanlar varsayılan bölgeye göre listeleniyor.",
        );
        applyUserLocationRef.current(
          {
            lat: DEFAULT_GOSSIP_LOCATION.lat,
            lng: DEFAULT_GOSSIP_LOCATION.lng,
          },
          false,
          true,
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRequestLocation = async () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoError(t("feed.geoNoSupport"));
      applyUserLocation(
        { lat: DEFAULT_GOSSIP_LOCATION.lat, lng: DEFAULT_GOSSIP_LOCATION.lng },
        true,
        true,
      );
      return;
    }

    setGeoStatus("loading");
    try {
      const coords = await requestGeolocation({ highAccuracy: true });
      applyUserLocation(coords, true, true);
    } catch {
      setGeoStatus("error");
      setGeoError(t("feed.geoDenied"));
      applyUserLocation(
        { lat: DEFAULT_GOSSIP_LOCATION.lat, lng: DEFAULT_GOSSIP_LOCATION.lng },
        true,
        true,
      );
    }
  };

  return {
    geoStatus,
    geoError,
    geoCoords,
    setGeoCoords: (coords: GeoCoords) => {
      applyUserLocation(coords, false, false);
    },
    userCity,
    setUserCity,
    nearbyVenues,
    setGeoStatus,
    applyUserLocation,
    handleRequestLocation,
  };
}
