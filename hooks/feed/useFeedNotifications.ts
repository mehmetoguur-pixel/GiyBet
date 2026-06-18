"use client";

import { useCallback, useEffect, useState } from "react";
import { initPushNotifications } from "@/lib/push";
import { subscribeNotifications, unsubscribeChannel } from "@/lib/realtime";
import { normalizeGossipId } from "@/lib/gossip/parsers";
import { fetchAuthorNotifications, markNotificationsRead } from "@/lib/gossip/api";
import { gossipChatLabel } from "@/lib/rooms/chat-utils";
import type { BellNotification, FeedPost } from "@/lib/giybet/types";

type UseFeedNotificationsOptions = {
  userId: string;
  nickname: string;
  posts: FeedPost[];
  gossipChatLabels: Record<string, string>;
  onSelectGossip: (gossipId: string) => void;
};

export function useFeedNotifications({
  userId,
  nickname,
  posts,
  gossipChatLabels,
  onSelectGossip,
}: UseFeedNotificationsOptions) {
  const [bellNotifications, setBellNotifications] = useState<BellNotification[]>([]);
  const [unreadBellCount, setUnreadBellCount] = useState(0);
  const [showBellDropdown, setShowBellDropdown] = useState(false);

  const loadAuthorNotifications = useCallback(async () => {
    const { items, unreadCount } = await fetchAuthorNotifications(nickname);
    const labelByGossip = new Map<string, string>();
    for (const post of posts) {
      if (post.gossipId) {
        labelByGossip.set(normalizeGossipId(post.gossipId), gossipChatLabel(post.text));
      }
    }
    setBellNotifications(
      items.map((n) => ({
        ...n,
        label: labelByGossip.get(n.gossipId) ?? gossipChatLabels[n.gossipId],
      })),
    );
    setUnreadBellCount(unreadCount);
  }, [nickname, posts, gossipChatLabels]);

  useEffect(() => {
    if (!userId) return;
    initPushNotifications(userId);
  }, [userId]);

  useEffect(() => {
    if (!nickname.trim()) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void loadAuthorNotifications();
    });
    const channel = subscribeNotifications(nickname.trim(), loadAuthorNotifications);
    const intervalId = window.setInterval(loadAuthorNotifications, 60000);
    return () => {
      cancelled = true;
      unsubscribeChannel(channel);
      window.clearInterval(intervalId);
    };
  }, [nickname, loadAuthorNotifications]);

  const handleBellToggle = () => {
    setShowBellDropdown((open) => {
      if (!open) {
        setUnreadBellCount(0);
        markNotificationsRead(nickname);
      }
      return !open;
    });
  };

  const handleBellNotificationSelect = (gossipId: string) => {
    setShowBellDropdown(false);
    setUnreadBellCount(0);
    markNotificationsRead(nickname);
    onSelectGossip(gossipId);
  };

  return {
    bellNotifications,
    unreadBellCount,
    showBellDropdown,
    handleBellToggle,
    handleBellNotificationSelect,
  };
}
