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

  const trimmed = nickname.trim();
  const likers = parseLikeUsernames(row.like_usernames);
  const userReactionsMap = parseUserReactions(row.user_reactions);
  const reactions = parseReactionCounts(row.reaction_counts);
  const tags = parseGossipTags(row);

  const nextPosts = posts.map((post) => {
    if (normalizeGossipId(post.gossipId ?? "") !== gossipId) return post;
    return {
      ...post,
      likers,
      liked: trimmed ? likers.includes(trimmed) : post.liked,
      reactions,
      userReaction: trimmed ? userReactionsMap[trimmed] ?? null : post.userReaction,
      userReactionsMap,
      tags,
      ...(row.room_id ? { roomId: row.room_id } : {}),
    };
  });

  return { posts: nextPosts, pins };
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
