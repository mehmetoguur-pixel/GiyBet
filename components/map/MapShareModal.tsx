"use client";

import { useState } from "react";
import { extractHashtags } from "@/lib/feed/tags";
import { detectCityFromCoords, haversineDistanceMeters } from "@/lib/geo";
import {
  findNearestMapRoom,
  findRoomByPlaceIdLocal,
} from "@/lib/rooms/api";
import type { MapRoom, MapShareTarget, ShareCheckIn, ShareSuccessResult } from "@/lib/giybet/types";
import { useI18n } from "@/lib/i18n/provider";

export function MapShareModal({
  target,
  rooms,
  onClose,
  onSubmit,
  btnPrimary,
  btnSecondary,
}: {
  target: MapShareTarget;
  rooms: MapRoom[];
  onClose: () => void;
  onSubmit: (payload: ShareCheckIn) => void | Promise<void | ShareSuccessResult>;
  btnPrimary: string;
  btnSecondary: string;
}) {
  const { t } = useI18n();
  const existingRoom =
    (target.placeId ? findRoomByPlaceIdLocal(rooms, target.placeId) : null) ??
    (target.roomId ? rooms.find((room) => room.id === target.roomId) : null) ??
    findNearestMapRoom(target.lat, target.lng, rooms);

  const [draft, setDraft] = useState("");
  const [createRoom, setCreateRoom] = useState(!existingRoom);
  const [roomName, setRoomName] = useState(
    target.placeName ?? existingRoom?.name ?? t("map.defaultVenueRoom"),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || loading) return;

    setError("");
    setLoading(true);
    try {
      await onSubmit({
        text: trimmed,
        lat: target.lat,
        lng: target.lng,
        city: detectCityFromCoords(target.lat, target.lng),
        tags: extractHashtags(trimmed),
        distanceMeters: Math.round(
          haversineDistanceMeters(
            target.lat,
            target.lng,
            existingRoom?.lat ?? target.lat,
            existingRoom?.lng ?? target.lng,
          ),
        ),
        roomId: existingRoom?.id ?? null,
        createRoom: !existingRoom && createRoom,
        roomName: createRoom ? roomName.trim() : undefined,
        ...(target.placeId ? { placeId: target.placeId } : {}),
        ...(target.placeName ? { venue: target.placeName } : {}),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.gossipShareFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-[9999] flex items-end justify-center px-4 pb-6 pt-16 sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-share-title"
      >
        <form
          onSubmit={handleSubmit}
          className="pointer-events-auto w-full max-w-md rounded-2xl border border-purple-500/45 bg-[#12121a] p-5 shadow-[0_0_60px_rgba(168,85,247,0.45)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 id="map-share-title" className="text-lg font-bold text-pink-200">
                {t("map.shareModalTitle")}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {target.lat.toFixed(5)}, {target.lng.toFixed(5)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/90 text-base font-bold text-zinc-200 transition-all hover:border-pink-500/55 hover:bg-pink-950/40 hover:text-pink-200 active:scale-95"
              aria-label={t("common.close")}
              title={t("common.close")}
            >
              ✕
            </button>
          </div>

          {existingRoom ? (
            <div className="mb-4 rounded-xl border border-emerald-500/35 bg-emerald-950/25 px-3 py-2.5 text-xs text-emerald-200">
              {t("map.shareToRoom", { name: existingRoom.name })}
            </div>
          ) : (
            <div className="mb-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setCreateRoom((prev) => !prev)}
                className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                  createRoom
                    ? "border-fuchsia-500/60 bg-gradient-to-r from-fuchsia-950/60 to-purple-950/50 text-fuchsia-200 shadow-[0_0_20px_rgba(217,70,239,0.35)]"
                    : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-purple-500/40 hover:text-purple-200"
                }`}
              >
                {createRoom ? t("map.venueRoomWillCreate") : t("map.createVenueRoom")}
              </button>
              {createRoom && (
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder={t("map.venueNamePlaceholder")}
                  maxLength={48}
                  className="w-full rounded-xl border border-purple-500/35 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-100 outline-none transition-all focus:border-pink-500/50 focus:shadow-[0_0_0_3px_rgba(236,72,153,0.15)]"
                />
              )}
            </div>
          )}

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder={t("map.sharePlaceholder")}
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all focus:border-purple-500/60 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.15)]"
          />

          {error && (
            <p className="mt-3 rounded-lg border border-pink-500/30 bg-pink-950/20 px-3 py-2 text-xs text-pink-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!draft.trim() || loading || (createRoom && !existingRoom && !roomName.trim())}
            className={`${btnPrimary} mt-4 disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {loading ? t("map.sharing") : t("map.launchGossip")}
          </button>
          <button type="button" onClick={onClose} className={`${btnSecondary} mt-2`}>
            {t("common.cancel")}
          </button>
        </form>
      </div>
    </>
  );
}
