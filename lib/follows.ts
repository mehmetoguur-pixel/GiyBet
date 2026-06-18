import { supabase } from "./supabase";

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function followUsername(followedUsername: string): Promise<string | null> {
  const followed = followedUsername.trim();
  if (!followed) return "invalid_username";

  const token = await getAuthToken();
  if (!token) return "unauthorized";

  const res = await fetch("/api/follows", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ followedUsername: followed }),
  });

  if (res.ok) return null;

  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? "failed";
}

export async function unfollowUsername(followedUsername: string): Promise<string | null> {
  const followed = followedUsername.trim();
  if (!followed) return "invalid_username";

  const token = await getAuthToken();
  if (!token) return "unauthorized";

  const res = await fetch(
    `/api/follows?followedUsername=${encodeURIComponent(followed)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (res.ok) return null;

  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? "failed";
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

export async function fetchFollowCountsByUsername(
  username: string,
): Promise<{ followers: number; following: number }> {
  const trimmed = username.trim();
  if (!trimmed) return { followers: 0, following: 0 };

  try {
    const res = await fetch(
      `/api/follows?username=${encodeURIComponent(trimmed)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return { followers: 0, following: 0 };
    const data = (await res.json()) as { followers?: number; following?: number };
    return {
      followers: data.followers ?? 0,
      following: data.following ?? 0,
    };
  } catch {
    return { followers: 0, following: 0 };
  }
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
