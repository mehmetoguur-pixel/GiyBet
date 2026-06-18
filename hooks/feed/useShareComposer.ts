"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatFeedCityLabel,
  mockDistrictForCity,
  randomPostDistance,
} from "@/lib/feed/format";
import { extractHashtags } from "@/lib/feed/tags";
import {
  buildShareLocationFast,
  detectCityFromCoords,
  ensureCoordsForShare,
  haversineDistanceMeters,
} from "@/lib/geo";
import type { PlaceDetail } from "@/lib/places-api";
import type {
  FeedViewTab,
  GeoCoords,
  ShareCheckIn,
  ShareSuccessResult,
} from "@/lib/giybet/types";

type UseShareComposerOptions = {
  t: (key: string, params?: Record<string, string>) => string;
  geoCoords: GeoCoords | null;
  setGeoCoords: (coords: GeoCoords) => void;
  setUserCity: (city: string | null) => void;
  setGeoStatus: (status: "idle" | "loading" | "success" | "error") => void;
  handleShareWithChat: (payload: ShareCheckIn) => Promise<ShareSuccessResult | void>;
  focusPlaceOnMap: (place: PlaceDetail) => void;
  setFeedTab: (tab: FeedViewTab) => void;
  setMapFlyTarget: (target: GeoCoords) => void;
  highlightRoom: (roomId: string) => void;
};

export function useShareComposer({
  t,
  geoCoords,
  setGeoCoords,
  setUserCity,
  setGeoStatus,
  handleShareWithChat,
  focusPlaceOnMap,
  setFeedTab,
  setMapFlyTarget,
  highlightRoom,
}: UseShareComposerOptions) {
  const [draft, setDraft] = useState("");
  const [selectedFeedPlace, setSelectedFeedPlace] = useState<PlaceDetail | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [shareLocationPreview, setShareLocationPreview] = useState("");
  const [shareImagePreview, setShareImagePreview] = useState<string | null>(null);
  const [shareImageFile, setShareImageFile] = useState<File | null>(null);
  const shareFileInputRef = useRef<HTMLInputElement>(null);
  const sharePreviewKeyRef = useRef("");

  const clearShareImage = () => {
    if (shareImagePreview) URL.revokeObjectURL(shareImagePreview);
    setShareImagePreview(null);
    setShareImageFile(null);
    if (shareFileInputRef.current) shareFileInputRef.current.value = "";
  };

  const resetCheckIn = () => {
    setSelectedFeedPlace(null);
    clearShareImage();
  };

  useEffect(() => {
    const lat = selectedFeedPlace?.lat ?? geoCoords?.lat;
    const lng = selectedFeedPlace?.lng ?? geoCoords?.lng;
    if (lat == null || lng == null) {
      setShareLocationPreview("");
      sharePreviewKeyRef.current = "";
      return;
    }

    const previewKey = `${selectedFeedPlace?.placeId ?? ""}:${lat.toFixed(3)}:${lng.toFixed(3)}`;
    if (previewKey === sharePreviewKeyRef.current) return;
    sharePreviewKeyRef.current = previewKey;

    const city = detectCityFromCoords(lat, lng);
    const loc = buildShareLocationFast(lat, lng, {
      city,
      venue: selectedFeedPlace?.name,
      manualDistrict: selectedFeedPlace
        ? mockDistrictForCity(city, lat, lng)
        : undefined,
    });
    setShareLocationPreview(loc.locationLabel);
  }, [geoCoords, selectedFeedPlace]);

  const handleShareImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (shareImagePreview) URL.revokeObjectURL(shareImagePreview);
    setShareImageFile(file);
    setShareImagePreview(URL.createObjectURL(file));
  };

  const handleSelectFeedPlace = useCallback(
    (place: PlaceDetail | null) => {
      setSelectedFeedPlace(place);
      if (place) focusPlaceOnMap(place);
    },
    [focusPlaceOnMap],
  );

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if ((!trimmed && !shareImageFile) || shareLoading) return;

    const sharePlace = selectedFeedPlace;

    setShareError("");
    setShareLoading(true);
    try {
      const shareCoords = await ensureCoordsForShare(sharePlace, geoCoords);
      if (!shareCoords) {
        setShareError(t("feed.shareErrorGeo"));
        return;
      }

      if (!sharePlace && shareCoords) {
        setGeoCoords(shareCoords);
        setUserCity(
          formatFeedCityLabel(detectCityFromCoords(shareCoords.lat, shareCoords.lng)) ?? null,
        );
        setGeoStatus("success");
      }

      const shareCity = detectCityFromCoords(shareCoords.lat, shareCoords.lng);

      const shareLocation = buildShareLocationFast(shareCoords.lat, shareCoords.lng, {
        city: shareCity,
        venue: sharePlace?.name,
        manualDistrict: sharePlace ? mockDistrictForCity(shareCity, shareCoords.lat, shareCoords.lng) : undefined,
      });

      const result = await handleShareWithChat({
        text: trimmed,
        city: shareLocation?.city ?? shareCity,
        tags: extractHashtags(trimmed),
        ...(sharePlace?.placeId ? { placeId: sharePlace.placeId } : {}),
        ...(shareImageFile
          ? { imageFile: shareImageFile, imageUrl: shareImagePreview ?? undefined }
          : {}),
        distanceMeters: shareCoords
          ? Math.round(
              haversineDistanceMeters(
                geoCoords?.lat ?? shareCoords.lat,
                geoCoords?.lng ?? shareCoords.lng,
                shareCoords.lat,
                shareCoords.lng,
              ),
            ) || randomPostDistance()
          : randomPostDistance(),
        ...(shareCoords
          ? {
              lat: shareCoords.lat,
              lng: shareCoords.lng,
              district: shareLocation.district,
              cityLabel: shareLocation.cityLabel,
              locationLabel: shareLocation.locationLabel,
              city: shareLocation.city,
              ...(shareLocation.venue ? { venue: shareLocation.venue } : {}),
            }
          : {}),
      });

      if (sharePlace && result) {
        setFeedTab("map");
        setMapFlyTarget({ lat: result.lat, lng: result.lng });
        focusPlaceOnMap(sharePlace);
        if (result.room) {
          highlightRoom(result.room.id);
        }
      }

      setDraft("");
      resetCheckIn();
    } catch (err) {
      setShareError(err instanceof Error ? err.message : t("errors.gossipSaveFailed"));
    } finally {
      setShareLoading(false);
    }
  };

  return {
    draft,
    setDraft,
    selectedFeedPlace,
    shareLoading,
    shareError,
    shareLocationPreview,
    shareImagePreview,
    shareImageFile,
    shareFileInputRef,
    handleShare,
    handleShareImageSelect,
    clearShareImage,
    handleSelectFeedPlace,
  };
}
