/**
 * APK derleme öncesi: Capacitor sync + URL doğrulama
 * npm run android:prepare
 */
import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { PRODUCTION_APP_URL } from "./lib/app-url.mjs";

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
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* ignore */
  }
}

loadEnvLocal();

const serverUrl = (process.env.CAPACITOR_SERVER_URL?.trim() || PRODUCTION_APP_URL).replace(
  /\/$/,
  "",
);

console.log("═══════════════════════════════════════════");
console.log("  GıyBet — Android APK hazırlık");
console.log("═══════════════════════════════════════════\n");
console.log(`APK hedef URL: ${serverUrl}`);
console.log("(Değiştirmek için .env.local → CAPACITOR_SERVER_URL)\n");

if (!serverUrl.startsWith("https://")) {
  console.warn("⚠ URL https değil — yalnızca yerel test için uygun.\n");
}

const sync = spawnSync("npx", ["cap", "sync", "android"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, CAPACITOR_SERVER_URL: serverUrl },
});

if (sync.status !== 0) {
  console.error("\n✗ cap sync başarısız.");
  process.exit(1);
}

console.log("\n✓ Sync tamam. Sonraki adımlar:");
console.log("  npm run android:apk     → GiyBet-v*-debug.apk (test / arkadaşlara)");
console.log("  npm run cap:android     → Android Studio aç");
console.log("  npm run cap:run:android → emülatörde çalıştır");
console.log("  APK yolu: android/app/build/outputs/apk/debug/GiyBet-v*-debug.apk\n");
