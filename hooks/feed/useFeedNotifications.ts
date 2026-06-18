"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  onSelectFollow?: () => void;
};

export function useFeedNotifications({
  userId,
  nickname,
  posts,
  gossipChatLabels,
  onSelectGossip,
  onSelectFollow,
}: UseFeedNotificationsOptions) {
  const [bellNotifications, setBellNotifications] = useState<BellNotification[]>([]);
  const [unreadBellCount, setUnreadBellCount] = useState(0);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const lastUnreadRef = useRef(0);

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
    if (unreadCount > lastUnreadRef.current && typeof window !== "undefined" && "Notification" in window) {
      const latest = items[0];
      if (Notification.permission === "granted" && latest) {
        try {
          new Notification("GıyBet", { body: latest.message, tag: latest.id });
        } catch {
          /* optional */
        }
      }
    }
    lastUnreadRef.current = unreadCount;
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
    const trimmed = nickname.trim();
    const channel = subscribeNotifications(trimmed, loadAuthorNotifications);
    const intervalId = window.setInterval(loadAuthorNotifications, 45_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") loadAuthorNotifications();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      unsubscribeChannel(channel);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
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

  const handleBellNotificationSelect = (notification: BellNotification) => {
    setShowBellDropdown(false);
    setUnreadBellCount(0);
    markNotificationsRead(nickname);

    const isFollow =
      notification.type === "follow" || notification.gossipId.startsWith("follow-");
    if (isFollow) {
      onSelectFollow?.();
      return;
    }
    onSelectGossip(notification.gossipId);
  };

  return {
    bellNotifications,
    unreadBellCount,
    showBellDropdown,
    handleBellToggle,
    handleBellNotificationSelect,
  };
}
