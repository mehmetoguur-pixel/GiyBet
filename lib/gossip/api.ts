import { supabase } from "@/lib/supabase";
import { detectDeviceLocale, getLocalizedString, resolveStoredLocale, type Translator } from "@/lib/i18n";
import type {
  BellNotification,
  Comment,
  CommentRow,
  FeedPost,
  GossipRow,
  MapPin,
  ReactionKey,
} from "@/lib/giybet/types";
import { GOSSIP_FEED_LIMIT, GOSSIP_IMAGE_BUCKET, NOTIFICATION_LIST_LIMIT } from "./constants";
import {
  applyCommentsToPost,
  commentRowToComment,
  normalizeGossipId,
} from "./parsers";
import { gossipRowToFeedPost, gossipRowToMapPin } from "./transform";
import { isMapPinWithinWindow } from "@/lib/map/pin-age";

export async function uploadGossipImage(file: File): Promise<string | null> {
  try {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
    const { error } = await supabase.storage
      .from(GOSSIP_IMAGE_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) {
      console.warn("Görsel yüklenemedi:", error.message);
      return null;
    }
    const { data } = supabase.storage.from(GOSSIP_IMAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}
export async function updateGossipEngagement(
  gossipId: string,
  patch: Record<string, unknown>,
): Promise<string | null> {
  const rpcPayload: Record<string, unknown> = { p_gossip_id: gossipId };
  if (patch.like_usernames !== undefined) rpcPayload.p_like_usernames = patch.like_usernames;
  if (patch.reaction_counts !== undefined) rpcPayload.p_reaction_counts = patch.reaction_counts;
  if (patch.user_reactions !== undefined) rpcPayload.p_user_reactions = patch.user_reactions;

  const { error: rpcError } = await supabase.rpc("update_gossip_engagement", rpcPayload);
  if (!rpcError) return null;

  if (rpcError.message.includes("Could not find the function")) {
    const { error } = await supabase.from("gossips").update(patch).eq("id", gossipId);
    return error?.message ?? null;
  }
  return rpcError.message;
}
export async function insertCommentToSupabase(
  gossipId: string,
  nickname: string,
  content: string,
  imageUrl?: string,
): Promise<{ data: CommentRow | null; error: string | null }> {
  const gid = normalizeGossipId(gossipId);
  const author = nickname.trim();
  const payloads: Record<string, string>[] = [
    { gossip_id: gid, author, content },
    { gossip_id: gid, username: author, content },
    { gossip_id: gid, content },
  ];
  if (imageUrl?.startsWith("http://") || imageUrl?.startsWith("https://")) {
    payloads[0].image_url = imageUrl;
    payloads[1].image_url = imageUrl;
  }

  let lastError: string | null = null;
  for (const payload of payloads) {
    const { data, error } = await supabase.from("comments").insert([payload]).select().single();
    if (!error && data) return { data: data as CommentRow, error: null };
    lastError = error?.message ?? getLocalizedString("errors.commentFailed");
    if (
      !error?.message.includes("column") &&
      !error?.message.includes("schema cache")
    ) {
      return { data: null, error: lastError };
    }
  }
  return { data: null, error: lastError };
}

export async function fetchCommentsByGossipIds(gossipIds: string[]): Promise<Map<string, Comment[]>> {
  const map = new Map<string, Comment[]>();
  if (!gossipIds.length) return map;

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .in("gossip_id", gossipIds)
    .order("created_at", { ascending: true });

  if (error || !data?.length) {
    if (error) console.warn("Yorumlar yüklenemedi:", error.message);
    return map;
  }

  for (const raw of data) {
    const row = raw as CommentRow;
    const gossipId = normalizeGossipId(row.gossip_id);
    const list = map.get(gossipId) ?? [];
    list.push(commentRowToComment(row));
    map.set(gossipId, list);
  }
  return map;
}
export async function fetchGossipsFromSupabase(currentUsername = ""): Promise<{
  posts: FeedPost[];
  pins: MapPin[];
  gossipIds: string[];
}> {
  const locale = resolveStoredLocale() ?? detectDeviceLocale();
  const { data, error } = await supabase
    .from("gossips")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(GOSSIP_FEED_LIMIT);

  if (error || !data?.length) {
    return { posts: [], pins: [], gossipIds: [] };
  }

  const posts: FeedPost[] = [];
  const pins: MapPin[] = [];
  const gossipIds: string[] = [];

  for (const raw of data) {
    const row = raw as GossipRow;
    const post = gossipRowToFeedPost(row, currentUsername, locale);
    posts.push(post);
    if (isMapPinWithinWindow(row.created_at)) {
      pins.push(gossipRowToMapPin(row, post.id, post.author, post.avatar));
    }
    gossipIds.push(normalizeGossipId(row.id));
  }

  return { posts, pins, gossipIds };
}

/** Yorumları arka planda yükle — feed önce görünür */
export async function enrichPostsWithComments(posts: FeedPost[]): Promise<FeedPost[]> {
  const gossipIds = posts
    .map((p) => (p.gossipId ? normalizeGossipId(p.gossipId) : ""))
    .filter(Boolean);
  if (!gossipIds.length) return posts;
  const commentsMap = await fetchCommentsByGossipIds(gossipIds);
  return posts.map((post) => applyCommentsToPost(post, commentsMap));
}
export async function fetchAuthorNotifications(recipient: string): Promise<{
  items: BellNotification[];
  unreadCount: number;
}> {
  const trimmed = recipient.trim();
  if (!trimmed) return { items: [], unreadCount: 0 };

  const [listResult, countResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, gossip_id, message, created_at")
      .eq("recipient_username", trimmed)
      .order("created_at", { ascending: false })
      .limit(NOTIFICATION_LIST_LIMIT),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_username", trimmed)
      .eq("read", false),
  ]);

  if (listResult.error || !listResult.data?.length) {
    return { items: [], unreadCount: countResult.count ?? 0 };
  }

  const items = listResult.data.map((row) => {
    const r = row as { id: string; gossip_id: string; message: string };
    return {
      id: r.id,
      gossipId: r.gossip_id,
      message: r.message,
    };
  });

  return { items, unreadCount: countResult.count ?? 0 };
}

export async function markNotificationsRead(recipient: string): Promise<void> {
  const trimmed = recipient.trim();
  if (!trimmed) return;
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("recipient_username", trimmed)
    .eq("read", false);
}

export async function notifyPostAuthor(
  recipient: string,
  actor: string,
  gossipId: string,
  type: "like" | "comment" | "reaction",
  message: string,
): Promise<void> {
  const to = recipient.trim();
  const from = actor.trim();
  if (!to || !from || to === from) return;

  await supabase.from("notifications").insert([
    {
      recipient_username: to,
      actor_username: from,
      gossip_id: normalizeGossipId(gossipId),
      type,
      message,
    },
  ]);
}

export function reactionLabel(key: ReactionKey, t: Translator): string {
  if (key === "fire") return `🔥 ${t("reactions.fire")}`;
  if (key === "shock") return `😱 ${t("reactions.shock")}`;
  return t("reactions.betweenUs");
}
