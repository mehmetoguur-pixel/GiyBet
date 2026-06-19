"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatFeedCityLabel } from "@/lib/feed/format";
import {
  coordsMovedSignificantly,
  detectCityFromCoords,
  getNearbyVenues,
  requestGeolocation,
  resolveLocationFromGps,
} from "@/lib/geo";
import { DEFAULT_GOSSIP_LOCATION } from "@/lib/gossip/constants";
import type { GeoCoords, NearbyVenue } from "@/lib/giybet/types";

type UseFeedGeoOptions = {
  geoLanguage: string;
  t: (key: string) => string;
  onOpenMap?: () => void;
};

export function useFeedGeo({ geoLanguage, t, onOpenMap }: UseFeedGeoOptions) {
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [geoError, setGeoError] = useState("");
  const [geoCoords, setGeoCoords] = useState<GeoCoords | null>(null);
  const [nearbyVenues, setNearbyVenues] = useState<NearbyVenue[]>([]);
  const [userCity, setUserCity] = useState<string | null>(null);

  const geoCoordsRef = useRef<GeoCoords | null>(null);
  const geoLanguageRef = useRef(geoLanguage);
  const geocodeSeqRef = useRef(0);
  const onOpenMapRef = useRef(onOpenMap);
  onOpenMapRef.current = onOpenMap;
  geoLanguageRef.current = geoLanguage;

  const refreshLocationLabel = useCallback((coords: GeoCoords) => {
    const fastCity =
      formatFeedCityLabel(detectCityFromCoords(coords.lat, coords.lng)) ?? null;
    setUserCity(fastCity);

    const seq = ++geocodeSeqRef.current;
    void resolveLocationFromGps(coords.lat, coords.lng, { language: geoLanguageRef.current }).then(
      (loc) => {
        if (seq !== geocodeSeqRef.current) return;
        setUserCity(loc.locationLabel || loc.cityLabel || fastCity);
      },
    );
  }, []);

  const applyUserLocation = useCallback(
    (coords: GeoCoords, openMap = false, force = false) => {
      if (!force && !coordsMovedSignificantly(geoCoordsRef.current, coords)) {
        if (openMap) onOpenMapRef.current?.();
        return false;
      }

      geoCoordsRef.current = coords;
      setGeoCoords(coords);
      setGeoStatus("success");
      setGeoError("");
      setNearbyVenues(getNearbyVenues(coords.lat, coords.lng));
      refreshLocationLabel(coords);
      if (openMap) onOpenMapRef.current?.();
      return true;
    },
    [refreshLocationLabel],
  );

  const applyUserLocationRef = useRef(applyUserLocation);
  applyUserLocationRef.current = applyUserLocation;

  useEffect(() => {
    let cancelled = false;

    setGeoStatus("loading");
    requestGeolocation({ highAccuracy: true, maximumAge: 0 })
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
      const coords = await requestGeolocation({ highAccuracy: true, maximumAge: 0 });
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
