import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** @deprecated Use createSupabaseAdmin — kept for API routes */
export const getAdminClient = createSupabaseAdmin;

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const list = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? [];
  return list.includes(email.trim().toLowerCase());
}
