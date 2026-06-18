"use client";

import { getRankFromScore, getRankTitle } from "@/lib/feed/rank";
import { useI18n } from "@/lib/i18n/provider";

export function RankBadge({ score, compact = false }: { score: number; compact?: boolean }) {
  const { t } = useI18n();
  const rank = getRankFromScore(score);
  const title = getRankTitle(score, t);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-bold tracking-wide ${rank.badgeClass}`}
      title={title}
    >
      <span aria-hidden="true">{rank.emoji}</span>
      {!compact && <span>{title}</span>}
    </span>
  );
}
