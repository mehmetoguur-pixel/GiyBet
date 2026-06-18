/**
 * Mevcut gıybetlere eksik yorumları ekler (seed yarıda kesildiyse).
 * node scripts/backfill-turkey-comments.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  const text = readFileSync(join(root, ".env.local"), "utf8");
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
}

loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const COMMENT_AUTHORS = ["yorumcu_42", "mahalle_kusu", "sessiz_izleyici", "dedikodu_fan"];
const COMMENT_LINES = [
  "Burada da aynısı konuşuluyor 😂",
  "Detay verir misin?",
  "Kimse yüzüne söylemiyor ama herkes biliyor.",
  "Az önce kuaförde de aynısını duydum!",
];

async function ensureAuth() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  if (email && password) {
    await supabase.auth.signInWithPassword({ email, password });
    return;
  }
  const tempEmail = `giybet-seed-${Date.now()}@giybet.local`;
  const { data, error } = await supabase.auth.signUp({
    email: tempEmail,
    password: "GiybetSeed2026!",
  });
  if (error || !data.session) throw new Error("Giriş gerekli — SEED_EMAIL/SEED_PASSWORD veya SQL seed kullanın.");
}

async function main() {
  await ensureAuth();

  const { data: gossips, error: gErr } = await supabase.from("gossips").select("id").order("created_at", { ascending: true });
  if (gErr) throw gErr;

  const { data: comments, error: cErr } = await supabase.from("comments").select("gossip_id");
  if (cErr) throw cErr;

  const countByGossip = new Map();
  for (const c of comments ?? []) {
    const gid = String(c.gossip_id);
    countByGossip.set(gid, (countByGossip.get(gid) ?? 0) + 1);
  }

  let added = 0;
  for (const g of gossips ?? []) {
    const gid = String(g.id);
    const have = countByGossip.get(gid) ?? 0;
    if (have >= 2) continue;
    for (let j = have; j < 2; j++) {
      const author = COMMENT_AUTHORS[j % COMMENT_AUTHORS.length];
      const { error } = await supabase.from("comments").insert({
        gossip_id: gid,
        username: author,
        author,
        content: COMMENT_LINES[j % COMMENT_LINES.length],
      });
      if (error) console.error(gid, error.message);
      else added++;
    }
  }
  console.log(`Yorum eklendi: ${added}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
