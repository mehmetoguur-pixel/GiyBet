export type Step = 1 | 2 | 3;
export type Gender = "kadin" | "erkek";

export type AvatarCreatorConfig = {
  gender: Gender;
  maleHair: string;
  femaleHair: string;
  skinColor: string;
  topColor: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  facialHair: string;
  accessories: string;
};

export type FaceStudioTab = "skin" | "hair" | "eyes" | "expression";

export type MapPin = {
  id: number;
  feedPostId: number;
  lat: number;
  lng: number;
  location: string;
  author: string;
  text: string;
  avatar: AvatarCreatorConfig;
  isUserPin?: boolean;
  venue?: string;
  city?: City;
  cityLabel?: string;
  isHot?: boolean;
  roomId?: string;
  /** ISO — haritada yalnızca son 24 saat */
  createdAt?: string;
};

export type City = "Istanbul" | "Ankara";

export type GeoCoords = { lat: number; lng: number };

export type NearbyVenue = {
  name: string;
  lat: number;
  lng: number;
  distanceMeters: number;
};

export type VenuePoint = {
  name: string;
  lat: number;
  lng: number;
  city: City;
};
export type ShareLocationFields = {
  district: string;
  venue?: string;
  city: City;
  cityLabel: string;
  locationLabel: string;
};
export type ReactionKey = "fire" | "shock" | "secret";

export type PostReactions = {
  fire: number;
  shock: number;
  secret: number;
};

export type VenueChatMessage = {
  id: number;
  author: string;
  text: string;
  avatar: AvatarCreatorConfig;
};

export type Comment = {
  id: number;
  author: string;
  text: string;
  avatar?: AvatarCreatorConfig;
  imageUrl?: string;
};
export type GiybetRank = {
  emoji: string;
  title: string;
  badgeClass: string;
  panelClass: string;
};
export type FeedPost = {
  id: number;
  gossipId?: string;
  author: string;
  text: string;
  liked: boolean;
  likers: string[];
  commentItems: Comment[];
  reactions: PostReactions;
  userReaction: ReactionKey | null;
  userReactionsMap?: Record<string, ReactionKey>;
  time: string;
  avatar: AvatarCreatorConfig;
  city: City;
  district?: string;
  tags: string[];
  venue?: string;
  lat?: number;
  lng?: number;
  cityLabel?: string;
  locationLabel?: string;
  imageUrl?: string;
  distanceMeters?: number;
  isHot?: boolean;
  roomId?: string;
  ownerUserId?: string;
};

export type ShareCheckIn = {
  text: string;
  city?: City;
  district?: string;
  cityLabel?: string;
  locationLabel?: string;
  tags?: string[];
  venue?: string;
  lat?: number;
  lng?: number;
  distanceMeters?: number;
  roomId?: string | null;
  createRoom?: boolean;
  roomName?: string;
  placeId?: string;
  imageFile?: File;
  imageUrl?: string;
};

export type ShareSuccessResult = {
  room: MapRoom | null;
  lat: number;
  lng: number;
  venue?: string;
  chatGossipId: string;
  chatLabel: string;
};

export type RoomRow = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  place_id?: string | null;
  gossip_id?: string | null;
  created_at?: string;
};

export type MapRoom = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: City;
  placeId?: string;
};

export type MapShareTarget = {
  lat: number;
  lng: number;
  roomId?: string | null;
  placeId?: string;
  placeName?: string;
};

export type MapBounds = {
  north: number;
  east: number;
  south: number;
  west: number;
};

export type GossipRow = {
  id: string | number;
  content: string;
  city: string;
  lat: number | null;
  lng: number | null;
  room_id?: string | null;
  created_at?: string;
  username?: string | null;
  author?: string | null;
  avatar?: unknown;
  user_id?: string | null;
  like_usernames?: unknown;
  reaction_counts?: unknown;
  user_reactions?: unknown;
  image_url?: string | null;
  location_label?: string | null;
  district?: string | null;
  venue_name?: string | null;
  tags?: string[] | null;
  deleted_at?: string | null;
};
export type CommentRow = {
  id: string;
  gossip_id: string;
  username?: string | null;
  author?: string | null;
  content: string;
  image_url?: string | null;
  created_at?: string;
};
export type RegisteredUser = {
  userId: string;
  contact: string;
  nickname: string;
  avatar: AvatarCreatorConfig;
};
export type BellNotification = {
  id: string;
  gossipId: string;
  message: string;
  label?: string;
};

export type RoomMessageRow = {
  id: string;
  gossip_id?: string | null;
  room_id?: string | null;
  author?: string | null;
  username?: string | null;
  content?: string | null;
  message?: string | null;
  created_at?: string;
};
export type GossipChatMessageRow = {
  id: string;
  gossip_id: string;
  author: string;
  content: string;
  created_at?: string;
};
export type FeedViewTab = "feed" | "following" | "map";
