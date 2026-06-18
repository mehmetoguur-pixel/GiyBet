"use client";

import {
  RADAR_MAX_METERS,
  RADAR_MIN_METERS,
  RADAR_STEP_METERS,
  clampRadarMeters,
  radarMetersToLabel,
} from "@/lib/feed/format";
import { useI18n } from "@/lib/i18n/provider";

export function GiybetRadar({
  radiusMeters,
  onChange,
  hasGeoCoords,
}: {
  radiusMeters: number;
  onChange: (meters: number) => void;
  hasGeoCoords: boolean;
}) {
  const { t } = useI18n();
  const clamped = clampRadarMeters(radiusMeters);
  const maxSteps = (RADAR_MAX_METERS - RADAR_MIN_METERS) / RADAR_STEP_METERS;
  const stepIndex = Math.round((clamped - RADAR_MIN_METERS) / RADAR_STEP_METERS);
  const fillPercent =
    maxSteps > 0 ? Math.round((stepIndex / maxSteps) * 100) : 100;

  return (
    <div className="rounded-2xl border border-pink-500/35 bg-gradient-to-r from-pink-950/30 via-[#12121a]/80 to-purple-950/30 px-4 py-4 shadow-[0_0_24px_rgba(236,72,153,0.15)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-pink-200">{t("radar.title")}</p>
        <span className="rounded-full border border-pink-500/45 bg-pink-950/40 px-2.5 py-0.5 text-[10px] font-bold text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.35)]">
          {radarMetersToLabel(clamped)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={maxSteps}
        step={1}
        value={stepIndex}
        onChange={(e) => {
          const idx = Number(e.target.value);
          onChange(RADAR_MIN_METERS + idx * RADAR_STEP_METERS);
        }}
        className="giybet-radar-slider w-full"
        style={{
          background: `linear-gradient(90deg, rgba(236,72,153,0.55) ${fillPercent}%, rgba(39,39,42,0.85) ${fillPercent}%)`,
        }}
        aria-label={t("chat.radarAria")}
        aria-valuetext={radarMetersToLabel(clamped)}
      />
      <div className="mt-2 flex justify-between text-[9px] font-medium text-zinc-600">
        <span>{t("radar.minLabel")}</span>
        <span>{t("radar.maxLabel")}</span>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
        {t("radar.hint")}
        {!hasGeoCoords && (
          <span className="mt-1 block text-pink-300/90">{t("radar.noGeo")}</span>
        )}
      </p>
    </div>
  );
}
