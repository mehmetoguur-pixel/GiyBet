"use client";

import { useMemo, useState } from "react";
import { GiybetCard } from "@/components/feed/GiybetCard";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import type { AvatarCreatorConfig } from "@/lib/giybet/types";
import type { useGiybetFeed } from "@/hooks/useGiybetFeed";

type FeedState = ReturnType<typeof useGiybetFeed>;

export function FollowingPostsSection({ feed }: { feed: FeedState }) {
  const {
    t,
    userId,
    nickname,
    avatar,
    posts,
    onToggleLike,
    onToggleReaction,
    onAddComment,
    onDeleteGossip,
    followingFilteredPosts,
    followingAuthors,
    profileFollowing,
    authorReactionScores,
    setLikersModalPostId,
    openGossipChat,
    handleOpenReport,
    handleBlockUser,
    handleToggleFollow,
    setFeedTab,
  } = feed;

  const [authorFilter, setAuthorFilter] = useState<string | null>(null);

  const followedList = useMemo(
    () => Array.from(followingAuthors).sort((a, b) => a.localeCompare(b, "tr")),
    [followingAuthors],
  );

  const authorAvatars = useMemo(() => {
    const map = new Map<string, AvatarCreatorConfig>();
    for (const post of posts) {
      const author = post.author.trim();
      if (followingAuthors.has(author) && !map.has(author)) {
        map.set(author, post.avatar);
      }
    }
    return map;
  }, [posts, followingAuthors]);

  const displayPosts = useMemo(() => {
    if (!authorFilter) return followingFilteredPosts;
    return followingFilteredPosts.filter((p) => p.author.trim() === authorFilter);
  }, [followingFilteredPosts, authorFilter]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <section
        className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-[#12121a] via-[#16101f] to-[#12121a] p-4 shadow-[0_0_28px_rgba(168,85,247,0.12)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold tracking-wide text-purple-200">
              {t("feed.followingGossipsTitle")}
            </h2>
            <p className="mt-1 text-[11px] text-zinc-500">{t("feed.followingSubtitle")}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <div className="rounded-xl border border-sky-500/30 bg-sky-950/25 px-3 py-2 text-center">
              <p className="text-lg font-bold text-sky-300">{profileFollowing}</p>
              <p className="text-[9px] uppercase tracking-wider text-zinc-500">
                {t("feed.followingStatsFollowing")}
              </p>
            </div>
            <div className="rounded-xl border border-pink-500/30 bg-pink-950/25 px-3 py-2 text-center">
              <p className="text-lg font-bold text-pink-300">{followingFilteredPosts.length}</p>
              <p className="text-[9px] uppercase tracking-wider text-zinc-500">
                {t("feed.followingStatsPosts")}
              </p>
            </div>
          </div>
        </div>

        {followedList.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                {t("feed.followingPeopleTitle")}
              </p>
              {authorFilter && (
                <button
                  type="button"
                  onClick={() => setAuthorFilter(null)}
                  className="text-[10px] text-purple-300 hover:text-pink-300"
                >
                  {t("feed.followingFilterAll")}
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {followedList.map((author) => {
                const active = authorFilter === author;
                const authorAvatar = authorAvatars.get(author) ?? DEFAULT_AVATAR;
                return (
                  <button
                    key={author}
                    type="button"
                    onClick={() => setAuthorFilter(active ? null : author)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5 transition active:scale-95 ${
                      active
                        ? "border-pink-500/60 bg-pink-950/40 shadow-[0_0_14px_rgba(236,72,153,0.35)]"
                        : "border-zinc-700/80 bg-zinc-900/60 hover:border-purple-500/40"
                    }`}
                  >
                    <AvatarImage config={authorAvatar} className="h-7 w-7" />
                    <span className="max-w-[7rem] truncate text-xs font-medium text-zinc-300">
                      @{author}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {followedList.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-6 py-10 text-center">
          <p className="text-3xl">👥</p>
          <p className="mt-3 text-sm font-semibold text-zinc-300">{t("feed.followingEmptyTitle")}</p>
          <p className="mt-2 text-xs text-zinc-500">{t("feed.followingEmptyHint")}</p>
          <button
            type="button"
            onClick={() => setFeedTab("feed")}
            className="mt-5 rounded-xl border border-purple-500/45 bg-purple-950/35 px-4 py-2 text-xs font-semibold text-purple-200 transition hover:border-pink-500/50 hover:text-pink-200 active:scale-95"
          >
            {t("feed.followingBrowseFeed")}
          </button>
        </div>
      ) : displayPosts.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-6 py-8 text-center">
          <p className="text-sm text-zinc-400">
            {authorFilter
              ? t("feed.followingNoPostsByUser", { username: authorFilter })
              : t("feed.followingNoPosts")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayPosts.map((post) => (
            <GiybetCard
              key={post.gossipId ?? String(post.id)}
              post={post}
              currentUserId={userId}
              currentNickname={nickname}
              currentUserAvatar={avatar}
              authorReactionScores={authorReactionScores}
              onToggleLike={onToggleLike}
              onToggleReaction={onToggleReaction}
              onAddComment={onAddComment}
              onShowLikers={setLikersModalPostId}
              onOpenGossipChat={openGossipChat}
              onOpenReport={handleOpenReport}
              onBlockUser={handleBlockUser}
              onDeleteGossip={onDeleteGossip}
              followingAuthors={followingAuthors}
              onToggleFollow={handleToggleFollow}
            />
          ))}
        </div>
      )}
    </div>
  );
}
