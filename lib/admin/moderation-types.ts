import { supabase } from "@/lib/supabase";

export type ReportRow = {
  id: string;
  reporter_username: string;
  gossip_id: string;
  reported_username: string | null;
  reason: string;
  status: string;
  created_at: string;
  gossip_content: string | null;
  gossip_author: string | null;
  gossip_deleted: boolean;
  gossip_created_at: string | null;
  gossip_city: string | null;
  gossip_district: string | null;
  gossip_venue: string | null;
  gossip_location: string | null;
  gossip_image_url: string | null;
  gossip_tags: string[] | null;
  gossip_like_count: number;
  gossip_user_id: string | null;
  report_count: number;
  admin_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  author_banned: boolean;
};

export type BanRow = {
  id: string;
  user_id: string;
  username: string;
  reason: string | null;
  banned_by_email: string | null;
  created_at: string;
};

export type TimelinePoint = { date: string; count: number };

export type Stats = {
  open: number;
  reviewed: number;
  dismissed: number;
  total: number;
  banned?: number;
};

export type StatusFilter = "open" | "all" | "reviewed" | "dismissed";
export type ReasonFilter = "all" | "spam" | "harassment" | "inappropriate" | "other";
export type ViewTab = "reports" | "banned";

export const REASON_FILTERS: ReasonFilter[] = ["all", "spam", "harassment", "inappropriate", "other"];

export async function getAdminAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function reasonIcon(reason: string): string {
  switch (reason) {
    case "spam":
      return "🗑️";
    case "harassment":
      return "⚠️";
    case "inappropriate":
      return "🚫";
    default:
      return "❓";
  }
}
