import { supabase } from "./supabase";
import { GOSSIP_RATE_LIMIT, isRateLimitError } from "./rate-limit";

export type ReportReason = "spam" | "harassment" | "inappropriate" | "other";

export { GOSSIP_RATE_LIMIT, isRateLimitError };

export async function blockUsername(
  blockerUserId: string,
  blockerUsername: string,
  blockedUsername: string,
): Promise<string | null> {
  const blocked = blockedUsername.trim();
  if (!blocked) return "invalid_username";
  const { error } = await supabase.from("user_blocks").insert([
    {
      blocker_user_id: blockerUserId,
      blocker_username: blockerUsername.trim(),
      blocked_username: blocked,
    },
  ]);
  return error?.message ?? null;
}

export async function unblockUsername(
  blockerUserId: string,
  blockedUsername: string,
): Promise<string | null> {
  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_user_id", blockerUserId)
    .eq("blocked_username", blockedUsername.trim());
  return error?.message ?? null;
}

export async function fetchBlockedUsernames(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_username")
    .eq("blocker_user_id", userId);
  if (error || !data) return [];
  return data
    .map((row) => (row as { blocked_username: string }).blocked_username?.trim())
    .filter(Boolean);
}

export async function deleteOwnGossip(gossipId: string): Promise<string | null> {
  const { error: rpcError } = await supabase.rpc("delete_own_gossip", {
    p_gossip_id: gossipId,
  });
  if (!rpcError) return null;

  if (
    rpcError.message.includes("not_found") ||
    rpcError.message.includes("Could not find the function")
  ) {
    const { error } = await supabase.from("gossips").delete().eq("id", gossipId);
    return error?.message ?? null;
  }
  return rpcError.message;
}

export async function fetchBanStatus(userId: string): Promise<{ banned: boolean; reason?: string }> {
  const { data, error } = await supabase
    .from("user_bans")
    .select("reason")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return { banned: false };
  const reason = (data as { reason?: string | null }).reason;
  return { banned: true, reason: reason ?? undefined };
}

export async function registerDeviceToken(
  userId: string,
  token: string,
  platform = "web",
): Promise<string | null> {
  const { error } = await supabase.from("device_tokens").upsert(
    { user_id: userId, token, platform },
    { onConflict: "user_id,token" },
  );
  return error?.message ?? null;
}
