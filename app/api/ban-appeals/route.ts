import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync } from "@/lib/api-rate-limit";
import { getAdminClient } from "@/lib/supabase-admin";
import { isValidUsername, REPORT_LIMITS, sanitizeText } from "@/lib/report-validation";

/** Ban itirazı — oturum gerekmez (ban sonrası çıkış yapılmış olabilir) */
export async function POST(request: NextRequest) {
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 503 });
  }

  let body: { username?: string; message?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const username = sanitizeText(body.username ?? "", REPORT_LIMITS.maxUsernameLength);
  const message = sanitizeText(body.message ?? "", 2000);

  if (!isValidUsername(username)) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "message_too_short" }, { status: 400 });
  }

  const rate = await checkRateLimitAsync(`ban-appeal:${username}`, 2, 3600_000);
  if (!rate.ok) {
    return NextResponse.json({ error: "rate_limit" }, { status: 429 });
  }

  const { data: ban } = await admin
    .from("user_bans")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();

  if (!ban?.user_id) {
    return NextResponse.json({ error: "not_banned" }, { status: 400 });
  }

  const userId = ban.user_id as string;

  const { data: pending } = await admin
    .from("ban_appeals")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (pending) {
    return NextResponse.json({ error: "already_pending" }, { status: 409 });
  }

  const { error } = await admin.from("ban_appeals").insert({
    user_id: userId,
    username,
    message,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
