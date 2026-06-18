import type { SupabaseClient } from "@supabase/supabase-js";

type RateResult = { ok: boolean; retryAfterSec?: number };

/** Sunucu/API route koruması — Supabase tabanlı (serverless uyumlu) */
export async function checkDbRateLimit(
  admin: SupabaseClient,
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateResult> {
  const now = Date.now();
  const resetAt = new Date(now + windowMs).toISOString();

  const { data: existing, error: readError } = await admin
    .from("api_rate_limit_buckets")
    .select("count, reset_at")
    .eq("key", key)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (!existing) {
    const { error } = await admin.from("api_rate_limit_buckets").insert({
      key,
      count: 1,
      reset_at: resetAt,
    });
    if (error) throw error;
    return { ok: true };
  }

  const row = existing as { count: number; reset_at: string };
  const resetMs = Date.parse(row.reset_at);

  if (Number.isNaN(resetMs) || resetMs <= now) {
    const { error } = await admin
      .from("api_rate_limit_buckets")
      .update({ count: 1, reset_at: resetAt })
      .eq("key", key);
    if (error) throw error;
    return { ok: true };
  }

  if (row.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((resetMs - now) / 1000) };
  }

  const { error } = await admin
    .from("api_rate_limit_buckets")
    .update({ count: row.count + 1 })
    .eq("key", key);

  if (error) throw error;
  return { ok: true };
}
