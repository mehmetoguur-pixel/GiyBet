"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildAvatarSrc } from "@/lib/avatar";
import {
  AVATAR_MARKER_PX,
  HOT_MARKER_PX,
  PLACE_MARKER_PX,
  ROOM_MARKER_PX,
  SELECTED_PLACE_MARKER_PX,
  buildAvatarMarkerHtml,
  buildNearbyPlaceMarkerHtml,
  buildRoomMarkerHtml,
  buildSelectedPlaceMarkerHtml,
} from "@/lib/avatar/markers";
import { MAP_GOSSIP_PINS_MIN_ZOOM, WORLD_MAP_CENTER } from "@/lib/map/constants";
import type { GeoCoords, MapBounds, MapPin, MapRoom } from "@/lib/giybet/types";
import type { NearbyPlace, PlaceDetail } from "@/lib/places-api";
import { placeTypeEmoji } from "@/lib/places-api";
import { useI18n } from "@/lib/i18n/provider";

export function GiybetMap({
  active,
  pins,
  rooms,
  nearbyPlaces,
  selectedPlace,
  flyTarget,
  flyZoom = 13,
  fitAllPinsNonce,
  highlightedRoomId,
  currentUser,
  userLocation,
  userCity: _userCity,
  onPinSelect,
  onMapClick,
  onRoomSelect,
  onNearbyPlaceClick,
  onBoundsChange,
}: {
  active: boolean;
  pins: MapPin[];
  rooms: MapRoom[];
  nearbyPlaces: NearbyPlace[];
  selectedPlace: PlaceDetail | null;
  flyTarget: GeoCoords | null;
  flyZoom?: number;
  fitAllPinsNonce?: number;
  highlightedRoomId?: string | null;
  currentUser: string;
  userLocation: GeoCoords | null;
  userCity: string | null;
  onPinSelect: (pin: MapPin) => void;
  onMapClick: (coords: GeoCoords) => void;
  onRoomSelect: (room: MapRoom) => void;
  onNearbyPlaceClick: (place: NearbyPlace) => void;
  onBoundsChange: (bounds: MapBounds, zoom: number) => void;
}) {
  const { t } = useI18n();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const onPinSelectRef = useRef(onPinSelect);
  const onMapClickRef = useRef(onMapClick);
  const onRoomSelectRef = useRef(onRoomSelect);
  const onNearbyPlaceClickRef = useRef(onNearbyPlaceClick);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const hasInitialFitRef = useRef(false);
  const prevPinCountRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(6);
  const showGossipPins = currentZoom >= MAP_GOSSIP_PINS_MIN_ZOOM;

  const fitMapToAllPins = useCallback(() => {
    const map = mapRef.current;
    if (!map || pins.length === 0) return;
    const lats = pins.map((p) => p.lat);
    const lngs = pins.map((p) => p.lng);
    const south = Math.min(...lats);
    const north = Math.max(...lats);
    const west = Math.min(...lngs);
    const east = Math.max(...lngs);
    map.fitBounds(
      [
        [south, west],
        [north, east],
      ],
      { padding: [48, 48], maxZoom: 7, animate: true, duration: 0.75 },
    );
  }, [pins]);

  useEffect(() => {
    onPinSelectRef.current = onPinSelect;
  }, [onPinSelect]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    onRoomSelectRef.current = onRoomSelect;
  }, [onRoomSelect]);

  useEffect(() => {
    onNearbyPlaceClickRef.current = onNearbyPlaceClick;
  }, [onNearbyPlaceClick]);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    if (!active || !mapContainerRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapContainerRef.current) return;

      if (mapRef.current) {
        mapRef.current.invalidateSize();
        setMapReady(true);
        return;
      }

      const initialCenter: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : WORLD_MAP_CENTER;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: userLocation ? 13 : 3,
        zoomControl: true,
        scrollWheelZoom: true,
        minZoom: 2,
        maxZoom: 19,
        worldCopyJump: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);
      window.setTimeout(() => map.invalidateSize(), 200);
    };

    initMap();

    return () => {
      cancelled = true;
    };
  }, [active, userLocation]);

  useEffect(() => {
    if (!active || !mapReady || !mapRef.current || hasInitialFitRef.current) return;
    hasInitialFitRef.current = true;
    if (pins.length > 0) {
      fitMapToAllPins();
    } else if (userLocation) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 13, { duration: 0.75 });
    }
  }, [active, mapReady, pins, userLocation, fitMapToAllPins]);

  useEffect(() => {
    if (!active || !mapReady || !mapRef.current || !flyTarget) return;
    mapRef.current.flyTo([flyTarget.lat, flyTarget.lng], flyZoom, { duration: 0.75 });
  }, [active, mapReady, flyTarget, flyZoom]);

  useEffect(() => {
    if (!active || !mapReady || !mapRef.current || !fitAllPinsNonce) return;
    fitMapToAllPins();
  }, [active, mapReady, fitAllPinsNonce, fitMapToAllPins]);

  useEffect(() => {
    if (!active || !mapReady || !mapRef.current) return;
    const prev = prevPinCountRef.current;
    if (pins.length > prev && pins.length >= 24 && prev < 24) {
      fitMapToAllPins();
    }
    prevPinCountRef.current = pins.length;
  }, [active, mapReady, pins.length, fitMapToAllPins]);

  useEffect(() => {
    if (!active || !mapReady || !mapRef.current) return;
    const map = mapRef.current;

    const emitView = () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      setCurrentZoom(zoom);
      onBoundsChangeRef.current(
        {
          north: bounds.getNorth(),
          east: bounds.getEast(),
          south: bounds.getSouth(),
          west: bounds.getWest(),
        },
        zoom,
      );
    };

    const handleMapClick = (event: import("leaflet").LeafletMouseEvent) => {
      onMapClickRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    };

    map.on("click", handleMapClick);
    map.on("moveend", emitView);
    map.on("zoomend", emitView);
    emitView();

    return () => {
      map.off("click", handleMapClick);
      map.off("moveend", emitView);
      map.off("zoomend", emitView);
    };
  }, [active, mapReady]);

  useEffect(() => {
    if (!active || !mapReady || !mapRef.current) return;

    let cancelled = false;

    const syncMarkers = async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;

      if (!markersLayerRef.current) {
        markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      markersLayerRef.current.clearLayers();

      const roomPlaceIds = new Set(rooms.map((room) => room.placeId).filter(Boolean));

      if (userLocation) {
        const userIcon = L.divIcon({
          className: "giybet-user-location-wrapper",
          html: '<div class="giybet-user-loc-pulse"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(markersLayerRef.current);
      }

      nearbyPlaces.forEach((place) => {
        if (!showGossipPins || roomPlaceIds.has(place.placeId)) return;
        const emoji = placeTypeEmoji(place.types);
        const icon = L.divIcon({
          className: "giybet-place-pin-wrapper",
          html: buildNearbyPlaceMarkerHtml(place.name, emoji),
          iconSize: [PLACE_MARKER_PX, PLACE_MARKER_PX],
          iconAnchor: [PLACE_MARKER_PX / 2, PLACE_MARKER_PX / 2],
        });
        L.marker([place.lat, place.lng], { icon, zIndexOffset: 500 })
          .on("click", (event) => {
            event.originalEvent.stopPropagation();
            onNearbyPlaceClickRef.current(place);
          })
          .addTo(markersLayerRef.current!);
      });

      if (selectedPlace) {
        const emoji = placeTypeEmoji(selectedPlace.types);
        const icon = L.divIcon({
          className: "giybet-selected-place-pin-wrapper",
          html: buildSelectedPlaceMarkerHtml(selectedPlace.name, emoji),
          iconSize: [SELECTED_PLACE_MARKER_PX, SELECTED_PLACE_MARKER_PX],
          iconAnchor: [SELECTED_PLACE_MARKER_PX / 2, SELECTED_PLACE_MARKER_PX / 2],
        });
        L.marker([selectedPlace.lat, selectedPlace.lng], { icon, zIndexOffset: 900 })
          .addTo(markersLayerRef.current!);
      }

      if (showGossipPins) {
        rooms.forEach((room) => {
          const isHighlighted = highlightedRoomId === room.id;
          const icon = L.divIcon({
            className: "giybet-room-pin-wrapper",
            html: buildRoomMarkerHtml(room.name, isHighlighted),
            iconSize: [ROOM_MARKER_PX, ROOM_MARKER_PX],
            iconAnchor: [ROOM_MARKER_PX / 2, ROOM_MARKER_PX / 2],
            popupAnchor: [0, -ROOM_MARKER_PX / 2 - 4],
          });
          L.marker([room.lat, room.lng], { icon, zIndexOffset: isHighlighted ? 950 : 800 })
            .on("click", (event) => {
              event.originalEvent.stopPropagation();
              onRoomSelectRef.current(room);
            })
            .addTo(markersLayerRef.current!);
        });

        pins.forEach((pin) => {
          const isSelf = pin.isUserPin ?? pin.author === currentUser;
          const isHot = pin.isHot ?? false;
          const avatarUrl = buildAvatarSrc(pin.avatar);
          const size = isHot ? HOT_MARKER_PX : AVATAR_MARKER_PX;
          const icon = L.divIcon({
            className: "giybet-pin-wrapper",
            html: buildAvatarMarkerHtml(avatarUrl, isSelf, isHot),
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2 - 6],
          });

          L.marker([pin.lat, pin.lng], { icon })
            .on("click", (event) => {
              event.originalEvent.stopPropagation();
              onPinSelectRef.current(pin);
            })
            .addTo(markersLayerRef.current!);
        });
      }
    };

    syncMarkers();

    return () => {
      cancelled = true;
    };
  }, [active, mapReady, pins, rooms, nearbyPlaces, selectedPlace, highlightedRoomId, currentUser, userLocation, showGossipPins]);

  useEffect(() => {
    if (!active) {
      queueMicrotask(() => setMapReady(false));
    }
    return () => {
      markersLayerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      queueMicrotask(() => setMapReady(false));
    };
  }, [active]);

  return (
    <div className="relative min-h-[420px] w-full overflow-hidden rounded-2xl border border-purple-500/45 bg-[#08080f] shadow-[0_0_40px_rgba(168,85,247,0.2)] ring-1 ring-pink-500/20">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-[#08080f]/90 to-transparent px-4 py-3">
        <p className="text-xs font-medium tracking-widest text-purple-300/80 uppercase">
          {t("map.mapTitle")}
        </p>
        <p className="text-[11px] text-zinc-500">
          {showGossipPins ? t("map.pinsVisibleHint") : t("map.pinsHiddenHint")}
        </p>
      </div>
      {!showGossipPins && (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 z-10 flex justify-center px-4">
          <p className="rounded-full border border-purple-500/45 bg-[#12121a]/95 px-4 py-2 text-center text-xs text-purple-200 shadow-[0_0_24px_rgba(168,85,247,0.35)]">
            🔍 {t("map.zoomHintBanner")}
          </p>
        </div>
      )}
      <div ref={mapContainerRef} className="h-[calc(100vh-280px)] min-h-[420px] w-full" />
    </div>
  );
}
