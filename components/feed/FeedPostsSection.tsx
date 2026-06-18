"use client";

import { GiybetCard } from "@/components/feed/GiybetCard";
import { NearbyActiveUsers } from "@/components/feed/NearbyActiveUsers";
import { TrendingPanel } from "@/components/feed/TrendingPanel";
import { radarMetersToLabel } from "@/lib/feed/format";
import type { useGiybetFeed } from "@/hooks/useGiybetFeed";

type FeedState = ReturnType<typeof useGiybetFeed>;

export function FeedPostsSection({ feed }: { feed: FeedState }) {
  const {
    t,
    userId,
    nickname,
    avatar,
    onToggleLike,
    onToggleReaction,
    onAddComment,
    onDeleteGossip,
    activeTagFilter,
    setActiveTagFilter,
    trendingTags,
    userCity,
    geoCoords,
    radarRadiusMeters,
    filteredPosts,
    authorReactionScores,
    setLikersModalPostId,
    openGossipChat,
    handleOpenReport,
    handleBlockUser,
    followingAuthors,
    handleToggleFollow,
    setSelectedUserProfile,
    handleShareGossip,
    hasMorePosts,
    loadMoreLoading,
    onLoadMorePosts,
  } = feed;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5">
      <NearbyActiveUsers
        posts={feed.posts}
        geoCoords={geoCoords}
        currentNickname={nickname}
        onAuthorClick={setSelectedUserProfile}
      />

      <TrendingPanel
        activeTag={activeTagFilter}
        trendingTags={trendingTags}
        onSelectTag={setActiveTagFilter}
        onClearTag={() => setActiveTagFilter(null)}
      />

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-medium tracking-widest text-zinc-600 uppercase">
          {userCity ? t("feed.cityGossips", { city: userCity }) : t("feed.nearbyGossips")}
          {activeTagFilter ? ` · ${activeTagFilter}` : ""}
          {geoCoords
            ? ` · ${t("radar.radiusRadar", { radius: radarMetersToLabel(radarRadiusMeters) })}`
            : ""}
        </h2>
        {filteredPosts.length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-500">
            {geoCoords
              ? t("feed.noGossipsInRadius", {
                  radius: radarMetersToLabel(radarRadiusMeters),
                })
              : t("feed.noGossipsNeedGeo")}
          </p>
        ) : (
          filteredPosts.map((post) => (
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
              onTagClick={setActiveTagFilter}
              followingAuthors={followingAuthors}
              onToggleFollow={handleToggleFollow}
              onAuthorClick={setSelectedUserProfile}
              onShareGossip={handleShareGossip}
            />
          ))
        )}
        {hasMorePosts && onLoadMorePosts && (
          <button
            type="button"
            onClick={onLoadMorePosts}
            disabled={loadMoreLoading}
            className="rounded-xl border border-purple-500/40 bg-purple-950/30 px-4 py-3 text-sm font-semibold text-purple-200 transition hover:border-pink-500/50 disabled:opacity-50"
          >
            {loadMoreLoading ? t("feed.loadingMore") : t("feed.loadMore")}
          </button>
        )}
      </div>
    </div>
  );
}
