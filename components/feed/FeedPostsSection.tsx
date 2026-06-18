"use client";

import { GiybetCard } from "@/components/feed/GiybetCard";
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
  } = feed;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5">
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
              />
            ))
          )}
        </div>
    </div>
  );
}
