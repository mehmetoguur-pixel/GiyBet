import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, getAdminClient, getAdminSessionEmail } from "@/lib/admin-api";
import { REPORT_LIMITS, sanitizeText } from "@/lib/report-validation";

export async function GET(request: NextRequest) {
  const email = await getAdminSessionEmail(request);
  if (!assertAdmin(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 503 });
  }

  const status = request.nextUrl.searchParams.get("status") ?? "pending";
  const { data, error } = await admin
    .from("ban_appeals")
    .select("id, user_id, username, message, status, admin_note, created_at, resolved_at")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appeals: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const email = await getAdminSessionEmail(request);
  if (!assertAdmin(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 503 });
  }

  let body: { id?: string; status?: string; adminNote?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const id = body.id?.trim();
  const status = body.status?.trim();
  if (!id || !status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const adminNote = sanitizeText(body.adminNote ?? "", REPORT_LIMITS.maxAdminNoteLength);

  const { data: appeal, error: fetchError } = await admin
    .from("ban_appeals")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !appeal) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { error: updateError } = await admin
    .from("ban_appeals")
    .update({
      status,
      admin_note: adminNote || null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (status === "approved") {
    await admin.from("user_bans").delete().eq("user_id", appeal.user_id);
  }

  return NextResponse.json({ ok: true });
}
