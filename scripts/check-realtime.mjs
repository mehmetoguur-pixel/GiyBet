/**
 * Realtime + tablo kontrolü — npm run check:realtime
 * .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve ANON_KEY gerekli
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("FAIL: NEXT_PUBLIC_SUPABASE_URL veya ANON_KEY .env.local içinde yok.");
  process.exit(1);
}

const supabase = createClient(url, anon);

async function checkTable(name) {
  const { error } = await supabase.from(name).select("*", { count: "exact", head: true });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "ok" };
}

function waitForChannelStatus(label, channel, timeoutMs = 10000) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok, status) => {
      if (done) return;
      done = true;
      supabase.removeChannel(channel);
      resolve({ ok, status: `${label}: ${status}` });
    };

    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") finish(true, status);
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        finish(false, err?.message ? `${status} (${err.message})` : status);
      }
    });

    setTimeout(() => finish(false, "timeout"), timeoutMs);
  });
}

async function main() {
  console.log("GıyBet Supabase kontrolü\n");

  const tables = ["gossip_chat_messages", "notifications", "gossips", "content_reports", "user_blocks", "user_bans"];
  for (const table of tables) {
    const r = await checkTable(table);
    console.log(`  Tablo ${table}: ${r.ok ? "OK" : "HATA — " + r.message}`);
  }

  console.log("\nRealtime abonelik testi (10 sn)...");

  const chatChannel = supabase
    .channel("check-gossip-chat")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "gossip_chat_messages" },
      () => {},
    );

  const notifChannel = supabase
    .channel("check-notifications")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications" },
      () => {},
    );

  const chat = await waitForChannelStatus("gossip_chat_messages", chatChannel);
  const notif = await waitForChannelStatus("notifications", notifChannel);

  console.log(`  ${chat.status}`);
  console.log(`  ${notif.status}`);

  const allOk = chat.ok && notif.ok;
  console.log(allOk ? "\n✓ Realtime görünüşe göre çalışıyor." : "\n✗ Realtime tam bağlanmadı — Replication toggle’larını kontrol et.");
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
