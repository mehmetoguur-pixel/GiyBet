"use client";

import { placeTypeEmoji, type PlaceDetail } from "@/lib/places-api";
import { useI18n } from "@/lib/i18n/provider";

export function SelectedPlacePanel({
  place,
  hasRoom,
  loading,
  onOpenRoom,
  onShareGossip,
  onClose,
  btnPrimary,
}: {
  place: PlaceDetail;
  hasRoom: boolean;
  loading: boolean;
  onOpenRoom: () => void;
  onShareGossip: () => void;
  onClose: () => void;
  btnPrimary: string;
}) {
  const { t } = useI18n();
  const emoji = placeTypeEmoji(place.types);

  return (
    <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 rounded-2xl border border-fuchsia-500/45 bg-[#12121a]/95 p-4 shadow-[0_0_32px_rgba(217,70,239,0.35)] backdrop-blur-md">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-500/40 bg-purple-950/40 text-xl shadow-[0_0_16px_rgba(168,85,247,0.35)]">
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-pink-200">{place.name}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{place.address}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/80 text-sm text-zinc-300 transition-all hover:border-pink-500/55 hover:bg-pink-950/30 hover:text-pink-200 active:scale-95"
          aria-label={t("common.close")}
          title={t("common.close")}
        >
          ✕
        </button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onOpenRoom}
          disabled={loading || hasRoom}
          className={`${btnPrimary} flex-1 text-sm disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {loading
            ? t("map.openingRoom")
            : hasRoom
              ? t("map.roomExistsHere")
              : t("map.shareAtVenue")}
        </button>
        <button
          type="button"
          onClick={onShareGossip}
          className="flex-1 rounded-xl border border-purple-500/40 bg-purple-950/30 px-4 py-3 text-sm font-semibold text-purple-200 transition-all hover:border-pink-500/50 hover:text-pink-200 active:scale-[0.98]"
        >
          {t("map.shareAtPlace")}
        </button>
      </div>
    </div>
  );
}
