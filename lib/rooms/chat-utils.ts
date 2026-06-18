import { getLocalizedString } from "@/lib/i18n";
import type { FeedPost } from "@/lib/giybet/types";
import { normalizeGossipId } from "@/lib/gossip/parsers";

export function gossipChatLabel(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return getLocalizedString("chat.defaultLabel");
  return trimmed.length > 36 ? `${trimmed.slice(0, 36)}…` : trimmed;
}

export function resolvePostGossipKey(post: FeedPost): string | null {
  if (post.gossipId) return normalizeGossipId(post.gossipId);
  return null;
}
