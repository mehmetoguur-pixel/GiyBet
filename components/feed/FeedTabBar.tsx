"use client";

import type { FeedViewTab } from "@/lib/giybet/types";
import { useI18n } from "@/lib/i18n/provider";

export function FeedTabBar({
  active,
  onChange,
}: {
  active: FeedViewTab;
  onChange: (tab: FeedViewTab) => void;
}) {
  const { t } = useI18n();
  const tabClass = (isActive: boolean) =>
    `flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
      isActive
        ? "border-pink-400/70 bg-gradient-to-r from-purple-600/50 to-pink-600/50 text-pink-100 shadow-[0_0_20px_rgba(236,72,153,0.35)] ring-1 ring-pink-500/40"
        : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-purple-500/35 hover:text-purple-300"
    }`;

  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => onChange("feed")} className={tabClass(active === "feed")}>
        📰 {t("feed.tabFeed")}
      </button>
      <button
        type="button"
        onClick={() => onChange("following")}
        className={tabClass(active === "following")}
      >
        👥 {t("feed.tabFollowing")}
      </button>
      <button type="button" onClick={() => onChange("map")} className={tabClass(active === "map")}>
        🗺️ {t("feed.tabMap")}
      </button>
    </div>
  );
}
