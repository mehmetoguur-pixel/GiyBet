"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLocalizedString } from "@/lib/i18n";
import { subscribeGossipChat, unsubscribeChannel } from "@/lib/realtime";
import { MAX_VENUE_ROOMS } from "@/lib/gossip/constants";
import { normalizeGossipId } from "@/lib/gossip/parsers";
import {
  fetchGossipChatMessages,
  insertGossipChatMessage,
  isSupabaseSchemaMismatchError,
} from "@/lib/rooms/api";
import { gossipChatLabel } from "@/lib/rooms/chat-utils";
import type {
  AvatarCreatorConfig,
  FeedPost,
  ShareCheckIn,
  ShareSuccessResult,
  VenueChatMessage,
} from "@/lib/giybet/types";

type UseGossipChatOptions = {
  nickname: string;
  avatar: AvatarCreatorConfig;
  posts: FeedPost[];
  onShare: (payload: ShareCheckIn) => Promise<ShareSuccessResult | void>;
};

export function useGossipChat({ nickname, avatar, posts, onShare }: UseGossipChatOptions) {
  const [activeGossipChats, setActiveGossipChats] = useState<string[]>([]);
  const [currentFocusedGossipId, setCurrentFocusedGossipId] = useState<string | null>(null);
  const [gossipChatModalOpen, setGossipChatModalOpen] = useState(false);
  const [gossipChatMessages, setGossipChatMessages] = useState<Record<string, VenueChatMessage[]>>({});
  const [gossipChatLabels, setGossipChatLabels] = useState<Record<string, string>>({});
  const [gossipChatFlash, setGossipChatFlash] = useState<{ gossipId: string; label: string } | null>(
    null,
  );
  const [gossipChatError, setGossipChatError] = useState("");
  const [roomLimitAlert, setRoomLimitAlert] = useState(false);

  const activeGossipChatsRef = useRef<string[]>([]);
  const flashTimeoutRef = useRef<number | null>(null);
  const roomLimitTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    activeGossipChatsRef.current = activeGossipChats;
  }, [activeGossipChats]);

  const clearGossipChatFlash = () => {
    setGossipChatFlash(null);
    if (flashTimeoutRef.current != null) {
      window.clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = null;
    }
  };

  const loadGossipChatMessages = useCallback(async (gossipId: string) => {
    const gid = normalizeGossipId(gossipId);
    const { messages, error } = await fetchGossipChatMessages(gid);
    if (error) {
      console.warn("Sohbet mesajları yüklenemedi:", error);
      if (isSupabaseSchemaMismatchError(error)) {
        setGossipChatError(
          "Sohbet tablosu bulunamadı. Supabase'de gossip_chat_messages_setup.sql dosyasını çalıştırın.",
        );
      }
      return;
    }

    setGossipChatMessages((prev) => {
      const existing = prev[gid] ?? [];
      const fetchedIds = new Set(messages.map((m) => m.id));
      const pendingLocal = existing.filter((m) => !fetchedIds.has(m.id));
      return { ...prev, [gid]: [...messages, ...pendingLocal] };
    });
  }, []);

  useEffect(() => {
    if (!gossipChatModalOpen || !currentFocusedGossipId) return;
    const gid = currentFocusedGossipId;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void loadGossipChatMessages(gid);
    });
    const channel = subscribeGossipChat(gid, () => {
      loadGossipChatMessages(gid);
    });
    const intervalId = window.setInterval(() => {
      loadGossipChatMessages(gid);
    }, 30000);
    return () => {
      cancelled = true;
      unsubscribeChannel(channel);
      window.clearInterval(intervalId);
    };
  }, [gossipChatModalOpen, currentFocusedGossipId, loadGossipChatMessages]);

  const openGossipChat = async (gossipId: string, label: string) => {
    const gid = normalizeGossipId(gossipId);
    setGossipChatLabels((prev) => ({ ...prev, [gid]: label }));
    setGossipChatError("");

    await loadGossipChatMessages(gid);

    const current = activeGossipChatsRef.current;
    if (current.includes(gid)) {
      setCurrentFocusedGossipId(gid);
      clearGossipChatFlash();
      setGossipChatModalOpen(true);
      return;
    }
    if (current.length >= MAX_VENUE_ROOMS) {
      setRoomLimitAlert(true);
      if (roomLimitTimeoutRef.current != null) {
        window.clearTimeout(roomLimitTimeoutRef.current);
      }
      roomLimitTimeoutRef.current = window.setTimeout(() => {
        setRoomLimitAlert(false);
        roomLimitTimeoutRef.current = null;
      }, 4000);
      return;
    }

    setActiveGossipChats([...current, gid]);
    setCurrentFocusedGossipId(gid);
    clearGossipChatFlash();
    setGossipChatModalOpen(true);
  };

  const handleShareWithChat = async (payload: ShareCheckIn): Promise<ShareSuccessResult | void> => {
    const result = await onShare(payload);
    if (result?.chatGossipId) {
      const gid = normalizeGossipId(result.chatGossipId);
      await openGossipChat(gid, result.chatLabel);
      const sharePreview =
        payload.text.trim() ||
        (payload.imageFile || payload.imageUrl ? "📷 Fotoğraf paylaştı" : "");
      if (sharePreview) {
        const { message: persisted, error: sendError } = await insertGossipChatMessage(
          gid,
          nickname,
          sharePreview,
        );
        if (sendError) setGossipChatError(sendError);
        if (persisted) {
          setGossipChatMessages((prev) => ({
            ...prev,
            [gid]: [...(prev[gid] ?? []), persisted],
          }));
        }
      }
    }
    return result;
  };

  const focusGossipChat = (gossipId: string) => {
    if (!activeGossipChatsRef.current.includes(gossipId)) return;
    setCurrentFocusedGossipId(gossipId);
    clearGossipChatFlash();
    setGossipChatModalOpen(true);
  };

  const handleGossipFlashNavigate = (gossipId: string) => {
    if (flashTimeoutRef.current != null) {
      window.clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = null;
    }
    const flash = gossipChatFlash;
    setGossipChatFlash(null);
    openGossipChat(
      gossipId,
      flash?.label ?? gossipChatLabels[gossipId] ?? getLocalizedString("chat.defaultLabel"),
    );
  };

  const leaveGossipChat = (gossipId: string) => {
    setActiveGossipChats((prev) => {
      const next = prev.filter((id) => id !== gossipId);
      setCurrentFocusedGossipId((focused) => {
        if (focused !== gossipId) return focused;
        return next[0] ?? null;
      });
      if (next.length === 0) {
        setGossipChatModalOpen(false);
      }
      return next;
    });
    setGossipChatFlash((flash) => (flash?.gossipId === gossipId ? null : flash));
  };

  const handleGossipChatSend = async (text: string) => {
    if (!currentFocusedGossipId) return;
    const gid = currentFocusedGossipId;
    const optimistic: VenueChatMessage = {
      id: Date.now(),
      author: nickname,
      text,
      avatar,
    };
    setGossipChatMessages((prev) => ({
      ...prev,
      [gid]: [...(prev[gid] ?? []), optimistic],
    }));
    const { message: persisted, error: sendError } = await insertGossipChatMessage(
      gid,
      nickname,
      text,
    );
    if (sendError) {
      setGossipChatError(sendError);
      console.warn("Mesaj sunucuya kaydedilemedi:", sendError);
    } else {
      setGossipChatError("");
    }
    if (persisted) {
      setGossipChatMessages((prev) => ({
        ...prev,
        [gid]: [...(prev[gid] ?? []).filter((m) => m.id !== optimistic.id), persisted],
      }));
    }
  };

  const openGossipChatFromNotification = (gossipId: string) => {
    const post = posts.find((p) => p.gossipId && normalizeGossipId(p.gossipId) === gossipId);
    const label =
      post
        ? gossipChatLabel(post.text)
        : gossipChatLabels[gossipId] ?? getLocalizedString("chat.defaultLabel");
    openGossipChat(gossipId, label);
  };

  return {
    activeGossipChats,
    currentFocusedGossipId,
    gossipChatModalOpen,
    setGossipChatModalOpen,
    gossipChatMessages,
    gossipChatLabels,
    gossipChatFlash,
    gossipChatError,
    setGossipChatError,
    roomLimitAlert,
    openGossipChat,
    handleShareWithChat,
    focusGossipChat,
    handleGossipFlashNavigate,
    leaveGossipChat,
    handleGossipChatSend,
    openGossipChatFromNotification,
  };
}
