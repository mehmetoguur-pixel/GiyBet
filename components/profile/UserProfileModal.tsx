"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { getRankTitle } from "@/lib/feed/rank";
import { formatLocationLabel } from "@/lib/feed/format";
import type { FeedPost } from "@/lib/giybet/types";
import { fetchFollowCountsByUsername } from "@/lib/follows";
import { useI18n } from "@/lib/i18n/provider";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { RankBadge } from "@/components/feed/RankBadge";
import { ProfileGossipDetailModal } from "@/components/profile/ProfileGossipDetailModal";
import { DEFAULT_AVATAR } from "@/lib/avatar";

export function UserProfileModal({
  username,
  posts,
  currentNickname,
  followingAuthors,
  blockedAuthors,
  authorReactionScores,
  onClose,
  onToggleFollow,
  onBlockUser,
}: {
  username: string;
  posts: FeedPost[];
  currentNickname: string;
  followingAuthors: Set<string>;
  blockedAuthors: Set<string>;
  authorReactionScores: Record<string, number>;
  onClose: () => void;
  onToggleFollow?: (author: string) => void;
  onBlockUser?: (author: string) => void;
}) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);

  const trimmed = username.trim();
  const isSelf = trimmed === currentNickname.trim();
  const isFollowing = followingAuthors.has(trimmed);
  const isBlocked = blockedAuthors.has(trimmed);

  const userPosts = useMemo(
    () => posts.filter((p) => p.author.trim() === trimmed),
    [posts, trimmed],
  );

  const avatar = userPosts[0]?.avatar ?? DEFAULT_AVATAR;
  const reactionScore = authorReactionScores[trimmed] ?? 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!trimmed) return;
    fetchFollowCountsByUsername(trimmed).then(setCounts);
  }, [trimmed]);

  if (!mounted || !trimmed) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[10040] flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-purple-500/45 bg-[#12121a] shadow-[0_0_60px_rgba(168,85,247,0.45)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-profile-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-purple-500/25 bg-gradient-to-r from-purple-950/40 to-pink-950/30 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <AvatarImage config={avatar} className="h-14 w-14" />
                <div className="min-w-0">
                  <h2 id="user-profile-title" className="truncate text-lg font-bold text-pink-200">
                    @{trimmed}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <RankBadge score={reactionScore} />
                    <span className="text-[10px] text-zinc-500">{getRankTitle(reactionScore, t)}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:border-pink-500/50 hover:text-pink-300"
                aria-label={t("common.close")}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-2">
                <p className="text-lg font-bold text-purple-300">{userPosts.length}</p>
                <p className="text-[9px] uppercase tracking-wider text-zinc-500">{t("profile.statsGossips")}</p>
              </div>
              <div className="rounded-xl border border-sky-500/25 bg-sky-950/20 py-2">
                <p className="text-lg font-bold text-sky-300">{counts.followers}</p>
                <p className="text-[9px] uppercase tracking-wider text-zinc-500">{t("profile.statsFollowers")}</p>
              </div>
              <div className="rounded-xl border border-pink-500/25 bg-pink-950/20 py-2">
                <p className="text-lg font-bold text-pink-300">{counts.following}</p>
                <p className="text-[9px] uppercase tracking-wider text-zinc-500">{t("profile.statsFollowing")}</p>
              </div>
            </div>

            {!isSelf && (
              <div className="mt-3 flex flex-wrap gap-2">
                {onToggleFollow && !isBlocked && (
                  <button
                    type="button"
                    onClick={() => onToggleFollow(trimmed)}
                    className={`rounded-xl border px-4 py-2 text-xs font-semibold transition active:scale-95 ${
                      isFollowing
                        ? "border-sky-500/50 bg-sky-950/40 text-sky-300"
                        : "border-purple-500/50 bg-purple-950/40 text-purple-200 hover:border-pink-500/50"
                    }`}
                  >
                    {isFollowing ? t("common.unfollowUser") : t("common.followUser")}
                  </button>
                )}
                {onBlockUser && !isBlocked && (
                  <button
                    type="button"
                    onClick={() => onBlockUser(trimmed)}
                    className="rounded-xl border border-orange-500/40 bg-orange-950/30 px-4 py-2 text-xs font-semibold text-orange-300 transition hover:border-orange-400/50 active:scale-95"
                  >
                    {t("common.blockUser")}
                  </button>
                )}
                {isBlocked && (
                  <p className="text-xs text-orange-400">{t("common.blockedUser")}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
              {t("profile.historyGossips")}
            </p>
            {userPosts.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">{t("profile.noGossips")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {userPosts.map((post) => (
                  <li key={post.gossipId ?? String(post.id)}>
                    <button
                      type="button"
                      onClick={() => setSelectedPost(post)}
                      className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2.5 text-left transition hover:border-purple-500/35 hover:bg-purple-950/20"
                    >
                      <p className="line-clamp-2 text-sm text-zinc-300">{post.text}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-500">
                        <span>{post.time}</span>
                        {formatLocationLabel(post) && (
                          <span className="text-pink-400/80">📍 {formatLocationLabel(post)}</span>
                        )}
                        <span>❤️ {post.likers.length}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {selectedPost && (
        <ProfileGossipDetailModal
          post={selectedPost}
          authorReactionScores={authorReactionScores}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>,
    document.body,
  );
}
