import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/api-rate-limit";
import { notifyAdminNewReport } from "@/lib/admin-notify";
import { getAdminClient } from "@/lib/supabase-admin";
import {
  isValidGossipId,
  isValidReportReason,
  isValidUsername,
  REPORT_LIMITS,
  sanitizeText,
} from "@/lib/report-validation";

function nicknameFromUser(user: { user_metadata?: Record<string, unknown> }): string {
  const meta = user.user_metadata ?? {};
  const nickname =
    (typeof meta.nickname === "string" && meta.nickname.trim()) ||
    (typeof meta.giybet_name === "string" && meta.giybet_name.trim()) ||
    "";
  return nickname;
}

/** Kullanıcı şikayeti — service_role insert, client doğrudan insert yapamaz */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`report:${user.id}`, 5, 60_000);
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

  let body: {
    gossipId?: string;
    reportedUsername?: string;
    reason?: string;
    gossipPreview?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const gossipId = sanitizeText(body.gossipId ?? "", REPORT_LIMITS.maxGossipIdLength);
  const reasonRaw = sanitizeText(body.reason ?? "other", 32);
  const reason = isValidReportReason(reasonRaw) ? reasonRaw : "other";
  const gossipPreview = sanitizeText(body.gossipPreview ?? "", REPORT_LIMITS.maxPreviewLength);

  if (!isValidGossipId(gossipId)) {
    return NextResponse.json({ error: "invalid_gossip_id" }, { status: 400 });
  }

  const { data: gossip, error: gossipError } = await admin
    .from("gossips")
    .select("id, username, user_id, deleted_at, content")
    .eq("id", gossipId)
    .maybeSingle();

  if (gossipError) {
    return NextResponse.json({ error: gossipError.message }, { status: 500 });
  }

  if (!gossip || gossip.deleted_at) {
    return NextResponse.json({ error: "gossip_not_found" }, { status: 404 });
  }

  const gossipAuthor = String(gossip.username ?? "").trim();
  const reportedUsername = sanitizeText(
    body.reportedUsername?.trim() || gossipAuthor,
    REPORT_LIMITS.maxUsernameLength,
  );

  if (!isValidUsername(reportedUsername)) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  if (gossip.user_id && gossip.user_id === user.id) {
    return NextResponse.json({ error: "self_report_forbidden" }, { status: 400 });
  }

  const reporterUsername = sanitizeText(nicknameFromUser(user) || "user", REPORT_LIMITS.maxUsernameLength);
  if (!isValidUsername(reporterUsername)) {
    return NextResponse.json({ error: "invalid_reporter_profile" }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("content_reports")
    .select("id")
    .eq("reporter_user_id", user.id)
    .eq("gossip_id", gossipId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "already_reported" }, { status: 409 });
  }

  const { error: insertError } = await admin.from("content_reports").insert([
    {
      reporter_user_id: user.id,
      reporter_username: reporterUsername,
      gossip_id: gossipId,
      reported_username: reportedUsername,
      reason,
    },
  ]);

  if (insertError) {
    if (insertError.message.includes("report_rate_limit_hour")) {
      return NextResponse.json({ error: "report_rate_limit_hour" }, { status: 429 });
    }
    if (insertError.message.includes("content_reports_reporter_gossip_unique")) {
      return NextResponse.json({ error: "already_reported" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await notifyAdminNewReport({
    reporterUsername,
    reportedUsername,
    reason,
    gossipId,
    gossipPreview: gossipPreview || String(gossip.content ?? "").slice(0, 200),
  });

  return NextResponse.json({ ok: true });
}
