"use client";

import { useMemo } from "react";
import type { FeedPost, GeoCoords } from "@/lib/giybet/types";
import { useI18n } from "@/lib/i18n/provider";
import { AvatarImage } from "@/components/ui/AvatarImage";

const NEARBY_ACTIVE_RADIUS_M = 5000;

type ActiveAuthor = {
  author: string;
  avatar: FeedPost["avatar"];
  postCount: number;
  latestText: string;
};

export function NearbyActiveUsers({
  posts,
  geoCoords,
  currentNickname,
  onAuthorClick,
}: {
  posts: FeedPost[];
  geoCoords: GeoCoords | null;
  currentNickname: string;
  onAuthorClick: (author: string) => void;
}) {
  const { t } = useI18n();

  const activeAuthors = useMemo(() => {
    if (!geoCoords) return [];

    const byAuthor = new Map<string, ActiveAuthor>();

    for (const post of posts) {
      if (post.author.trim() === currentNickname.trim()) continue;
      if (post.distanceMeters == null || post.distanceMeters > NEARBY_ACTIVE_RADIUS_M) continue;

      const author = post.author.trim();
      const existing = byAuthor.get(author);
      if (!existing) {
        byAuthor.set(author, {
          author,
          avatar: post.avatar,
          postCount: 1,
          latestText: post.text,
        });
      } else {
        existing.postCount += 1;
      }
    }

    return Array.from(byAuthor.values())
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 12);
  }, [posts, geoCoords, currentNickname]);

  if (!geoCoords || activeAuthors.length === 0) return null;

  return (
    <section className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-[#12121a] via-emerald-950/10 to-[#12121a] p-4">
      <h2 className="text-xs font-bold tracking-wide text-emerald-300">
        {t("feed.nearbyActiveTitle")}
      </h2>
      <p className="mt-0.5 text-[10px] text-zinc-500">{t("feed.nearbyActiveHint")}</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {activeAuthors.map((item) => (
          <button
            key={item.author}
            type="button"
            onClick={() => onAuthorClick(item.author)}
            className="flex shrink-0 flex-col items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 transition hover:border-emerald-400/50 active:scale-95"
          >
            <AvatarImage config={item.avatar} className="h-10 w-10" />
            <span className="max-w-[5rem] truncate text-[10px] font-medium text-zinc-300">
              @{item.author}
            </span>
            <span className="text-[9px] text-emerald-400">
              {t("feed.nearbyActivePosts", { count: item.postCount })}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
