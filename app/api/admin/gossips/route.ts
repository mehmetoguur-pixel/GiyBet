import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, getAdminClient, getAdminSessionEmail } from "@/lib/admin-api";
import { isValidGossipId } from "@/lib/report-validation";

/** Admin: gıybeti soft-delete (deleted_at) — yalnızca tek gossip id */
export async function POST(request: NextRequest) {
  const email = await getAdminSessionEmail(request);
  if (!assertAdmin(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const body = (await request.json()) as { gossipId?: string };
  const gossipId = body.gossipId?.trim();
  if (!gossipId || !isValidGossipId(gossipId)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const deletedAt = new Date().toISOString();

  const { data, error } = await admin
    .from("gossips")
    .update({ deleted_at: deletedAt })
    .eq("id", gossipId)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data?.length) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

/** Admin: gıybeti geri yükle (deleted_at temizle) */
export async function PATCH(request: NextRequest) {
  const email = await getAdminSessionEmail(request);
  if (!assertAdmin(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const body = (await request.json()) as { gossipId?: string };
  const gossipId = body.gossipId?.trim();
  if (!gossipId || !isValidGossipId(gossipId)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("gossips")
    .update({ deleted_at: null })
    .eq("id", gossipId)
    .not("deleted_at", "is", null)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data?.length) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
