import { formatLocationLabel, randomPostDistance } from "@/lib/feed/format";
import { parseGossipTags } from "@/lib/feed/tags";
import type { SupportedLocale } from "@/lib/i18n";
import type { AvatarCreatorConfig, City, FeedPost, GossipRow, MapPin } from "@/lib/giybet/types";
import { DEFAULT_GOSSIP_LOCATION } from "./constants";
import {
  asPostId,
  formatGossipTimeLocalized,
  normalizeGossipId,
  parseLikeUsernames,
  parseReactionCounts,
  parseUserReactions,
  resolveGossipAuthor,
  resolveGossipAvatar,
} from "./parsers";

export function gossipRowToFeedPost(
  row: GossipRow,
  currentUsername = "",
  locale: SupportedLocale = "tr",
): FeedPost {
  const author = resolveGossipAuthor(row);
  const avatar = resolveGossipAvatar(row, author);
  const lat = row.lat ?? DEFAULT_GOSSIP_LOCATION.lat;
  const lng = row.lng ?? DEFAULT_GOSSIP_LOCATION.lng;
  const feedCity: City =
    row.city === "İstanbul" || row.city === "Istanbul"
      ? "Istanbul"
      : row.city === "Ankara"
        ? "Ankara"
        : DEFAULT_GOSSIP_LOCATION.feedCity;

  const likers = parseLikeUsernames(row.like_usernames);
  const userReactionsMap = parseUserReactions(row.user_reactions);
  const reactions = parseReactionCounts(row.reaction_counts);
  const trimmedUser = currentUsername.trim();

  const district = row.district?.trim() || undefined;
  const cityLabel = row.city?.trim() || undefined;
  const storedLabel = row.location_label?.trim();
  const locationLabel =
    storedLabel ||
    (cityLabel && district
      ? formatLocationLabel({ city: feedCity, cityLabel, district }) ?? undefined
      : undefined);

  return {
    id: asPostId(row.id),
    gossipId: normalizeGossipId(row.id),
    author,
    text: row.content,
    liked: trimmedUser ? likers.includes(trimmedUser) : false,
    likers,
    commentItems: [],
    reactions,
    userReaction: trimmedUser ? userReactionsMap[trimmedUser] ?? null : null,
    userReactionsMap,
    time: formatGossipTimeLocalized(row.created_at, locale),
    avatar,
    city: feedCity,
    cityLabel: row.city?.trim() || undefined,
    tags: parseGossipTags(row),
    distanceMeters: randomPostDistance(),
    lat,
    lng,
    ...(locationLabel ? { locationLabel } : {}),
    ...(district ? { district } : {}),
    ...(row.venue_name?.trim() ? { venue: row.venue_name.trim() } : {}),
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    ...(row.room_id ? { roomId: row.room_id } : {}),
    ...(row.user_id ? { ownerUserId: row.user_id } : {}),
  };
}
export function gossipRowToMapPin(
  row: GossipRow,
  postId: number,
  author: string,
  avatar: AvatarCreatorConfig,
): MapPin {
  const lat = row.lat ?? DEFAULT_GOSSIP_LOCATION.lat;
  const lng = row.lng ?? DEFAULT_GOSSIP_LOCATION.lng;
  const feedCity: City =
    row.city === "İstanbul" || row.city === "Istanbul"
      ? "Istanbul"
      : row.city === "Ankara"
        ? "Ankara"
        : DEFAULT_GOSSIP_LOCATION.feedCity;

  return {
    id: postId,
    feedPostId: postId,
    lat,
    lng,
    location: `${row.city || DEFAULT_GOSSIP_LOCATION.city} · Gıybet`,
    author,
    text: row.content,
    avatar,
    city: feedCity,
    cityLabel: row.city?.trim() || undefined,
    ...(row.created_at ? { createdAt: row.created_at } : {}),
    ...(row.room_id ? { roomId: row.room_id } : {}),
  };
}
