"use client";

import { VenueCombobox } from "@/components/map/VenueCombobox";
import { FEED_INPUT_CLASS } from "@/hooks/useGiybetFeed";
import type { useGiybetFeed } from "@/hooks/useGiybetFeed";

type FeedState = ReturnType<typeof useGiybetFeed>;

export function ShareComposer({ feed }: { feed: FeedState }) {
  const {
    t,
    draft,
    setDraft,
    handleShare,
    shareFileInputRef,
    handleShareImageSelect,
    clearShareImage,
    shareImagePreview,
    shareImageFile,
    geoStatus,
    handleRequestLocation,
    geoError,
    shareLocationPreview,
    geoCoords,
    userCity,
    nearbyVenues,
    rooms,
    selectedFeedPlace,
    handleSelectFeedPlace,
    shareError,
    shareLoading,
  } = feed;

  return (
    <form
      onSubmit={handleShare}
      className="rounded-2xl border border-purple-500/35 bg-[#12121a]/60 p-4 shadow-[0_0_28px_rgba(168,85,247,0.1)]"
    >
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        placeholder={t("feed.sharePlaceholder")}
        className={FEED_INPUT_CLASS}
      />
      <p className="mt-1.5 text-[10px] text-zinc-600">{t("feed.hashtagHint")}</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          ref={shareFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleShareImageSelect}
        />
        <button
          type="button"
          onClick={() => shareFileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-xl border border-purple-500/35 bg-purple-950/30 px-3 py-2 text-xs font-semibold text-purple-200 transition hover:border-pink-500/50 hover:text-pink-200 active:scale-95"
        >
          📷 {t("feed.addPhoto")}
        </button>
        {shareImagePreview && (
          <button
            type="button"
            onClick={clearShareImage}
            className="text-xs text-zinc-500 hover:text-pink-300"
          >
            {t("feed.removePhoto")}
          </button>
        )}
      </div>
      {shareImagePreview && (
        <img
          src={shareImagePreview}
          alt={t("feed.sharePreviewAlt")}
          className="mt-2 max-h-40 rounded-xl border border-purple-500/40 object-cover"
        />
      )}
      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleRequestLocation}
          disabled={geoStatus === "loading"}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 ${
            geoStatus === "success"
              ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.25)]"
              : "border-purple-500/40 bg-gradient-to-r from-purple-950/50 to-pink-950/40 text-purple-200 shadow-[0_0_16px_rgba(168,85,247,0.2)] hover:border-pink-500/50 hover:text-pink-200"
          }`}
        >
          {geoStatus === "loading"
            ? t("feed.geoLoading")
            : geoStatus === "success"
              ? userCity
                ? `📍 ${userCity}`
                : t("feed.geoSuccess")
              : t("feed.geoAdd")}
        </button>

        {geoStatus === "error" && geoError && (
          <p className="rounded-lg border border-pink-500/30 bg-pink-950/20 px-3 py-2 text-xs text-pink-300">
            {geoError}
          </p>
        )}

        {shareLocationPreview && (
          <p className="rounded-lg border border-pink-500/35 bg-pink-950/25 px-3 py-2 text-xs font-medium text-pink-200">
            {t("feed.shareLocation", { label: shareLocationPreview })}
          </p>
        )}

        <VenueCombobox
          userLocation={geoCoords}
          fallbackVenues={nearbyVenues}
          rooms={rooms}
          selected={selectedFeedPlace}
          onSelect={handleSelectFeedPlace}
          inputClass={FEED_INPUT_CLASS}
          label={t("venue.addVenue")}
          placeholder={t("venue.searchPlaceholder")}
          clearOnSelect={false}
        />
      </div>
      {shareError && (
        <p className="mt-3 rounded-lg border border-pink-500/30 bg-pink-950/20 px-3 py-2 text-xs text-pink-300">
          {shareError}
        </p>
      )}
      <button
        type="submit"
        disabled={(!draft.trim() && !shareImageFile) || shareLoading}
        className="mt-3 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.35)] transition-all hover:from-purple-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
      >
        {shareLoading ? t("feed.launching") : t("feed.launch")}
      </button>
    </form>
  );
}
