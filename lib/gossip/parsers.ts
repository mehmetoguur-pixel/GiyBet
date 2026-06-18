import { normalizeAvatar, SAMPLE_AVATARS } from "@/lib/avatar";
import { formatGossipTime, type SupportedLocale } from "@/lib/i18n";
import {
  ANONYMOUS_GOSSIP_AUTHOR,
  DEFAULT_GOSSIP_LOCATION,
  EMPTY_REACTIONS,
} from "./constants";
import type {
  AvatarCreatorConfig,
  City,
  Comment,
  CommentRow,
  FeedPost,
  GossipRow,
  PostReactions,
  ReactionKey,
  ShareCheckIn,
} from "@/lib/giybet/types";

export function avatarForAuthor(author: string): AvatarCreatorConfig {
  let hash = 0;
  for (let i = 0; i < author.length; i++) {
    hash = (hash + author.charCodeAt(i) * (i + 1)) % SAMPLE_AVATARS.length;
  }
  return SAMPLE_AVATARS[Math.abs(hash) % SAMPLE_AVATARS.length];
}

export function parseGossipAvatar(raw: unknown): AvatarCreatorConfig | null {
  if (!raw || typeof raw !== "object") return null;
  return normalizeAvatar(raw as Partial<AvatarCreatorConfig>);
}

export function resolveGossipAuthor(row: GossipRow): string {
  const username = row.username?.trim();
  if (username) return username;
  const author = row.author?.trim();
  if (author) return author;
  return ANONYMOUS_GOSSIP_AUTHOR;
}

export function resolveGossipAvatar(row: GossipRow, author: string): AvatarCreatorConfig {
  return parseGossipAvatar(row.avatar) ?? avatarForAuthor(author);
}

export function resolveGossipLocation(payload: ShareCheckIn): {
  lat: number;
  lng: number;
  city: string;
  feedCity: City;
  hasUserCoords: boolean;
} {
  const hasUserCoords = payload.lat != null && payload.lng != null;
  if (hasUserCoords) {
    const feedCity = payload.city ?? DEFAULT_GOSSIP_LOCATION.feedCity;
    return {
      lat: payload.lat!,
      lng: payload.lng!,
      city: feedCity === "Istanbul" ? "İstanbul" : feedCity,
      feedCity,
      hasUserCoords: true,
    };
  }
  return {
    lat: DEFAULT_GOSSIP_LOCATION.lat,
    lng: DEFAULT_GOSSIP_LOCATION.lng,
    city: DEFAULT_GOSSIP_LOCATION.city,
    feedCity: DEFAULT_GOSSIP_LOCATION.feedCity,
    hasUserCoords: false,
  };
}

export function asPostId(id: string | number): number {
  if (typeof id === "number") return id;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || Date.now();
}

export function normalizeGossipId(id: string | number): string {
  return String(id);
}

export function parseLikeUsernames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .map((entry) => entry.trim());
}

export function parseReactionCounts(raw: unknown): PostReactions {
  if (!raw || typeof raw !== "object") return { ...EMPTY_REACTIONS };
  const record = raw as Record<string, unknown>;
  return {
    fire: Math.max(0, Number(record.fire) || 0),
    shock: Math.max(0, Number(record.shock) || 0),
    secret: Math.max(0, Number(record.secret) || 0),
  };
}

export function parseUserReactions(raw: unknown): Record<string, ReactionKey> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, ReactionKey> = {};
  for (const [username, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === "fire" || value === "shock" || value === "secret") {
      out[username] = value;
    }
  }
  return out;
}

export function formatGossipTimeLocalized(createdAt?: string, locale: SupportedLocale = "tr"): string {
  return formatGossipTime(createdAt, locale);
}
export function commentAuthorFromRow(row: CommentRow): string {
  return row.username?.trim() || row.author?.trim() || ANONYMOUS_GOSSIP_AUTHOR;
}

export function commentRowToComment(row: CommentRow): Comment {
  const author = commentAuthorFromRow(row);
  return {
    id: asPostId(row.id),
    author,
    text: row.content,
    avatar: avatarForAuthor(author),
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
  };
}
export function applyCommentsToPost(post: FeedPost, commentsMap: Map<string, Comment[]>): FeedPost {
  if (!post.gossipId) return post;
  const gossipId = normalizeGossipId(post.gossipId);
  return {
    ...post,
    commentItems: commentsMap.get(gossipId) ?? [],
  };
}
