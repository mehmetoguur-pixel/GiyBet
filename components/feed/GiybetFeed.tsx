"use client";

import dynamic from "next/dynamic";
import { ActiveGossipChatTabsPanel } from "@/components/chat/ActiveGossipChatTabsPanel";
import { FeedPostsSection } from "@/components/feed/FeedPostsSection";
import { FeedTabBar } from "@/components/feed/FeedTabBar";
import { GiybetFeedModals } from "@/components/feed/GiybetFeedModals";
import { GiybetRadar } from "@/components/feed/GiybetRadar";
import { NotificationBellPanel } from "@/components/feed/NotificationBellPanel";
import { ShareComposer } from "@/components/feed/ShareComposer";
import { ProfileBar } from "@/components/profile/ProfileBar";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { useGiybetFeed, type GiybetFeedProps } from "@/hooks/useGiybetFeed";

const MapTabContent = dynamic(() =>
  import("@/components/feed/MapTabContent").then((m) => m.MapTabContent),
);

export default function GiybetFeed(props: GiybetFeedProps) {
  const feed = useGiybetFeed(props);
  const {
    t,
    nickname,
    avatar,
    feedTab,
    setFeedTab,
    radarRadiusMeters,
    setRadarRadiusMeters,
    geoCoords,
    setShowProfile,
    bellNotifications,
    unreadBellCount,
    showBellDropdown,
    handleBellToggle,
    handleBellNotificationSelect,
    activeGossipChats,
    gossipChatLabels,
    currentFocusedGossipId,
    focusGossipChat,
    leaveGossipChat,
  } = feed;

  return (
    <div className="relative flex flex-col gap-5">
      <GiybetFeedModals feed={feed} />

      <div className="absolute right-0 top-0 z-20 flex items-center gap-2">
        <NotificationBellPanel
          notifications={bellNotifications}
          unreadCount={unreadBellCount}
          open={showBellDropdown}
          onToggle={handleBellToggle}
          onSelect={handleBellNotificationSelect}
        />
        <button
          type="button"
          onClick={() => setShowProfile(true)}
          className="rounded-full border-2 border-purple-500/50 bg-[#12121a] p-0.5 shadow-[0_0_20px_rgba(168,85,247,0.45)] transition-all hover:border-pink-400/70 hover:shadow-[0_0_28px_rgba(236,72,153,0.5)] active:scale-95"
          aria-label={t("common.profile")}
          title={t("common.profile")}
        >
          <AvatarImage config={avatar} className="h-11 w-11" />
        </button>
      </div>

      <header className="text-center">
        <h1 className="bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-500 bg-clip-text text-4xl font-black tracking-tight text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]">
          {t("common.appName")}
        </h1>
        <p className="mt-1 text-xs text-zinc-500">{t("feed.subtitle")}</p>
      </header>

      <ProfileBar nickname={nickname} avatar={avatar} />

      {feedTab !== "map" && (
        <GiybetRadar
          radiusMeters={radarRadiusMeters}
          onChange={setRadarRadiusMeters}
          hasGeoCoords={geoCoords != null}
        />
      )}

      <FeedTabBar active={feedTab} onChange={setFeedTab} />

      <ActiveGossipChatTabsPanel
        activeGossipIds={activeGossipChats}
        gossipLabels={gossipChatLabels}
        focusedGossipId={currentFocusedGossipId}
        onFocusChat={focusGossipChat}
        onLeaveChat={leaveGossipChat}
      />

      {feedTab === "map" ? (
        <MapTabContent feed={feed} />
      ) : (
        <div className="flex flex-col gap-5">
          <ShareComposer feed={feed} />
          <FeedPostsSection feed={feed} />
        </div>
      )}
    </div>
  );
}
