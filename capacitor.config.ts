import type { CapacitorConfig } from "@capacitor/cli";
import { readFileSync } from "fs";
import { PRODUCTION_APP_URL } from "./lib/capacitor/constants";

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

/**
 * APK, uygulamanın web sürümünü native kabuk içinde açar.
 * Üretim için CAPACITOR_SERVER_URL = canlı site (ör. Vercel) adresi olmalı.
 * Yerel test: http://10.0.2.2:3000 (emülatör) veya bilgisayar IP:3000 (fiziksel cihaz)
 */
const serverUrl = (process.env.CAPACITOR_SERVER_URL?.trim() || PRODUCTION_APP_URL).replace(/\/$/, "");

const config: CapacitorConfig = {
  appId: "com.giybet.app",
  appName: "GıyBet",
  webDir: "public",
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#08080f",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#08080f",
    },
  },
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    androidScheme: "https",
  },
};

export default config;
