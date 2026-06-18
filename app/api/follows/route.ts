import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-auth";
import { checkRateLimitAsync } from "@/lib/api-rate-limit";
import { getAdminClient } from "@/lib/supabase-admin";
import { isNotificationMutedForUser } from "@/lib/notification-preferences";
import { isValidUsername } from "@/lib/report-validation";

function nicknameFromUser(user: { user_metadata?: Record<string, unknown> }): string {
  const meta = user.user_metadata ?? {};
  const nickname =
    (typeof meta.nickname === "string" && meta.nickname.trim()) ||
    (typeof meta.giybet_name === "string" && meta.giybet_name.trim()) ||
    "";
  return nickname;
}

function followGossipId(userId: string): string {
  return `follow-${userId}`;
}

/** Takip et — service_role insert, bildirim gönder */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rate = await checkRateLimitAsync(`follow:${user.id}`, 30, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate_limit", retryAfterSec: rate.retryAfterSec },
      { status: 429 },
    );
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 503 });
  }

  let body: { followedUsername?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const followedUsername =
    typeof body.followedUsername === "string" ? body.followedUsername.trim() : "";
  if (!isValidUsername(followedUsername)) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  const followerNickname = nicknameFromUser(user);
  if (!followerNickname || !isValidUsername(followerNickname)) {
    return NextResponse.json({ error: "invalid_profile" }, { status: 400 });
  }
  if (followedUsername === followerNickname) {
    return NextResponse.json({ error: "self_follow_forbidden" }, { status: 400 });
  }

  const { data: blockRow } = await admin
    .from("user_blocks")
    .select("id")
    .eq("blocker_user_id", user.id)
    .eq("blocked_username", followedUsername)
    .maybeSingle();

  if (blockRow) {
    return NextResponse.json({ error: "blocked_user" }, { status: 400 });
  }

  const { error } = await admin.from("user_follows").insert({
    follower_user_id: user.id,
    follower_username: followerNickname,
    followed_username: followedUsername,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "already_following" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const message = `${followerNickname} seni takip etmeye başladı`;
  const muted = await isNotificationMutedForUser(followedUsername, "follow");
  if (!muted) {
    await admin.from("notifications").insert({
      recipient_username: followedUsername,
      actor_username: followerNickname,
      gossip_id: followGossipId(user.id),
      type: "follow",
      message,
    });
  }

  return NextResponse.json({ ok: true });
}

/** Takibi bırak */
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 503 });
  }

  const followedUsername = request.nextUrl.searchParams.get("followedUsername")?.trim() ?? "";
  if (!isValidUsername(followedUsername)) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  const { error } = await admin
    .from("user_follows")
    .delete()
    .eq("follower_user_id", user.id)
    .eq("followed_username", followedUsername);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
