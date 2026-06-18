/**
 * Güvenlik env kontrolü — npm run check:security
 */
import { readFileSync } from "fs";

function loadEnvLocal() {
  try {
    const text = readFileSync(".env.local", "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* ignore */
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const adminEmails = process.env.ADMIN_EMAILS?.trim();

console.log("GıyBet güvenlik env kontrolü\n");

let ok = true;
const warn = [];

if (!url) {
  console.log("  FAIL: NEXT_PUBLIC_SUPABASE_URL eksik");
  ok = false;
} else {
  console.log("  OK: NEXT_PUBLIC_SUPABASE_URL");
}

if (!anon) {
  console.log("  FAIL: NEXT_PUBLIC_SUPABASE_ANON_KEY eksik");
  ok = false;
} else if (anon.startsWith("sb_secret_") || anon.includes("service_role")) {
  console.log("  FAIL: ANON_KEY yerine SECRET key kullanılmış — güvenlik riski!");
  ok = false;
} else {
  console.log("  OK: Publishable/anon key formatı");
}

if (!service) {
  console.log("  WARN: SUPABASE_SERVICE_ROLE_KEY eksik (moderasyon API çalışmaz)");
  warn.push("service_role");
} else if (service === anon) {
  console.log("  FAIL: SERVICE_ROLE_KEY ve ANON_KEY aynı — yanlış yapılandırma!");
  ok = false;
} else {
  console.log("  OK: SUPABASE_SERVICE_ROLE_KEY tanımlı");
}

if (!adminEmails) {
  console.log("  WARN: ADMIN_EMAILS eksik");
  warn.push("admin_emails");
} else {
  console.log(`  OK: ADMIN_EMAILS (${adminEmails.split(",").length} admin)`);
}

if (!process.env.RESEND_API_KEY?.trim()) {
  warn.push("resend_optional");
}

console.log(
  ok
    ? `\n✓ Temel güvenlik env OK.${warn.length ? ` Opsiyonel eksik: ${warn.join(", ")}` : ""}`
    : "\n✗ Kritik güvenlik env eksik veya hatalı.",
);

console.log("\nSupabase SQL sırası:");
console.log("  1. production_hardening.sql");
console.log("  2. moderation_admin.sql");
console.log("  3. security_hardening.sql");

process.exit(ok ? 0 : 1);
