/**
 * Production deploy öncesi tam kontrol — npm run check:deploy
 */
import { spawnSync } from "child_process";
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

function runNode(scriptPath) {
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: "inherit",
    env: process.env,
  });
  return result.status === 0;
}

console.log("═══════════════════════════════════════════");
console.log("  GıyBet — Production Deploy Kontrolü");
console.log("═══════════════════════════════════════════\n");

const steps = [
  { label: "Güvenlik env", script: "scripts/check-security.mjs" },
  { label: "Moderasyon env", script: "scripts/check-moderation.mjs" },
  { label: "Supabase schema", script: "scripts/check-supabase-schema.mjs" },
  { label: "Realtime", script: "scripts/check-realtime.mjs" },
];

let allOk = true;
for (const step of steps) {
  console.log(`\n── ${step.label} ──\n`);
  const stepOk = runNode(step.script);
  if (!stepOk) allOk = false;
}

console.log("\n═══════════════════════════════════════════");
if (allOk) {
  console.log("✓ Tüm kontroller geçti.\n");
  console.log("Vercel deploy adımları:");
  console.log("  1. github.com → repo push (veya Vercel CLI)");
  console.log("  2. vercel.com → New Project → bu repo");
  console.log("  3. Environment Variables → env.example dosyasındaki zorunlu değerleri ekle");
  console.log("     (Production + Preview için aynı Supabase anahtarları)");
  console.log("  4. Deploy → build başarılı olmalı (lint/test CI'da zaten koşuyor)");
  console.log("  5. Deploy sonrası: admin hesabıyla giriş → /admin/moderation test");
  console.log("\nCLI ile:");
  console.log("  npx vercel login");
  console.log("  npx vercel --prod");
} else {
  console.log("✗ Bazı kontroller başarısız — yukarıdaki FAIL satırlarını düzelt, sonra tekrar:");
  console.log("  npm run check:deploy");
}
console.log("═══════════════════════════════════════════\n");

process.exit(allOk ? 0 : 1);
