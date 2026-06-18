"use client";

import { useI18n } from "./provider";
import { SUPPORTED_LOCALES } from "./index";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={
        compact
          ? "flex flex-col gap-2"
          : "rounded-xl border border-purple-500/30 bg-purple-950/20 p-3"
      }
    >
      {!compact && (
        <div>
          <p className="text-xs font-semibold text-purple-200">{t("language.label")}</p>
          <p className="mt-0.5 text-[10px] text-zinc-500">{t("language.deviceHint")}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {SUPPORTED_LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              locale === code
                ? "border-pink-500/55 bg-pink-950/40 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.35)]"
                : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-purple-500/40 hover:text-purple-200"
            }`}
          >
            {t(`language.${code}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
