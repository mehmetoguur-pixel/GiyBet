"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchNearbyPlaces,
  fetchNearbyPlacesInBounds,
  getPlaceDetails,
  type NearbyPlace,
  type PlaceDetail,
} from "@/lib/places-api";
import { MAP_GOSSIP_PINS_MIN_ZOOM } from "@/lib/map/constants";
import { isMapPinWithinWindow } from "@/lib/map/pin-age";
import { isCoordInMapBounds } from "@/lib/geo";
import { findRoomByPlaceIdLocal } from "@/lib/rooms/api";
import type {
  FeedViewTab,
  GeoCoords,
  MapBounds,
  MapPin,
  MapRoom,
  MapShareTarget,
} from "@/lib/giybet/types";

type UseMapViewportOptions = {
  geoCoords: GeoCoords | null;
  feedTab: FeedViewTab;
  placesLanguage: string;
  mapPins: MapPin[];
  blockedAuthors: Set<string>;
  followingAuthors?: Set<string>;
  mapFollowingOnly?: boolean;
  rooms: MapRoom[];
  onCreateRoomAtPlace: (place: PlaceDetail) => Promise<MapRoom | null>;
};

export function useMapViewport({
  geoCoords,
  feedTab,
  placesLanguage,
  mapPins,
  blockedAuthors,
  followingAuthors,
  mapFollowingOnly = false,
  rooms,
  onCreateRoomAtPlace,
}: UseMapViewportOptions) {
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetail | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [mapFlyTarget, setMapFlyTarget] = useState<GeoCoords | null>(null);
  const [mapFlyZoom, setMapFlyZoom] = useState(13);
  const [mapFitAllNonce, setMapFitAllNonce] = useState(0);
  const [mapViewportBounds, setMapViewportBounds] = useState<MapBounds | null>(null);
  const [mapZoom, setMapZoom] = useState(6);
  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null);
  const [roomCreateLoading, setRoomCreateLoading] = useState(false);
  const [selectedMapPin, setSelectedMapPin] = useState<MapPin | null>(null);
  const [mapShareTarget, setMapShareTarget] = useState<MapShareTarget | null>(null);

  const highlightRoomTimeoutRef = useRef<number | null>(null);
  const boundsScanTimerRef = useRef<number | null>(null);

  const focusPlaceOnMap = useCallback((place: PlaceDetail) => {
    setSelectedPlace(place);
    setMapFlyZoom(14);
    setMapFlyTarget({ lat: place.lat, lng: place.lng });
  }, []);

  const handleSelectPlaceFromSearch = useCallback(
    (place: PlaceDetail) => {
      focusPlaceOnMap(place);
    },
    [focusPlaceOnMap],
  );

  const handleNearbyPlaceClick = useCallback(
    async (place: NearbyPlace) => {
      try {
        const detail = await getPlaceDetails(place.placeId);
        focusPlaceOnMap(detail);
      } catch {
        focusPlaceOnMap({
          placeId: place.placeId,
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          address: place.name,
          types: place.types,
        });
      }
    },
    [focusPlaceOnMap],
  );

  const handleMapBoundsChange = useCallback(
    (bounds: MapBounds, zoom: number) => {
      setMapViewportBounds(bounds);
      setMapZoom(zoom);
      if (boundsScanTimerRef.current != null) {
        window.clearTimeout(boundsScanTimerRef.current);
      }
      if (zoom < MAP_GOSSIP_PINS_MIN_ZOOM) return;
      boundsScanTimerRef.current = window.setTimeout(async () => {
        try {
          const places = await fetchNearbyPlacesInBounds(
            bounds.north,
            bounds.east,
            bounds.south,
            bounds.west,
            placesLanguage,
          );
          setNearbyPlaces(places);
        } catch {
          // API key yoksa veya ağ hatasında sessizce devam et
        }
      }, 450);
    },
    [placesLanguage],
  );

  useEffect(() => {
    if (!geoCoords || feedTab !== "map") return;
    fetchNearbyPlaces(geoCoords.lat, geoCoords.lng, 1500, placesLanguage)
      .then(setNearbyPlaces)
      .catch(() => {});
  }, [geoCoords, feedTab, placesLanguage]);

  useEffect(() => {
    return () => {
      if (boundsScanTimerRef.current != null) {
        window.clearTimeout(boundsScanTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (highlightRoomTimeoutRef.current != null) {
        window.clearTimeout(highlightRoomTimeoutRef.current);
      }
    };
  }, []);

  const selectedPlaceHasRoom = selectedPlace
    ? Boolean(findRoomByPlaceIdLocal(rooms, selectedPlace.placeId))
    : false;

  const handleOpenRoomAtSelectedPlace = async () => {
    if (!selectedPlace || roomCreateLoading) return;
    setRoomCreateLoading(true);
    try {
      await onCreateRoomAtPlace(selectedPlace);
    } finally {
      setRoomCreateLoading(false);
    }
  };

  const handleShareAtSelectedPlace = () => {
    if (!selectedPlace) return;
    const existing = findRoomByPlaceIdLocal(rooms, selectedPlace.placeId);
    setMapShareTarget({
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
      placeId: selectedPlace.placeId,
      placeName: selectedPlace.name,
      roomId: existing?.id ?? null,
    });
  };

  const mapDisplayPins = useMemo(() => {
    if (mapZoom < MAP_GOSSIP_PINS_MIN_ZOOM || !mapViewportBounds) return [];
    return mapPins
      .filter((pin) => isMapPinWithinWindow(pin.createdAt))
      .filter((pin) => !blockedAuthors.has(pin.author.trim()))
      .filter((pin) => {
        if (!mapFollowingOnly || !followingAuthors) return true;
        return followingAuthors.has(pin.author.trim());
      })
      .filter((pin) => isCoordInMapBounds(pin.lat, pin.lng, mapViewportBounds));
  }, [mapPins, blockedAuthors, followingAuthors, mapFollowingOnly, mapZoom, mapViewportBounds]);

  useEffect(() => {
    if (!selectedMapPin) return;
    if (!isMapPinWithinWindow(selectedMapPin.createdAt)) {
      setSelectedMapPin(null);
    }
  }, [selectedMapPin, mapPins]);

  const pinsInMapViewport = mapDisplayPins;
  const mapPinsVisible = mapZoom >= MAP_GOSSIP_PINS_MIN_ZOOM;

  const highlightRoom = useCallback((roomId: string, durationMs = 10000) => {
    setHighlightedRoomId(roomId);
    if (highlightRoomTimeoutRef.current != null) {
      window.clearTimeout(highlightRoomTimeoutRef.current);
    }
    highlightRoomTimeoutRef.current = window.setTimeout(() => {
      setHighlightedRoomId(null);
      highlightRoomTimeoutRef.current = null;
    }, durationMs);
  }, []);

  return {
    selectedPlace,
    setSelectedPlace,
    nearbyPlaces,
    mapFlyTarget,
    setMapFlyTarget,
    mapFlyZoom,
    setMapFlyZoom,
    mapFitAllNonce,
    setMapFitAllNonce,
    highlightedRoomId,
    setHighlightedRoomId,
    roomCreateLoading,
    selectedMapPin,
    setSelectedMapPin,
    mapShareTarget,
    setMapShareTarget,
    selectedPlaceHasRoom,
    mapDisplayPins,
    pinsInMapViewport,
    mapPinsVisible,
    focusPlaceOnMap,
    handleSelectPlaceFromSearch,
    handleNearbyPlaceClick,
    handleMapBoundsChange,
    handleOpenRoomAtSelectedPlace,
    handleShareAtSelectedPlace,
    highlightRoom,
    highlightRoomTimeoutRef,
  };
}
