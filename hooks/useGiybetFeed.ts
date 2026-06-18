"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { buildAuthorReactionScores, sumPostReactions } from "@/lib/feed/rank";
import { RADAR_DEFAULT_METERS } from "@/lib/feed/format";
import { postHasTag, computeTrendingTags } from "@/lib/feed/tags";
import { resolvePostDistanceMeters } from "@/lib/geo";
import type { AvatarCreatorConfig, FeedPost, FeedViewTab } from "@/lib/giybet/types";
import { normalizeGossipId } from "@/lib/gossip/parsers";
import { useBlockedAuthors } from "@/hooks/feed/useBlockedAuthors";
import { useFollowAuthors } from "@/hooks/feed/useFollowAuthors";
import { useFeedGeo } from "@/hooks/feed/useFeedGeo";
import { useFeedNotifications } from "@/hooks/feed/useFeedNotifications";
import { useGossipChat } from "@/hooks/feed/useGossipChat";
import { useMapViewport } from "@/hooks/feed/useMapViewport";
import { useReportFlow } from "@/hooks/feed/useReportFlow";
import { useShareComposer } from "@/hooks/feed/useShareComposer";
import { type GiybetFeedProps } from "@/hooks/feed/types";

export { FEED_INPUT_CLASS, type GiybetFeedProps } from "@/hooks/feed/types";

