import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, getAdminClient, getAdminSessionEmail } from "@/lib/admin-api";
import { REPORT_LIMITS, sanitizeText } from "@/lib/report-validation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type BanRow = {
  id: string;
  user_id: string;
  username: string;
  reason: string | null;
  banned_by_email: string | null;
  created_at: string;
};

export async function GET(request: NextRequest) {
  const email = await getAdminSessionEmail(request);
  if (!assertAdmin(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("user_bans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bans: (data ?? []) as BanRow[] });
}

export async function POST(request: NextRequest) {
  const email = await getAdminSessionEmail(request);
  if (!assertAdmin(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const body = (await request.json()) as {
    userId?: string;
    username?: string;
    reason?: string;
  };

  const userId = body.userId?.trim();
  const username = sanitizeText(body.username ?? "", REPORT_LIMITS.maxUsernameLength);
  if (!userId || !UUID_RE.test(userId) || !username) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { data: targetUser } = await admin.auth.admin.getUserById(userId);
  if (!targetUser.user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  if (targetUser.user.email && email && targetUser.user.email.toLowerCase() === email.toLowerCase()) {
    return NextResponse.json({ error: "cannot_ban_self" }, { status: 400 });
  }

  const { error } = await admin.from("user_bans").upsert(
    {
      user_id: userId,
      username,
      reason: sanitizeText(body.reason ?? "", 200) || null,
      banned_by_email: email,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const email = await getAdminSessionEmail(request);
  if (!assertAdmin(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const userId = request.nextUrl.searchParams.get("userId")?.trim();
  if (!userId || !UUID_RE.test(userId)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { error } = await admin.from("user_bans").delete().eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
