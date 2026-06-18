import type { Translator } from "@/lib/i18n";
import type { FeedPost, GiybetRank, PostReactions, ReactionKey } from "@/lib/giybet/types";

export const REACTION_BUTTONS: { key: ReactionKey; emoji: string; label: string }[] = [
  { key: "fire", emoji: "🔥", label: "Ateş" },
  { key: "shock", emoji: "😱", label: "Şok" },
  { key: "secret", emoji: "🤫", label: "Aramızda" },
];

export function formatReactionScore(total: number): string {
  if (total >= 1000) {
    return `${(total / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(total);
}

export function sumPostReactions(reactions: PostReactions): number {
  return reactions.fire + reactions.shock + reactions.secret;
}

export function getRankFromScore(score: number): GiybetRank {
  if (score >= 500) {
    return {
      emoji: "🔮",
      title: "Dedikodu İmparatoru",
      badgeClass:
        "border-fuchsia-400/70 bg-fuchsia-950/50 text-fuchsia-200 shadow-[0_0_14px_rgba(217,70,239,0.55)]",
      panelClass:
        "border-fuchsia-400/60 bg-gradient-to-r from-fuchsia-950/60 via-purple-950/50 to-pink-950/60 text-fuchsia-100 shadow-[0_0_24px_rgba(217,70,239,0.45)]",
    };
  }
  if (score >= 201) {
    return {
      emoji: "👑",
      title: "Gıybet Muhtarı",
      badgeClass:
        "border-amber-400/70 bg-amber-950/40 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.45)]",
      panelClass:
        "border-amber-400/55 bg-gradient-to-r from-amber-950/50 to-pink-950/40 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.35)]",
    };
  }
  if (score >= 51) {
    return {
      emoji: "🕵️‍♂️",
      title: "Mahalle Casusu",
      badgeClass:
        "border-purple-400/60 bg-purple-950/45 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.4)]",
      panelClass:
        "border-purple-400/50 bg-gradient-to-r from-purple-950/50 to-zinc-900/60 text-purple-100 shadow-[0_0_16px_rgba(168,85,247,0.3)]",
    };
  }
  return {
    emoji: "🥚",
    title: "Çaylak Kuş",
    badgeClass: "border-emerald-500/40 bg-emerald-950/30 text-emerald-300",
    panelClass:
      "border-emerald-500/35 bg-emerald-950/25 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
  };
}

export function buildAuthorReactionScores(posts: FeedPost[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const post of posts) {
    scores[post.author] = (scores[post.author] ?? 0) + sumPostReactions(post.reactions);
  }
  return scores;
}

export function getRankTitle(score: number, t: Translator): string {
  if (score >= 500) return t("ranks.emperor");
  if (score >= 201) return t("ranks.neonOracle");
  if (score >= 51) return t("ranks.wallLegend");
  return t("ranks.rookie");
}
