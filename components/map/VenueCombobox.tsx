"use client";

import { useEffect, useState } from "react";
import { findRoomByPlaceIdLocal } from "@/lib/rooms/api";
import type { GeoCoords, MapRoom, NearbyVenue } from "@/lib/giybet/types";
import type { PlaceDetail } from "@/lib/places-api";
import {
  isPersistableGooglePlaceId,
  searchTomTomPlaces,
  venueSuggestionToPlaceDetail,
  type VenueSearchSuggestion,
} from "@/lib/tomtom-api";
import { useI18n } from "@/lib/i18n/provider";

export function VenueCombobox({
  userLocation,
  fallbackVenues: _fallbackVenues,
  rooms,
  selected,
  onSelect,
  inputClass,
  label,
  placeholder,
  clearOnSelect = true,
}: {
  userLocation: GeoCoords | null;
  fallbackVenues: NearbyVenue[];
  rooms?: MapRoom[];
  selected: PlaceDetail | null;
  onSelect: (place: PlaceDetail | null) => void;
  inputClass: string;
  label?: string;
  placeholder?: string;
  clearOnSelect?: boolean;
}) {
  const { t, tomTomLanguage } = useI18n();
  const resolvedLabel = label ?? t("venue.selectLabel");
  const resolvedPlaceholder = placeholder ?? t("venue.searchPlaceholder");
  const [query, setQuery] = useState(selected?.name ?? "");
  const [suggestions, setSuggestions] = useState<VenueSearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    queueMicrotask(() => setQuery(selected?.name ?? ""));
  }, [selected]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      queueMicrotask(() => {
        setSuggestions([]);
        setError("");
      });
      return;
    }

    if (!userLocation) {
      queueMicrotask(() => {
        setSuggestions([]);
        setError(t("venue.needGeo"));
      });
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const results = await searchTomTomPlaces(
          trimmed,
          userLocation.lat,
          userLocation.lng,
          tomTomLanguage,
        );
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch (err) {
        setSuggestions([]);
        setOpen(false);
        setError(err instanceof Error ? err.message : t("venue.searchFailed"));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, userLocation, tomTomLanguage, t]);

  const handleSelect = (suggestion: VenueSearchSuggestion) => {
    const place = venueSuggestionToPlaceDetail(suggestion);
    onSelect(place);
    setQuery(place.name);
    setSuggestions([]);
    setOpen(false);
    if (clearOnSelect) setQuery("");
  };

  const comboboxClass = `${inputClass} pr-10 transition-all ${
    focused
      ? "border-purple-400/80 shadow-[0_0_0_3px_rgba(168,85,247,0.35),0_0_20px_rgba(236,72,153,0.28)]"
      : "border-zinc-800"
  }`;

  const linkedRoom =
    selected?.placeId && isPersistableGooglePlaceId(selected.placeId)
      ? findRoomByPlaceIdLocal(rooms ?? [], selected.placeId)
      : null;

  return (
    <div className="relative">
      <label
        htmlFor="venue-combobox"
        className="mb-1.5 block text-[10px] font-semibold tracking-widest text-purple-300/80 uppercase"
      >
        {resolvedLabel}
      </label>
      <div className="relative">
        <input
          id="venue-combobox"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected && e.target.value !== selected.name) onSelect(null);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              setFocused(false);
              setOpen(false);
            }, 150);
          }}
          placeholder={resolvedPlaceholder}
          className={comboboxClass}
          autoComplete="off"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-70">
          {loading ? "⏳" : "🔎"}
        </span>
      </div>

      {selected && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-emerald-500/35 bg-emerald-950/25 px-3 py-2 text-xs text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.18)]">
          <span className="min-w-0 truncate">
            📍 <span className="font-semibold">{selected.name}</span>
            {linkedRoom && (
              <span className="ml-1 text-emerald-300/80">{t("venue.roomExists")}</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setQuery("");
            }}
            className="shrink-0 rounded-md px-1.5 text-zinc-400 transition-colors hover:text-pink-300"
            aria-label={t("venue.clearSelection")}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-lg border border-pink-500/30 bg-pink-950/20 px-3 py-2 text-xs text-pink-300">
          {error}
        </p>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-40 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-purple-500/45 bg-[#0d0d14]/98 shadow-[0_0_32px_rgba(168,85,247,0.4)] backdrop-blur-md">
          {suggestions.map((item) => (
            <li key={item.placeId}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className="flex w-full flex-col gap-0.5 border-b border-zinc-800/80 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-purple-950/50 hover:shadow-[inset_0_0_20px_rgba(168,85,247,0.12)]"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-zinc-100">{item.name}</span>
                  {item.distanceLabel && (
                    <span className="shrink-0 text-xs font-medium text-purple-300/90">
                      {item.distanceLabel}
                    </span>
                  )}
                </span>
                <span className="line-clamp-2 text-xs text-zinc-500">{item.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
