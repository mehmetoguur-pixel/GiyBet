import { supabase } from "./supabase";

export async function followUsername(
  followerUserId: string,
  followerUsername: string,
  followedUsername: string,
): Promise<string | null> {
  const followed = followedUsername.trim();
  const follower = followerUsername.trim();
  if (!followed || !follower || followed === follower) return "self_follow_forbidden";

  const { error } = await supabase.from("user_follows").insert([
    {
      follower_user_id: followerUserId,
      follower_username: follower,
      followed_username: followed,
    },
  ]);
  return error?.message ?? null;
}

export async function unfollowUsername(
  followerUserId: string,
  followedUsername: string,
): Promise<string | null> {
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_user_id", followerUserId)
    .eq("followed_username", followedUsername.trim());
  return error?.message ?? null;
}

export async function fetchFollowingUsernames(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_follows")
    .select("followed_username")
    .eq("follower_user_id", userId);
  if (error || !data) return [];
  return data
    .map((row) => (row as { followed_username: string }).followed_username?.trim())
    .filter(Boolean);
}

export async function fetchFollowCounts(
  nickname: string,
  userId: string,
): Promise<{ followers: number; following: number }> {
  const trimmed = nickname.trim();
  if (!userId || !trimmed) return { followers: 0, following: 0 };

  const [followingRes, followersRes] = await Promise.all([
    supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_user_id", userId),
    supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("followed_username", trimmed),
  ]);

  return {
    following: followingRes.count ?? 0,
    followers: followersRes.count ?? 0,
  };
}
