"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchFollowCounts,
  fetchFollowingUsernames,
  followUsername,
  unfollowUsername,
} from "@/lib/follows";

export function useFollowAuthors(userId: string, nickname: string) {
  const [followingAuthors, setFollowingAuthors] = useState<Set<string>>(new Set());
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

  const refreshFollows = useCallback(async () => {
    if (!userId) return;
    const [list, counts] = await Promise.all([
      fetchFollowingUsernames(userId),
      fetchFollowCounts(nickname, userId),
    ]);
    setFollowingAuthors(new Set(list));
    setFollowCounts(counts);
  }, [userId, nickname]);

  useEffect(() => {
    refreshFollows();
  }, [refreshFollows]);

  const followAuthor = useCallback(
    async (author: string) => {
      const trimmed = author.trim();
      if (!trimmed || trimmed === nickname.trim() || !userId) return false;
      const err = await followUsername(userId, nickname, trimmed);
      if (!err) {
        setFollowingAuthors((prev) => new Set([...prev, trimmed]));
        setFollowCounts((c) => ({ ...c, following: c.following + 1 }));
        return true;
      }
      return false;
    },
    [userId, nickname],
  );

  const unfollowAuthor = useCallback(
    async (author: string) => {
      const trimmed = author.trim();
      if (!trimmed || !userId) return false;
      const err = await unfollowUsername(userId, trimmed);
      if (!err) {
        setFollowingAuthors((prev) => {
          const next = new Set(prev);
          next.delete(trimmed);
          return next;
        });
        setFollowCounts((c) => ({ ...c, following: Math.max(0, c.following - 1) }));
        return true;
      }
      return false;
    },
    [userId],
  );

  const toggleFollowAuthor = useCallback(
    async (author: string) => {
      const trimmed = author.trim();
      if (followingAuthors.has(trimmed)) {
        return unfollowAuthor(trimmed);
      }
      return followAuthor(trimmed);
    },
    [followingAuthors, followAuthor, unfollowAuthor],
  );

  return {
    followingAuthors,
    followCounts,
    refreshFollows,
    followAuthor,
    unfollowAuthor,
    toggleFollowAuthor,
  };
}
