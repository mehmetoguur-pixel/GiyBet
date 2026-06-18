import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/api-rate-limit";
import { getAdminClient } from "@/lib/supabase-admin";

/** Hesabı ve içerikleri soft-delete — kullanıcı talebi */
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`account-delete:${user.id}`, 2, 3600_000);
  if (!rate.ok) {
    return NextResponse.json({ error: "rate_limit" }, { status: 429 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 503 });
  }

  const deletedAt = new Date().toISOString();

  await admin.from("gossips").update({ deleted_at: deletedAt }).eq("user_id", user.id);
  await admin.from("user_bans").delete().eq("user_id", user.id);
  await admin.from("device_tokens").delete().eq("user_id", user.id);

  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
