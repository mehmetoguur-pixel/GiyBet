import type { PlaceDetail } from "@/lib/places-api";
import type {
  AvatarCreatorConfig,
  FeedPost,
  MapPin,
  MapRoom,
  ReactionKey,
  ShareCheckIn,
  ShareSuccessResult,
} from "@/lib/giybet/types";

export const FEED_INPUT_CLASS =
  "w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all focus:border-purple-500/60 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.15)]";

export type GiybetFeedProps = {
  userId: string;
  nickname: string;
  avatar: AvatarCreatorConfig;
  posts: FeedPost[];
  mapPins: MapPin[];
  rooms: MapRoom[];
  onShare: (payload: ShareCheckIn) => Promise<ShareSuccessResult | void>;
  onCreateRoomAtPlace: (place: PlaceDetail) => Promise<MapRoom | null>;
  onToggleLike: (postId: number) => void;
  onToggleReaction: (postId: number, reaction: ReactionKey) => void;
  onAddComment: (postId: number, text: string) => void;
  onDeleteGossip: (postId: number) => void;
  onSaveAvatar: (avatar: AvatarCreatorConfig) => void;
  onLogout: () => void;
  btnPrimary: string;
  btnSecondary: string;
};
