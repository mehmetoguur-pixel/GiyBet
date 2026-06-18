import type { City, PostReactions } from "@/lib/giybet/types";

export const GOSSIP_IMAGE_BUCKET = "gossip-images";
export const ANONYMOUS_GOSSIP_AUTHOR = "Anonim";
export const DEFAULT_GOSSIP_LOCATION = {
  lat: 41.0082,
  lng: 28.9784,
  city: "İstanbul",
  feedCity: "Istanbul" as City,
};
export const EMPTY_REACTIONS: PostReactions = { fire: 0, shock: 0, secret: 0 };
export const GOSSIP_CHAT_TABLE = "gossip_chat_messages";
export const MAX_VENUE_ROOMS = 5;
export const NOTIFICATION_LIST_LIMIT = 10;
export const GOSSIP_FEED_LIMIT = 80;
/** Sayfa başına yüklenen gönderi */
export const GOSSIP_PAGE_SIZE = 30;
