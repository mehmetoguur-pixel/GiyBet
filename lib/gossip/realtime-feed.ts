import { parseGossipTags } from "@/lib/feed/tags";
import type { CommentRow, FeedPost, GossipRow, MapPin } from "@/lib/giybet/types";
import {
  asPostId,
  commentRowToComment,
  normalizeGossipId,
  parseGossipAvatar,
  parseLikeUsernames,
  parseReactionCounts,
  parseUserReactions,
  resolveGossipAuthor,
} from "./parsers";
import { gossipRowToFeedPost, gossipRowToMapPin } from "./transform";

export function gossipRowFromRealtime(payload: Record<string, unknown>): GossipRow | null {
  if (!payload.id) return null;
  return payload as GossipRow;
}

export function commentRowFromRealtime(payload: Record<string, unknown>): CommentRow | null {
  if (!payload.gossip_id) return null;
  return payload as CommentRow;
}

export function mergeGossipInsert(
  posts: FeedPost[],
  pins: MapPin[],
  row: GossipRow,
  nickname: string,
): { posts: FeedPost[]; pins: MapPin[]; added: boolean } {
  const gossipId = normalizeGossipId(row.id);
  if (row.deleted_at) return { posts, pins, added: false };
  if (posts.some((p) => normalizeGossipId(p.gossipId ?? "") === gossipId)) {
    return { posts, pins, added: false };
  }

  const post = gossipRowToFeedPost(row, nickname);
  const parsedAvatar = parseGossipAvatar(row.avatar);
  if (parsedAvatar) post.avatar = parsedAvatar;

  const author = resolveGossipAuthor(row);
  const avatar = parsedAvatar ?? post.avatar;
  const postId = asPostId(row.id);
  const pin = gossipRowToMapPin(row, postId, author, avatar);

  const pinExists = pins.some((p) => p.feedPostId === postId);
  return {
    posts: [post, ...posts],
    pins: pinExists ? pins : [pin, ...pins],
    added: true,
  };
}

export function mergeGossipUpdate(
  posts: FeedPost[],
  pins: MapPin[],
  row: GossipRow,
  nickname: string,
): { posts: FeedPost[]; pins: MapPin[] } {
  const gossipId = normalizeGossipId(row.id);
  const postId = asPostId(row.id);

  if (row.deleted_at) {
    return {
      posts: posts.filter((p) => normalizeGossipId(p.gossipId ?? "") !== gossipId),
      pins: pins.filter((p) => p.feedPostId !== postId),
    };
  }

  const hasLikers = row.like_usernames !== undefined && row.like_usernames !== null;
  const hasReactions = row.reaction_counts !== undefined && row.reaction_counts !== null;
  const hasUserReactions = row.user_reactions !== undefined && row.user_reactions !== null;
  const hasTags = row.tags !== undefined && row.tags !== null;

  if (!hasLikers && !hasReactions && !hasUserReactions && !hasTags && !row.room_id) {
    return { posts, pins };
  }

  const trimmed = nickname.trim();

  const nextPosts = posts.map((post) => {
    if (normalizeGossipId(post.gossipId ?? "") !== gossipId) return post;

    const likers = hasLikers ? parseLikeUsernames(row.like_usernames) : post.likers;
    const userReactionsMap = hasUserReactions
      ? parseUserReactions(row.user_reactions)
      : (post.userReactionsMap ?? {});
    const reactions = hasReactions ? parseReactionCounts(row.reaction_counts) : post.reactions;
    const tags = hasTags ? parseGossipTags(row) : post.tags;

    return {
      ...post,
      ...(hasLikers
        ? { likers, liked: trimmed ? likers.includes(trimmed) : post.liked }
        : {}),
      ...(hasReactions ? { reactions } : {}),
      ...(hasUserReactions
        ? {
            userReactionsMap,
            userReaction: trimmed ? userReactionsMap[trimmed] ?? null : post.userReaction,
          }
        : {}),
      ...(hasTags ? { tags } : {}),
      ...(row.room_id ? { roomId: row.room_id } : {}),
    };
  });

  return { posts: nextPosts, pins };
}

/** Sunucudan gelen feed ile mevcut UI durumunu birleştir (mesafe, yorumlar) */
export function mergeServerPostsIntoFeed(existing: FeedPost[], server: FeedPost[]): FeedPost[] {
  const byGossip = new Map(
    existing.map((p) => [normalizeGossipId(p.gossipId ?? ""), p]),
  );
  return server.map((serverPost) => {
    const prev = byGossip.get(normalizeGossipId(serverPost.gossipId ?? ""));
    if (!prev) return serverPost;
    const comments =
      prev.commentItems.length >= serverPost.commentItems.length
        ? prev.commentItems
        : serverPost.commentItems;
    return {
      ...serverPost,
      distanceMeters: prev.distanceMeters ?? serverPost.distanceMeters,
      commentItems: comments,
    };
  });
}

export function mergeCommentInsert(posts: FeedPost[], row: CommentRow): FeedPost[] {
  const gossipId = normalizeGossipId(row.gossip_id);
  const newComment = commentRowToComment(row);

  return posts.map((post) => {
    if (normalizeGossipId(post.gossipId ?? "") !== gossipId) return post;
    if (post.commentItems.some((c) => c.id === newComment.id)) return post;
    return { ...post, commentItems: [...post.commentItems, newComment] };
  });
}
