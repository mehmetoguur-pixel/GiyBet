import { supabase } from "./supabase";

export type NotificationPrefType = "like" | "comment" | "reaction" | "follow";

export type NotificationPreferences = {
  muteLike: boolean;
  muteComment: boolean;
  muteReaction: boolean;
  muteFollow: boolean;
};

const DEFAULT_PREFS: NotificationPreferences = {
  muteLike: false,
  muteComment: false,
  muteReaction: false,
  muteFollow: false,
};

export async function fetchNotificationPreferences(username: string): Promise<NotificationPreferences> {
  const trimmed = username.trim();
  if (!trimmed) return DEFAULT_PREFS;

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("mute_like, mute_comment, mute_reaction, mute_follow")
    .eq("username", trimmed)
    .maybeSingle();

  if (error || !data) return DEFAULT_PREFS;

  const row = data as {
    mute_like?: boolean;
    mute_comment?: boolean;
    mute_reaction?: boolean;
    mute_follow?: boolean;
  };

  return {
    muteLike: row.mute_like ?? false,
    muteComment: row.mute_comment ?? false,
    muteReaction: row.mute_reaction ?? false,
    muteFollow: row.mute_follow ?? false,
  };
}

export async function saveNotificationPreferences(
  username: string,
  prefs: NotificationPreferences,
): Promise<string | null> {
  const trimmed = username.trim();
  if (!trimmed) return "invalid_username";

  const { error } = await supabase.from("notification_preferences").upsert(
    {
      username: trimmed,
      mute_like: prefs.muteLike,
      mute_comment: prefs.muteComment,
      mute_reaction: prefs.muteReaction,
      mute_follow: prefs.muteFollow,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "username" },
  );

  return error?.message ?? null;
}

export function isTypeMuted(prefs: NotificationPreferences, type: NotificationPrefType): boolean {
  if (type === "like") return prefs.muteLike;
  if (type === "comment") return prefs.muteComment;
  if (type === "reaction") return prefs.muteReaction;
  return prefs.muteFollow;
}

export async function isNotificationMutedForUser(
  username: string,
  type: NotificationPrefType,
): Promise<boolean> {
  const prefs = await fetchNotificationPreferences(username);
  return isTypeMuted(prefs, type);
}
