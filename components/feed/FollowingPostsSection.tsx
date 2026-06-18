"use client";

import { GiybetCard } from "@/components/feed/GiybetCard";
import type { useGiybetFeed } from "@/hooks/useGiybetFeed";

type FeedState = ReturnType<typeof useGiybetFeed>;

export function FollowingPostsSection({ feed }: { feed: FeedState }) {
  const {
    t,
    userId,
    nickname,
    avatar,
    onToggleLike,
    onToggleReaction,
    onAddComment,
    onDeleteGossip,
    followingFilteredPosts,
    followingAuthors,
    authorReactionScores,
    setLikersModalPostId,
    openGossipChat,
    handleOpenReport,
    handleBlockUser,
    handleToggleFollow,
  } = feed;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <h2 className="text-xs font-medium tracking-widest text-zinc-600 uppercase">
        {t("feed.followingGossipsTitle")}
      </h2>
      {followingAuthors.size === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-500">
          {t("feed.followingEmptyHint")}
        </p>
      ) : followingFilteredPosts.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-500">
          {t("feed.followingNoPosts")}
        </p>
      ) : (
        followingFilteredPosts.map((post) => (
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
        ))
      )}
    </div>
  );
}
