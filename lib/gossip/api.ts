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
import { GOSSIP_FEED_LIMIT, GOSSIP_IMAGE_BUCKET, GOSSIP_PAGE_SIZE, NOTIFICATION_LIST_LIMIT } from "./constants";
import {
  applyCommentsToPost,
  commentRowToComment,
  normalizeGossipId,
} from "./parsers";
import { gossipRowToFeedPost, gossipRowToMapPin } from "./transform";
import { isMapPinWithinWindow } from "@/lib/map/pin-age";
import {
  isNotificationMutedForUser,
  type NotificationPrefType,
} from "@/lib/notification-preferences";

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

function isGossipInsertSchemaError(message: string): boolean {
  return (
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("null value") ||
    message.includes("violates not-null")
  );
}

/** Oturum + RLS uyumlu gıybet insert — user_id istemciden gönderilmez */
export async function insertGossipRow(
  base: Record<string, unknown>,
): Promise<{ row: GossipRow | null; error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { row: null, error: "authentication required" };
  }

  const payloads: Record<string, unknown>[] = [];
  const full: Record<string, unknown> = { ...base };
  delete full.user_id;

  payloads.push({ ...full });

  const withoutGeoMeta = { ...full };
  delete withoutGeoMeta.location_label;
  delete withoutGeoMeta.district;
  delete withoutGeoMeta.venue_name;
  delete withoutGeoMeta.tags;
  delete withoutGeoMeta.image_url;
  payloads.push(withoutGeoMeta);

  if (typeof full.username === "string" && full.username.trim()) {
    const withAuthor = { ...withoutGeoMeta };
    delete withAuthor.username;
    withAuthor.author = full.username;
    payloads.push(withAuthor);
  }

  payloads.push({
    content: full.content,
    city: full.city,
    lat: full.lat,
    lng: full.lng,
    username: full.username,
  });

  let lastError = getLocalizedString("errors.gossipDbFailed");
  for (const payload of payloads) {
    const { data, error } = await supabase.from("gossips").insert([payload]).select().single();
    if (!error && data) {
      return { row: data as GossipRow, error: null };
    }
    lastError = error?.message ?? lastError;
    if (
      lastError.includes("authentication required") ||
      lastError.includes("user_banned") ||
      lastError.includes("rate_limit")
    ) {
      return { row: null, error: lastError };
    }
    if (!isGossipInsertSchemaError(lastError) && !lastError.includes("row-level security")) {
      break;
    }
  }

  return { row: null, error: lastError };
}

export async function fetchGossipsPage(
  offset: number,
  limit: number,
  currentUsername = "",
): Promise<{
  posts: FeedPost[];
  pins: MapPin[];
  gossipIds: string[];
  error?: string | null;
}> {
  const locale = resolveStoredLocale() ?? detectDeviceLocale();
  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.min(Math.max(1, limit), GOSSIP_FEED_LIMIT);

  const rangeQuery = (includeDeletedFilter: boolean) => {
    let query = supabase
      .from("gossips")
      .select("*")
      .order("created_at", { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1);
    if (includeDeletedFilter) {
      query = query.is("deleted_at", null);
    }
    return query;
  };

  let { data, error } = await rangeQuery(true);
  if (
    error &&
    (error.message.includes("deleted_at") || error.message.includes("schema cache"))
  ) {
    ({ data, error } = await rangeQuery(false));
  }

  if (error) {
    console.warn("Gıybets yüklenemedi:", error.message);
    return { posts: [], pins: [], gossipIds: [], error: error.message };
  }

  if (!data?.length) {
    return { posts: [], pins: [], gossipIds: [], error: null };
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

export async function fetchGossipsFromSupabase(currentUsername = ""): Promise<{
  posts: FeedPost[];
  pins: MapPin[];
  gossipIds: string[];
}> {
  return fetchGossipsPage(0, GOSSIP_PAGE_SIZE, currentUsername);
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
      .select("id, gossip_id, message, created_at, type")
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
    const r = row as {
      id: string;
      gossip_id: string;
      message: string;
      type?: BellNotification["type"];
    };
    return {
      id: r.id,
      gossipId: r.gossip_id,
      message: r.message,
      type: r.type,
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
  type: NotificationPrefType,
  message: string,
): Promise<void> {
  const to = recipient.trim();
  const from = actor.trim();
  if (!to || !from || to === from) return;

  if (await isNotificationMutedForUser(to, type)) return;

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
