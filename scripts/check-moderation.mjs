/**
 * Moderasyon env kontrolü — npm run check:moderation
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

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const adminEmails = process.env.ADMIN_EMAILS?.trim();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

console.log("GıyBet moderasyon env kontrolü\n");

let ok = true;

if (!url) {
  console.log("  FAIL: NEXT_PUBLIC_SUPABASE_URL eksik");
  ok = false;
} else {
  console.log("  OK: NEXT_PUBLIC_SUPABASE_URL tanımlı");
}

if (!serviceKey) {
  console.log("  FAIL: SUPABASE_SERVICE_ROLE_KEY eksik (.env.local)");
  ok = false;
} else {
  console.log(`  OK: SUPABASE_SERVICE_ROLE_KEY tanımlı (${serviceKey.length} karakter)`);
}

if (!adminEmails) {
  console.log("  FAIL: ADMIN_EMAILS eksik (.env.local)");
  ok = false;
} else {
  const list = adminEmails.split(",").map((e) => e.trim()).filter(Boolean);
  console.log(`  OK: ADMIN_EMAILS → ${list.length} admin: ${list.join(", ")}`);
}

console.log(
  ok
    ? "\n✓ Moderasyon env hazır. npm run dev ile giriş yap → /admin/moderation"
    : "\n✗ Eksik değişkenleri .env.local dosyasına ekle ve npm run dev yeniden başlat.",
);

process.exit(ok ? 0 : 1);
