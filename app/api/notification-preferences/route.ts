import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/supabase-admin";
import { isValidUsername } from "@/lib/report-validation";
import {
  fetchNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notification-preferences";

function nicknameFromUser(user: { user_metadata?: Record<string, unknown> }): string {
  const meta = user.user_metadata ?? {};
  return (
    (typeof meta.nickname === "string" && meta.nickname.trim()) ||
    (typeof meta.giybet_name === "string" && meta.giybet_name.trim()) ||
    ""
  );
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const nickname = nicknameFromUser(user);
  if (!isValidUsername(nickname)) {
    return NextResponse.json({ error: "invalid_profile" }, { status: 400 });
  }

  const prefs = await fetchNotificationPreferences(nickname);
  return NextResponse.json({
    muteLike: prefs.muteLike,
    muteComment: prefs.muteComment,
    muteReaction: prefs.muteReaction,
    muteFollow: prefs.muteFollow,
  });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const nickname = nicknameFromUser(user);
  if (!isValidUsername(nickname)) {
    return NextResponse.json({ error: "invalid_profile" }, { status: 400 });
  }

  let body: Partial<NotificationPreferences>;
  try {
    body = (await request.json()) as Partial<NotificationPreferences>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const current = await fetchNotificationPreferences(nickname);
  const merged: NotificationPreferences = {
    muteLike: body.muteLike ?? current.muteLike,
    muteComment: body.muteComment ?? current.muteComment,
    muteReaction: body.muteReaction ?? current.muteReaction,
    muteFollow: body.muteFollow ?? current.muteFollow,
  };

  const err = await saveNotificationPreferences(nickname, merged);
  if (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
