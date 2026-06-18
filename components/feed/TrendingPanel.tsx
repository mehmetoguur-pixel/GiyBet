"use client";

import { normalizeTagKey } from "@/lib/feed/tags";
import { useI18n } from "@/lib/i18n/provider";

export function TrendingPanel({
  activeTag,
  trendingTags,
  onSelectTag,
  onClearTag,
}: {
  activeTag: string | null;
  trendingTags: { tag: string; count: number }[];
  onSelectTag: (tag: string) => void;
  onClearTag: () => void;
}) {
  const { t } = useI18n();
  return (
    <aside className="rounded-2xl border border-purple-500/35 bg-[#12121a]/80 p-4 shadow-[0_0_24px_rgba(168,85,247,0.12)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-pink-200">{t("trending.title")}</h2>
        {activeTag && (
          <button
            type="button"
            onClick={onClearTag}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-pink-500/40 bg-pink-950/40 text-xs text-pink-300 transition-all hover:border-pink-400 hover:text-pink-200"
            aria-label={t("feed.clearFilter")}
          >
            ✕
          </button>
        )}
      </div>
      {activeTag && (
        <p className="mb-3 rounded-lg border border-pink-500/30 bg-pink-950/25 px-3 py-2 text-xs text-pink-200">
          {t("feed.filterLabel", { tag: activeTag })}
        </p>
      )}
      {trendingTags.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-xs text-zinc-500">
          {t("trending.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {trendingTags.map(({ tag, count }) => (
            <li key={tag}>
              <button
                type="button"
                onClick={() => onSelectTag(tag)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all active:scale-[0.98] ${
                  activeTag && normalizeTagKey(activeTag) === normalizeTagKey(tag)
                    ? "border-pink-400/70 bg-gradient-to-r from-purple-950/60 to-pink-950/50 text-pink-100 shadow-[0_0_16px_rgba(236,72,153,0.35)]"
                    : "border-zinc-800 bg-zinc-900/50 text-purple-300 hover:border-purple-500/40 hover:text-pink-200"
                }`}
              >
                <span>{tag}</span>
                <span className="shrink-0 rounded-full border border-pink-500/35 bg-pink-950/30 px-2 py-0.5 text-[10px] font-bold text-pink-300">
                  {count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
