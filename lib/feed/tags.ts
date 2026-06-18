import type { FeedPost, GossipRow } from "@/lib/giybet/types";

export const HASHTAG_PATTERN = /#([a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+)/g;

export function normalizeTagKey(tag: string): string {
  return tag.trim().replace(/^#+/, "").toLowerCase();
}

export function formatTag(tag: string): string {
  const body = tag.trim().replace(/^#+/, "");
  return body ? `#${body}` : "";
}

export function extractHashtags(text: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const match of text.matchAll(HASHTAG_PATTERN)) {
    const formatted = formatTag(match[1]);
    const key = normalizeTagKey(formatted);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    tags.push(formatted);
  }
  return tags;
}

export function mergeTags(...sources: (string[] | undefined)[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const list of sources) {
    if (!list) continue;
    for (const raw of list) {
      const formatted = formatTag(raw);
      const key = normalizeTagKey(formatted);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(formatted);
    }
  }
  return merged;
}

export function parseGossipTags(row: GossipRow): string[] {
  const raw = row.tags;
  if (Array.isArray(raw) && raw.length > 0) {
    return mergeTags(raw as string[]);
  }
  return extractHashtags(row.content);
}

export function postHasTag(post: FeedPost, filterTag: string): boolean {
  const key = normalizeTagKey(filterTag);
  return post.tags.some((tag) => normalizeTagKey(tag) === key);
}

export function computeTrendingTags(posts: FeedPost[], limit = 5): { tag: string; count: number }[] {
  const counts = new Map<string, { tag: string; count: number }>();
  for (const post of posts) {
    for (const tag of post.tags) {
      const key = normalizeTagKey(tag);
      if (!key) continue;
      const formatted = formatTag(tag);
      const entry = counts.get(key);
      if (entry) entry.count += 1;
      else counts.set(key, { tag: formatted, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}
