"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeAvatar } from "@/lib/avatar";
import { formatFeedCityLabel, formatLocationLabel, mockDistrictForCity, randomPostDistance } from "@/lib/feed/format";
import { extractHashtags, mergeTags, parseGossipTags } from "@/lib/feed/tags";
import { reactionLabel } from "@/lib/gossip/api";
import {
  enrichPostsWithComments,
  fetchGossipsFromSupabase,
  insertCommentToSupabase,
  notifyPostAuthor,
  updateGossipEngagement,
  uploadGossipImage,
} from "@/lib/gossip/api";
import {
  asPostId,
  commentRowToComment,
  normalizeGossipId,
  parseGossipAvatar,
  resolveGossipLocation,
} from "@/lib/gossip/parsers";
import { gossipRowToFeedPost } from "@/lib/gossip/transform";
import { detectCityFromCoords, buildShareLocationFast } from "@/lib/geo";
import { gossipChatLabel } from "@/lib/rooms/chat-utils";
import {
  createRoomForGossip,
  fetchRoomsFromSupabase,
  findRoomByPlaceId,
  findRoomByPlaceIdLocal,
  roomRowToMapRoom,
} from "@/lib/rooms/api";
import { deleteOwnGossip, GOSSIP_RATE_LIMIT, isRateLimitError } from "@/lib/moderation";
import { isBanError } from "@/lib/rate-limit";
import { getLocalizedString } from "@/lib/i18n";
import { useFeedRealtime } from "@/hooks/feed/useFeedRealtime";
import { mergeServerPostsIntoFeed } from "@/lib/gossip/realtime-feed";
import { supabase } from "@/lib/supabase";
import type { PlaceDetail } from "@/lib/places-api";
import type {
  AvatarCreatorConfig,
  Comment,
  FeedPost,
  GossipRow,
  MapPin,
  MapRoom,
  PostReactions,
  ReactionKey,
  RegisteredUser,
  RoomRow,
  ShareCheckIn,
  ShareSuccessResult,
} from "@/lib/giybet/types";

type UseFeedActionsOptions = {
  onFeed: boolean;
  nickname: string;
  avatarCreator: AvatarCreatorConfig;
  registeredUser: RegisteredUser | null;
  t: (key: string, params?: Record<string, string | number>) => string;
  onLogout: () => void;
};

