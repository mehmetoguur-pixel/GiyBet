/**
 * Supabase moderasyon/güvenlik SQL doğrulama — npm run check:schema
 * production_hardening → moderation_admin → security_hardening sonrası çalıştır
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !anon) {
  console.error("FAIL: NEXT_PUBLIC_SUPABASE_URL veya ANON_KEY eksik (.env.local)");
  process.exit(1);
}

if (!service) {
  console.error("FAIL: SUPABASE_SERVICE_ROLE_KEY eksik — schema kontrolü için gerekli");
  process.exit(1);
}

const admin = createClient(url, service, { auth: { persistSession: false } });
const anonClient = createClient(url, anon, { auth: { persistSession: false } });

async function tableOk(name) {
  const { error } = await admin.from(name).select("*", { count: "exact", head: true });
  if (error) return { ok: false, detail: error.message };
  return { ok: true, detail: "ok" };
}

async function columnsOk(table, columns) {
  const { error } = await admin.from(table).select(columns.join(",")).limit(0);
  if (error) return { ok: false, detail: error.message };
  return { ok: true, detail: "ok" };
}

async function anonInsertBlocked() {
  const { error } = await anonClient.from("content_reports").insert([
    {
      reporter_user_id: "00000000-0000-0000-0000-000000000001",
      reporter_username: "schema_check",
      gossip_id: "schema-check-gossip",
      reported_username: "target",
      reason: "spam",
    },
  ]);
  if (!error) {
    return { ok: false, detail: "anon insert başarılı — security_hardening.sql çalıştırılmamış olabilir" };
  }
  const msg = error.message.toLowerCase();
  const blocked =
    msg.includes("row-level security") ||
    msg.includes("policy") ||
    msg.includes("permission") ||
    msg.includes("violates");
  return { ok: blocked, detail: error.message };
}

async function invalidReasonRejected() {
  const { data: gossip } = await admin.from("gossips").select("id").limit(1).maybeSingle();
  if (!gossip?.id) {
    return { ok: true, detail: "atlandı (gossip yok)" };
  }

  const { error } = await admin.from("content_reports").insert([
    {
      reporter_user_id: "00000000-0000-0000-0000-000000000002",
      reporter_username: "schema_check",
      gossip_id: String(gossip.id),
      reported_username: "target",
      reason: "not_a_valid_reason",
    },
  ]);

  if (!error) {
    return { ok: false, detail: "geçersiz reason kabul edildi — security_hardening.sql CHECK eksik" };
  }
  const msg = error.message.toLowerCase();
  const rejected = msg.includes("check") || msg.includes("constraint") || msg.includes("violates");
  return { ok: rejected, detail: error.message };
}

function logCheck(label, result) {
  const icon = result.ok ? "OK" : "FAIL";
  console.log(`  ${icon}: ${label}${result.detail && result.detail !== "ok" ? ` — ${result.detail}` : ""}`);
  return result.ok;
}

async function main() {
  console.log("GıyBet Supabase schema kontrolü\n");
  console.log("Beklenen SQL sırası:");
  console.log("  1. production_hardening.sql");
  console.log("  2. moderation_admin.sql");
  console.log("  3. security_hardening.sql\n");

  let ok = true;

  for (const table of ["gossips", "content_reports", "user_bans", "user_blocks", "notifications"]) {
    ok = logCheck(`tablo ${table}`, await tableOk(table)) && ok;
  }

  ok =
    logCheck(
      "content_reports admin sütunları (moderation_admin.sql)",
      await columnsOk("content_reports", ["admin_note", "reviewed_at", "reviewed_by"]),
    ) && ok;

  ok = logCheck("anon content_reports insert engeli (security_hardening.sql)", await anonInsertBlocked()) && ok;
  ok = logCheck("reason CHECK kısıtı (security_hardening.sql)", await invalidReasonRejected()) && ok;

  console.log(
    ok
      ? "\n✓ Schema kontrolleri geçti — production deploy için hazır görünüyor."
      : "\n✗ Eksik SQL adımları var. Yukarıdaki FAIL satırlarına göre Supabase SQL Editor'da scriptleri çalıştır.",
  );

  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
