import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdmin, isAdminEmail } from "@/lib/supabase-admin";

export async function getAdminSessionEmail(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const client = createClient(url, anon);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

export function assertAdmin(email: string | null): boolean {
  return isAdminEmail(email);
}

export function getAdminClient() {
  return createSupabaseAdmin();
}
