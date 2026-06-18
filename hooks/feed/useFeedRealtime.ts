"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  commentRowFromRealtime,
  gossipRowFromRealtime,
  mergeCommentInsert,
  mergeGossipInsert,
  mergeGossipUpdate,
} from "@/lib/gossip/realtime-feed";
import { subscribeFeedRealtime, unsubscribeChannel } from "@/lib/realtime";
import type { FeedPost, MapPin } from "@/lib/giybet/types";

const FEED_POLL_MS = 20_000;

type UseFeedRealtimeOptions = {
  enabled: boolean;
  nickname: string;
  setFeedPosts: Dispatch<SetStateAction<FeedPost[]>>;
  setMapPins: Dispatch<SetStateAction<MapPin[]>>;
  onRefresh: () => void;
};

export function useFeedRealtime({
  enabled,
  nickname,
  setFeedPosts,
  setMapPins,
  onRefresh,
}: UseFeedRealtimeOptions) {
  useEffect(() => {
    if (!enabled) return;

    const channel = subscribeFeedRealtime({
      onGossipInsert: (payload) => {
        const row = gossipRowFromRealtime(payload);
        if (!row) return;
        setFeedPosts((prevPosts) => {
          const merged = mergeGossipInsert(prevPosts, [], row, nickname);
          if (!merged.added) return prevPosts;
          setMapPins((prevPins) => mergeGossipInsert(prevPosts, prevPins, row, nickname).pins);
          return merged.posts;
        });
      },
      onGossipUpdate: (payload) => {
        const row = gossipRowFromRealtime(payload);
        if (!row) return;
        setFeedPosts((prevPosts) => {
          const postMerge = mergeGossipUpdate(prevPosts, [], row, nickname);
          setMapPins((prevPins) => mergeGossipUpdate(prevPosts, prevPins, row, nickname).pins);
          return postMerge.posts;
        });
      },
      onCommentInsert: (payload) => {
        const row = commentRowFromRealtime(payload);
        if (!row) return;
        setFeedPosts((prev) => mergeCommentInsert(prev, row));
      },
    });

    const intervalId = window.setInterval(onRefresh, FEED_POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") onRefresh();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsubscribeChannel(channel);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, nickname, setFeedPosts, setMapPins, onRefresh]);
}