export function useGiybetFeed(props: GiybetFeedProps) {
  const {
    userId,
    nickname,
    avatar,
    posts,
    mapPins,
    rooms,
    onShare,
    onCreateRoomAtPlace,
    onToggleLike,
    onToggleReaction,
    onAddComment,
    onDeleteGossip,
    onSaveAvatar,
    onLogout,
    btnPrimary,
    btnSecondary,
    hasMorePosts = false,
    loadMoreLoading = false,
    onLoadMorePosts,
    initialGossipId,
  } = props;

  const { t, nominatimLanguage, placesLanguage } = useI18n();

  const [feedTab, setFeedTab] = useState<FeedViewTab>("feed");
  const [likersModalPostId, setLikersModalPostId] = useState<number | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<string | null>(null);
  const [deepLinkPost, setDeepLinkPost] = useState<FeedPost | null>(null);
  const [mapFollowingOnly, setMapFollowingOnly] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState<AvatarCreatorConfig | null>(null);
  const [radarRadiusMeters, setRadarRadiusMeters] = useState(RADAR_DEFAULT_METERS);
  const [followFeedback, setFollowFeedback] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("giybet_hidden_report_posts");
    }
  }, []);

  const { blockedAuthors, blockAuthor } = useBlockedAuthors(userId);
  const {
    followingAuthors,
    followCounts,
    toggleFollowAuthor,
    unfollowAuthor,
  } = useFollowAuthors(userId, nickname);

  useEffect(() => {
    if (!initialGossipId?.trim() || posts.length === 0) return;
    const normalized = normalizeGossipId(initialGossipId.trim());
    const match = posts.find(
      (p) => p.gossipId && normalizeGossipId(p.gossipId) === normalized,
    );
    if (match) {
      setDeepLinkPost(match);
      setFeedTab("feed");
    }
  }, [initialGossipId, posts]);

  const handleOpenMap = useCallback(() => setFeedTab("map"), []);
  const handleSelectFollowingTab = useCallback(() => setFeedTab("following"), []);

  const geo = useFeedGeo({
    nominatimLanguage,
    t,
    onOpenMap: handleOpenMap,
  });

  const map = useMapViewport({
    geoCoords: geo.geoCoords,
    feedTab,
    placesLanguage,
    mapPins,
    blockedAuthors,
    followingAuthors,
    mapFollowingOnly,
    rooms,
    onCreateRoomAtPlace,
  });

  const gossipChat = useGossipChat({
    nickname,
    avatar,
    posts,
    onShare,
  });

  const notifications = useFeedNotifications({
    userId,
    nickname,
    posts,
    gossipChatLabels: gossipChat.gossipChatLabels,
    onSelectGossip: gossipChat.openGossipChatFromNotification,
    onSelectFollow: handleSelectFollowingTab,
  });

  const report = useReportFlow({
    nickname,
    posts,
    t,
    selectedMapPin: map.selectedMapPin,
    setSelectedMapPin: map.setSelectedMapPin,
  });

  const share = useShareComposer({
    t,
    geoCoords: geo.geoCoords,
    setGeoCoords: geo.setGeoCoords,
    setUserCity: geo.setUserCity,
    setGeoStatus: geo.setGeoStatus,
    handleShareWithChat: gossipChat.handleShareWithChat,
    focusPlaceOnMap: map.focusPlaceOnMap,
    setFeedTab,
    setMapFlyTarget: map.setMapFlyTarget,
    highlightRoom: map.highlightRoom,
  });

  const handleBlockUser = async (author: string) => {
    const trimmed = author.trim();
    if (!trimmed || trimmed === nickname.trim()) return;
    if (!window.confirm(t("common.blockConfirm", { username: trimmed }))) return;
    const blocked = await blockAuthor(author, nickname);
    if (blocked) {
      if (followingAuthors.has(trimmed)) {
        await unfollowAuthor(trimmed);
      }
      setSelectedUserProfile((prev) => (prev === trimmed ? null : prev));
      gossipChat.setGossipChatError(t("common.blockedUser"));
      window.setTimeout(() => gossipChat.setGossipChatError(""), 2500);
    }
  };

  const handleToggleFollow = async (author: string) => {
    const trimmed = author.trim();
    if (!trimmed || trimmed === nickname.trim()) return;
    if (blockedAuthors.has(trimmed)) return;
    const wasFollowing = followingAuthors.has(trimmed);
    const ok = await toggleFollowAuthor(trimmed);
    if (!ok) {
      setFollowFeedback({ message: t("follow.failed"), variant: "error" });
      window.setTimeout(() => setFollowFeedback(null), 2500);
      return;
    }
    if (!wasFollowing) {
      setFollowFeedback({
        message: t("follow.success", { username: trimmed }),
        variant: "success",
      });
      window.setTimeout(() => setFollowFeedback(null), 2500);
    }
  };

  const handleShareGossip = (gossipId: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?gossip=${encodeURIComponent(gossipId)}`;
    void navigator.clipboard.writeText(url).then(() => {
      setFollowFeedback({ message: t("share.linkCopied"), variant: "success" });
      window.setTimeout(() => setFollowFeedback(null), 2500);
    });
  };

  const selectedMapPost = useMemo(
    () =>
      map.selectedMapPin
        ? posts.find((p) => p.id === map.selectedMapPin!.feedPostId) ?? null
        : null,
    [map.selectedMapPin, posts],
  );

  const authorReactionScores = useMemo(() => buildAuthorReactionScores(posts), [posts]);

  const userPosts = useMemo(() => posts.filter((p) => p.author === nickname), [posts, nickname]);
  const userPostCount = userPosts.length;
  const userReactionScore = useMemo(
    () => userPosts.reduce((sum, p) => sum + sumPostReactions(p.reactions), 0),
    [userPosts],
  );
  const profileFollowers = followCounts.followers;
  const profileFollowing = followCounts.following;

  const likersModalPost = posts.find((p) => p.id === likersModalPostId);

  const filteredPosts = useMemo(() => {
    let list = posts.filter((p) => !blockedAuthors.has(p.author.trim()));
    if (activeTagFilter) {
      list = list.filter((p) => postHasTag(p, activeTagFilter));
    }
    if (geo.geoCoords) {
      list = list.filter((p) => {
        const d = resolvePostDistanceMeters(p, geo.geoCoords!);
        return d != null && d <= radarRadiusMeters;
      });
    }
    return list;
  }, [posts, blockedAuthors, geo.geoCoords, activeTagFilter, radarRadiusMeters]);

  const followingFilteredPosts = useMemo(() => {
    let list = posts.filter(
      (p) => followingAuthors.has(p.author.trim()) && !blockedAuthors.has(p.author.trim()),
    );
    if (activeTagFilter) {
      list = list.filter((p) => postHasTag(p, activeTagFilter));
    }
    return list;
  }, [posts, followingAuthors, blockedAuthors, activeTagFilter]);

  const trendingTags = useMemo(() => computeTrendingTags(posts, 5), [posts]);

  return {
    t,
    userId,
    nickname,
    avatar,
    posts,
    rooms,
    btnPrimary,
    btnSecondary,
    onToggleLike,
    onToggleReaction,
    onAddComment,
    onDeleteGossip,
    onSaveAvatar,
    onLogout,
    draft: share.draft,
    setDraft: share.setDraft,
    feedTab,
    setFeedTab,
    likersModalPostId,
    setLikersModalPostId,
    geoStatus: geo.geoStatus,
    geoError: geo.geoError,
    geoCoords: geo.geoCoords,
    selectedFeedPlace: share.selectedFeedPlace,
    nearbyVenues: geo.nearbyVenues,
    userCity: geo.userCity,
    activeTagFilter,
    setActiveTagFilter,
    showProfile,
    setShowProfile,
    editingAvatar,
    setEditingAvatar,
    radarRadiusMeters,
    setRadarRadiusMeters,
    activeGossipChats: gossipChat.activeGossipChats,
    currentFocusedGossipId: gossipChat.currentFocusedGossipId,
    gossipChatModalOpen: gossipChat.gossipChatModalOpen,
    setGossipChatModalOpen: gossipChat.setGossipChatModalOpen,
    gossipChatMessages: gossipChat.gossipChatMessages,
    gossipChatLabels: gossipChat.gossipChatLabels,
    gossipChatFlash: gossipChat.gossipChatFlash,
    gossipChatError: gossipChat.gossipChatError,
    roomLimitAlert: gossipChat.roomLimitAlert,
    showReportToast: report.showReportToast,
    reportError: report.reportError,
    reportTarget: report.reportTarget,
    setReportTarget: report.setReportTarget,
    bellNotifications: notifications.bellNotifications,
    unreadBellCount: notifications.unreadBellCount,
    showBellDropdown: notifications.showBellDropdown,
    shareLoading: share.shareLoading,
    shareError: share.shareError,
    shareLocationPreview: share.shareLocationPreview,
    shareImagePreview: share.shareImagePreview,
    shareImageFile: share.shareImageFile,
    shareFileInputRef: share.shareFileInputRef,
    selectedPlace: map.selectedPlace,
    setSelectedPlace: map.setSelectedPlace,
    nearbyPlaces: map.nearbyPlaces,
    mapFlyTarget: map.mapFlyTarget,
    setMapFlyTarget: map.setMapFlyTarget,
    mapFlyZoom: map.mapFlyZoom,
    setMapFlyZoom: map.setMapFlyZoom,
    mapFitAllNonce: map.mapFitAllNonce,
    setMapFitAllNonce: map.setMapFitAllNonce,
    highlightedRoomId: map.highlightedRoomId,
    roomCreateLoading: map.roomCreateLoading,
    selectedMapPin: map.selectedMapPin,
    setSelectedMapPin: map.setSelectedMapPin,
    mapShareTarget: map.mapShareTarget,
    setMapShareTarget: map.setMapShareTarget,
    selectedPlaceHasRoom: map.selectedPlaceHasRoom,
    selectedMapPost,
    authorReactionScores,
    userPosts,
    userPostCount,
    userReactionScore,
    profileFollowers,
    profileFollowing,
    likersModalPost,
    filteredPosts,
    followingFilteredPosts,
    followingAuthors,
    blockedAuthors,
    followFeedback,
    hasMorePosts,
    loadMoreLoading,
    onLoadMorePosts,
    selectedUserProfile,
    setSelectedUserProfile,
    deepLinkPost,
    setDeepLinkPost,
    mapFollowingOnly,
    setMapFollowingOnly,
    trendingTags,
    mapEligiblePins: map.mapEligiblePins,
    pinsInMapViewport: map.pinsInMapViewport,
    mapPinsVisible: map.mapPinsVisible,
    handleSelectPlaceFromSearch: map.handleSelectPlaceFromSearch,
    handleNearbyPlaceClick: map.handleNearbyPlaceClick,
    handleMapBoundsChange: map.handleMapBoundsChange,
    handleOpenRoomAtSelectedPlace: map.handleOpenRoomAtSelectedPlace,
    handleShareAtSelectedPlace: map.handleShareAtSelectedPlace,
    handleOpenReport: report.handleOpenReport,
    handleBlockUser,
    handleToggleFollow,
    handleShareGossip,
    handleSubmitReport: report.handleSubmitReport,
    handleBellToggle: notifications.handleBellToggle,
    openGossipChat: gossipChat.openGossipChat,
    handleShareWithChat: gossipChat.handleShareWithChat,
    focusGossipChat: gossipChat.focusGossipChat,
    handleBellNotificationSelect: notifications.handleBellNotificationSelect,
    handleGossipFlashNavigate: gossipChat.handleGossipFlashNavigate,
    leaveGossipChat: gossipChat.leaveGossipChat,
    handleGossipChatSend: gossipChat.handleGossipChatSend,
    handleShareImageSelect: share.handleShareImageSelect,
    clearShareImage: share.clearShareImage,
    handleSelectFeedPlace: share.handleSelectFeedPlace,
    handleRequestLocation: geo.handleRequestLocation,
    handleShare: share.handleShare,
  };
}
