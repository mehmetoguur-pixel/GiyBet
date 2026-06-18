import type { NextRequest } from "next/server";
import { createClient, type User } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/supabase-admin";

export async function getSessionUser(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const client = createClient(url, anon);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  return token?.trim() || null;
}

/** RLS ile kullanıcı oturumuna bağlı istemci (service_role yoksa yedek). */
export function createUserSupabaseClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !token) return null;

  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getRequestSupabaseClient(request: NextRequest) {
  const admin = getAdminClient();
  if (admin) return admin;

  const token = getBearerToken(request);
  if (!token) return null;
  return createUserSupabaseClient(token);
}