export function useFeedActions({
  onFeed,
  nickname,
  avatarCreator,
  registeredUser,
  t,
  onLogout,
}: UseFeedActionsOptions) {
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [mapPins, setMapPins] = useState<MapPin[]>([]);
  const [mapRooms, setMapRooms] = useState<MapRoom[]>([]);
  const [engagementToast, setEngagementToast] = useState<string | null>(null);
  const lastShareAtRef = useRef(0);
  const refreshInFlightRef = useRef(false);

  const refreshFeed = useCallback(async () => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    try {
      const { posts, pins } = await fetchGossipsFromSupabase(nickname);
      setFeedPosts((prev) => mergeServerPostsIntoFeed(prev, posts));
      setMapPins(pins);
      const withComments = await enrichPostsWithComments(posts);
      setFeedPosts((prev) => mergeServerPostsIntoFeed(prev, withComments));
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [nickname]);

  useEffect(() => {
    if (!engagementToast) return;
    const timer = setTimeout(() => setEngagementToast(null), 6000);
    return () => clearTimeout(timer);
  }, [engagementToast]);

  useEffect(() => {
    if (!onFeed) return;

    let cancelled = false;

    refreshFeed().then(() => {
      if (cancelled) return;
    });

    fetchRoomsFromSupabase().then((rooms) => {
      if (!cancelled && rooms.length) setMapRooms(rooms);
    });

    return () => {
      cancelled = true;
    };
  }, [onFeed, refreshFeed]);

  useFeedRealtime({
    enabled: onFeed,
    nickname,
    setFeedPosts,
    setMapPins,
    onRefresh: refreshFeed,
  });

  const clearFeedData = () => {
    setFeedPosts([]);
    setMapPins([]);
    setMapRooms([]);
    setEngagementToast(null);
  };

  const handleCreateRoomAtPlace = async (place: PlaceDetail): Promise<MapRoom | null> => {
    const existingLocal = findRoomByPlaceIdLocal(mapRooms, place.placeId);
    if (existingLocal) return existingLocal;

    const existingRemote = await findRoomByPlaceId(place.placeId);
    if (existingRemote) {
      setMapRooms((prev) => {
        if (prev.some((room) => room.id === existingRemote.id)) return prev;
        return [existingRemote, ...prev];
      });
      return existingRemote;
    }

    const city =
      detectCityFromCoords(place.lat, place.lng) === "Ankara" ? "Ankara" : "İstanbul";

    const { data, error } = await supabase
      .from("rooms")
      .insert([
        {
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          city,
          place_id: place.placeId,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message || getLocalizedString("errors.roomCreateFailed"));
    }

    const newRoom = roomRowToMapRoom(data as RoomRow);
    setMapRooms((prev) => [newRoom, ...prev]);
    return newRoom;
  };

  const handleDeleteGossip = async (postId: number) => {
    const post = feedPosts.find((p) => p.id === postId);
    if (!post?.gossipId) return;
    const err = await deleteOwnGossip(normalizeGossipId(post.gossipId));
    if (err) {
      setEngagementToast(t("errors.deleteFailed"));
      return;
    }
    setFeedPosts((prev) => prev.filter((p) => p.id !== postId));
    setMapPins((prev) => prev.filter((p) => p.feedPostId !== postId));
  };

  const handleShare = async (payload: ShareCheckIn): Promise<ShareSuccessResult> => {
    const now = Date.now();
    if (now - lastShareAtRef.current < GOSSIP_RATE_LIMIT.clientCooldownMs) {
      throw new Error(t("errors.rateLimitMinute"));
    }
    lastShareAtRef.current = now;

    const location = resolveGossipLocation(payload);
    const trimmedText = payload.text.trim();
    const hasImage = Boolean(payload.imageFile || payload.imageUrl);

    if (!trimmedText && !hasImage) {
      throw new Error(getLocalizedString("errors.gossipContentRequired"));
    }

    let persistedImageUrl: string | undefined;
    if (payload.imageFile) {
      const uploaded = await uploadGossipImage(payload.imageFile);
      if (uploaded) persistedImageUrl = uploaded;
    } else if (payload.imageUrl?.startsWith("http")) {
      persistedImageUrl = payload.imageUrl;
    }

    const localImageUrl =
      !persistedImageUrl && payload.imageUrl?.startsWith("blob:")
        ? payload.imageUrl
        : undefined;
    const displayImageUrl = persistedImageUrl ?? localImageUrl;

    const shareLocation =
      payload.locationLabel?.trim() || payload.district?.trim() || payload.cityLabel?.trim()
        ? {
            city: payload.city ?? location.feedCity,
            cityLabel:
              payload.cityLabel?.trim() ||
              formatFeedCityLabel(payload.city) ||
              location.city,
            district:
              payload.district?.trim() ||
              mockDistrictForCity(payload.city ?? location.feedCity),
            locationLabel:
              payload.locationLabel?.trim() ||
              (formatLocationLabel({
                city: payload.city ?? location.feedCity,
                cityLabel: payload.cityLabel,
                district: payload.district,
                venue: payload.venue,
              }) ??
                `${payload.cityLabel ?? location.city} - ${payload.district ?? ""}`),
            ...(payload.venue ? { venue: payload.venue } : {}),
          }
        : location.hasUserCoords
          ? buildShareLocationFast(location.lat, location.lng, {
              city: location.feedCity,
              venue: payload.venue,
              manualDistrict: payload.district,
            })
          : null;

    const postTags = mergeTags(payload.tags, extractHashtags(trimmedText));

    const gossipInsert: Record<string, unknown> = {
      content: trimmedText || (displayImageUrl ? "📷" : ""),
      city: shareLocation?.cityLabel ?? location.city,
      lat: location.lat,
      lng: location.lng,
      username: nickname,
      tags: postTags,
    };
    if (registeredUser?.userId) gossipInsert.user_id = registeredUser.userId;
    if (persistedImageUrl) gossipInsert.image_url = persistedImageUrl;
    if (shareLocation?.locationLabel) gossipInsert.location_label = shareLocation.locationLabel;
    if (shareLocation?.district) gossipInsert.district = shareLocation.district;
    const venueName = shareLocation?.venue ?? payload.venue;
    if (venueName) gossipInsert.venue_name = venueName;

    const insertPayload = { ...gossipInsert };
    let insertResult = await supabase
      .from("gossips")
      .insert([insertPayload])
      .select()
      .single();

    if (
      insertResult.error &&
      (insertResult.error.message.includes("location_label") ||
        insertResult.error.message.includes("district") ||
        insertResult.error.message.includes("venue_name") ||
        insertResult.error.message.includes("tags") ||
        insertResult.error.message.includes("schema cache"))
    ) {
      delete insertPayload.location_label;
      delete insertPayload.district;
      delete insertPayload.venue_name;
      delete insertPayload.tags;
      insertResult = await supabase.from("gossips").insert([insertPayload]).select().single();
    }

    const { data, error: insertError } = insertResult;

    if (insertError) {
      if (isBanError(insertError.message)) {
        throw new Error(t("errors.userBanned"));
      }
      if (isRateLimitError(insertError.message)) {
        throw new Error(
          insertError.message.includes("hour")
            ? t("errors.rateLimitHour")
            : t("errors.rateLimitMinute"),
        );
      }
      throw new Error(insertError.message || getLocalizedString("errors.gossipDbFailed"));
    }

    const row = data as GossipRow;
    const gossipId = normalizeGossipId(row.id);
    const chatLabel = gossipChatLabel(
      trimmedText ||
        (displayImageUrl ? getLocalizedString("chat.photoLabel") : getLocalizedString("common.gossip")),
    );

    const linkedRoom = await createRoomForGossip(
      gossipId,
      { lat: location.lat, lng: location.lng, city: location.city },
      trimmedText || "📷",
      { skipExistingLookup: true },
    );

    await supabase.from("gossips").update({ room_id: linkedRoom.id }).eq("id", row.id);

    setMapRooms((prev) => {
      if (prev.some((room) => room.id === linkedRoom.id)) return prev;
      return [linkedRoom, ...prev];
    });

    const postId = asPostId(row.id);
    const basePost = gossipRowToFeedPost(row, nickname);

    const newPost: FeedPost = {
      ...basePost,
      avatar: parseGossipAvatar(row.avatar) ?? avatarCreator,
      district: shareLocation?.district ?? payload.district,
      cityLabel: shareLocation?.cityLabel ?? basePost.cityLabel,
      locationLabel: shareLocation?.locationLabel ?? payload.locationLabel,
      tags: parseGossipTags(row),
      distanceMeters: payload.distanceMeters ?? randomPostDistance(),
      ...(displayImageUrl ? { imageUrl: displayImageUrl } : {}),
      ...(shareLocation?.venue || payload.venue
        ? { venue: shareLocation?.venue ?? payload.venue }
        : {}),
    };
    setFeedPosts((prev) => [newPost, ...prev]);

    const feedLocationLabel =
      newPost.locationLabel ??
      formatLocationLabel({
        city: shareLocation?.city ?? location.feedCity,
        cityLabel: shareLocation?.cityLabel ?? newPost.cityLabel,
        district: shareLocation?.district ?? newPost.district,
        venue: shareLocation?.venue ?? payload.venue,
      });
    const mapVenueLabel = feedLocationLabel ?? chatLabel;

    setMapPins((prev) => [
      {
        id: postId,
        feedPostId: postId,
        lat: location.lat,
        lng: location.lng,
        location: `${mapVenueLabel} · Sohbet`,
        venue: shareLocation?.venue ?? payload.venue ?? feedLocationLabel ?? undefined,
        city: location.feedCity,
        author: basePost.author,
        text: newPost.text,
        avatar: parseGossipAvatar(row.avatar) ?? avatarCreator,
        isUserPin: location.hasUserCoords,
        roomId: linkedRoom.id,
      },
      ...prev,
    ]);

    return {
      room: linkedRoom,
      lat: location.lat,
      lng: location.lng,
      venue: payload.venue,
      chatGossipId: gossipId,
      chatLabel,
    };
  };

  const handleToggleLike = async (postId: number) => {
    const post = feedPosts.find((p) => p.id === postId);
    if (!post) return;

    const trimmedNickname = nickname.trim();
    const applyLikeState = (liked: boolean, likers: string[]) => {
      setFeedPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, liked, likers } : p)),
      );
    };

    if (!post.gossipId || !trimmedNickname) {
      if (post.liked) {
        applyLikeState(false, post.likers.filter((name) => name !== trimmedNickname));
      } else if (post.likers.includes(trimmedNickname)) {
        applyLikeState(true, post.likers);
      } else {
        applyLikeState(true, [...post.likers, trimmedNickname]);
      }
      return;
    }

    const gossipId = normalizeGossipId(post.gossipId);

    if (post.liked) {
      const nextLikers = post.likers.filter((name) => name !== trimmedNickname);
      applyLikeState(false, nextLikers);
      const persistError = await updateGossipEngagement(gossipId, {
        like_usernames: nextLikers,
      });
      if (persistError) {
        console.error("Beğeni kaldırılamadı:", persistError);
        setEngagementToast(`${t("errors.likeFailed")}: ${persistError}`);
        applyLikeState(true, post.likers);
      }
      return;
    }

    const nextLikers = post.likers.includes(trimmedNickname)
      ? post.likers
      : [...post.likers, trimmedNickname];
    applyLikeState(true, nextLikers);

    const persistError = await updateGossipEngagement(gossipId, {
      like_usernames: nextLikers,
    });
    if (persistError) {
      console.error("Beğeni kaydedilemedi:", persistError);
      setEngagementToast(`${t("errors.likeFailed")}: ${persistError}`);
      applyLikeState(false, post.likers);
    } else if (post.author !== trimmedNickname) {
      await notifyPostAuthor(
        post.author,
        trimmedNickname,
        gossipId,
        "like",
        `${trimmedNickname} gıybetini beğendi`,
      );
    }
  };

  const handleAddComment = async (postId: number, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const post = feedPosts.find((p) => p.id === postId);

    let newComment: Comment;

    if (post?.gossipId) {
      const { data, error: persistError } = await insertCommentToSupabase(
        post.gossipId,
        nickname,
        trimmed,
      );

      if (persistError || !data) {
        console.error("Yorum kaydedilemedi:", persistError);
        setEngagementToast(
          persistError
            ? `${t("errors.commentFailed")}: ${persistError}`
            : t("errors.commentFailed"),
        );
        newComment = {
          id: Date.now(),
          author: nickname,
          text: trimmed,
          avatar: avatarCreator,
        };
      } else {
        newComment = commentRowToComment(data);
        newComment.avatar = avatarCreator;
      }
    } else {
      newComment = {
        id: Date.now(),
        author: nickname,
        text: trimmed,
        avatar: avatarCreator,
      };
    }

    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id !== postId ? p : { ...p, commentItems: [...p.commentItems, newComment] },
      ),
    );

    if (post?.gossipId && post.author !== nickname.trim()) {
      const preview = trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
      await notifyPostAuthor(
        post.author,
        nickname,
        post.gossipId,
        "comment",
        `${nickname} yorum yaptı: ${preview}`,
      );
    }
  };

  const handleToggleReaction = async (postId: number, reaction: ReactionKey) => {
    const post = feedPosts.find((p) => p.id === postId);
    if (!post) return;

    const trimmedNickname = nickname.trim();
    const prevReaction = post.userReaction;
    const nextCounts = { ...post.reactions };
    let nextUserReaction: ReactionKey | null;

    if (prevReaction === reaction) {
      nextCounts[reaction] = Math.max(0, nextCounts[reaction] - 1);
      nextUserReaction = null;
    } else {
      if (prevReaction) {
        nextCounts[prevReaction] = Math.max(0, nextCounts[prevReaction] - 1);
      }
      nextCounts[reaction] += 1;
      nextUserReaction = reaction;
    }

    const nextUserReactionsMap = { ...(post.userReactionsMap ?? {}) };
    if (nextUserReaction === null) {
      delete nextUserReactionsMap[trimmedNickname];
    } else if (trimmedNickname) {
      nextUserReactionsMap[trimmedNickname] = nextUserReaction;
    }

    const applyReactionState = (
      reactions: PostReactions,
      userReaction: ReactionKey | null,
      userReactionsMap: Record<string, ReactionKey>,
    ) => {
      setFeedPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, reactions, userReaction, userReactionsMap } : p,
        ),
      );
    };

    applyReactionState(nextCounts, nextUserReaction, nextUserReactionsMap);

    if (!post.gossipId || !trimmedNickname) return;

    const gossipId = normalizeGossipId(post.gossipId);
    const persistError = await updateGossipEngagement(gossipId, {
      reaction_counts: nextCounts,
      user_reactions: nextUserReactionsMap,
    });
    if (persistError) {
      console.error("İfade kaydedilemedi:", persistError);
      setEngagementToast(`${t("errors.reactionFailed")}: ${persistError}`);
      applyReactionState(post.reactions, post.userReaction, post.userReactionsMap ?? {});
    } else if (nextUserReaction && post.author !== trimmedNickname) {
      await notifyPostAuthor(
        post.author,
        trimmedNickname,
        gossipId,
        "reaction",
        `${trimmedNickname} ${reactionLabel(nextUserReaction, t)}`,
      );
    }
  };

  const handleSaveAvatar = async (newAvatar: AvatarCreatorConfig) => {
    const normalized = normalizeAvatar(newAvatar);
    await supabase.auth.updateUser({ data: { avatar: normalized } });
    setFeedPosts((prev) =>
      prev.map((post) => ({
        ...post,
        avatar: post.author === nickname ? normalized : post.avatar,
        commentItems: post.commentItems.map((c) =>
          c.author === nickname ? { ...c, avatar: normalized } : c,
        ),
      })),
    );
    setMapPins((prev) =>
      prev.map((pin) => (pin.author === nickname ? { ...pin, avatar: normalized } : pin)),
    );
    return normalized;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
    clearFeedData();
  };

  return {
    feedPosts,
    mapPins,
    mapRooms,
    engagementToast,
    clearFeedData,
    handleCreateRoomAtPlace,
    handleDeleteGossip,
    handleShare,
    handleToggleLike,
    handleAddComment,
    handleToggleReaction,
    handleSaveAvatar,
    handleLogout,
  };
}
