"use client";

import { useCallback, useEffect, useState } from "react";
import { blockUsername, fetchBlockedUsernames, unblockUsername } from "@/lib/moderation";

export function useBlockedAuthors(userId: string) {
  const [blockedAuthors, setBlockedAuthors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    fetchBlockedUsernames(userId).then((list) => {
      setBlockedAuthors(new Set(list));
    });
  }, [userId]);

  const blockAuthor = useCallback(
    async (author: string, nickname: string) => {
      const trimmed = author.trim();
      if (!trimmed || trimmed === nickname.trim()) return false;
      const err = await blockUsername(userId, nickname, trimmed);
      if (!err) {
        setBlockedAuthors((prev) => new Set([...prev, trimmed]));
        return true;
      }
      return false;
    },
    [userId],
  );

  const unblockAuthor = useCallback(
    async (author: string) => {
      const trimmed = author.trim();
      if (!trimmed || !userId) return false;
      const err = await unblockUsername(userId, trimmed);
      if (!err) {
        setBlockedAuthors((prev) => {
          const next = new Set(prev);
          next.delete(trimmed);
          return next;
        });
        return true;
      }
      return false;
    },
    [userId],
  );

  return { blockedAuthors, blockAuthor, unblockAuthor };
}
