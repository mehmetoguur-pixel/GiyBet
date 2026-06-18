import { checkDbRateLimit } from "@/lib/db-rate-limit";
import { getAdminClient } from "@/lib/supabase-admin";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Bellek içi rate limit — yedek */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true };
}

/** Önce Supabase tablosu, hata olursa bellek içi */
export async function checkRateLimitAsync(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfterSec?: number }> {
  const admin = getAdminClient();
  if (admin) {
    try {
      return await checkDbRateLimit(admin, key, limit, windowMs);
    } catch {
      /* tablo yoksa veya hata — bellek içi */
    }
  }
  return checkRateLimit(key, limit, windowMs);
}
