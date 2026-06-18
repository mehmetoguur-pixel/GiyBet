/**
 * Türkiye 81 il × 4 gıybet + 2 yorum seed — Supabase REST API
 * Kullanım: node scripts/seed-turkey-gossips.mjs
 * Gerekli: .env.local içinde NEXT_PUBLIC_SUPABASE_URL + ANON_KEY
 * Opsiyonel: SEED_EMAIL + SEED_PASSWORD (yoksa geçici hesap denenir)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  try {
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
  } catch {
    /* ignore */
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY gerekli (.env.local)");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const CITIES = [
  ["Adana", 37.0, 35.3213],
  ["Adıyaman", 37.7648, 38.2786],
  ["Afyonkarahisar", 38.7638, 30.5403],
  ["Ağrı", 39.7191, 43.0503],
  ["Amasya", 40.6539, 35.8331],
  ["Ankara", 39.9334, 32.8597],
  ["Antalya", 36.8969, 30.7133],
  ["Artvin", 41.1828, 41.8183],
  ["Aydın", 37.8444, 27.8458],
  ["Balıkesir", 39.6484, 27.8826],
  ["Bilecik", 40.1426, 29.9793],
  ["Bingöl", 38.8853, 40.4983],
  ["Bitlis", 38.4006, 42.1095],
  ["Bolu", 40.735, 31.6061],
  ["Burdur", 37.7203, 30.2908],
  ["Bursa", 40.1826, 29.0669],
  ["Çanakkale", 40.1553, 26.4142],
  ["Çankırı", 40.6013, 33.6134],
  ["Çorum", 40.5506, 34.9556],
  ["Denizli", 37.7765, 29.0864],
  ["Diyarbakır", 37.9144, 40.2306],
  ["Edirne", 41.6771, 26.5557],
  ["Elazığ", 38.681, 39.2264],
  ["Erzincan", 39.75, 39.5],
  ["Erzurum", 39.9043, 41.2679],
  ["Eskişehir", 39.7767, 30.5206],
  ["Gaziantep", 37.0662, 37.3833],
  ["Giresun", 40.9128, 38.3895],
  ["Gümüşhane", 40.4603, 39.4814],
  ["Hakkari", 37.5744, 43.7408],
  ["Hatay", 36.4018, 36.3498],
  ["Isparta", 37.7648, 30.5566],
  ["Mersin", 36.8121, 34.6415],
  ["İstanbul", 41.0082, 28.9784],
  ["İzmir", 38.4237, 27.1428],
  ["Kars", 40.6013, 43.0975],
  ["Kastamonu", 41.3887, 33.7827],
  ["Kayseri", 38.7312, 35.4787],
  ["Kırklareli", 41.7333, 27.2167],
  ["Kırşehir", 39.1425, 34.1709],
  ["Kocaeli", 40.7654, 29.9408],
  ["Konya", 37.8746, 32.4932],
  ["Kütahya", 39.4242, 29.9833],
  ["Malatya", 38.3552, 38.3095],
  ["Manisa", 38.6191, 27.4289],
  ["Kahramanmaraş", 37.5858, 36.9371],
  ["Mardin", 37.3212, 40.7245],
  ["Muğla", 37.2153, 28.3636],
  ["Muş", 38.7432, 41.5065],
  ["Nevşehir", 38.6244, 34.7239],
  ["Niğde", 37.9667, 34.6833],
  ["Ordu", 40.9839, 37.8764],
  ["Rize", 41.0201, 40.5234],
  ["Sakarya", 40.7569, 30.3781],
  ["Samsun", 41.2867, 36.33],
  ["Siirt", 37.9333, 41.95],
  ["Sinop", 42.0269, 35.1551],
  ["Sivas", 39.7477, 37.0179],
  ["Tekirdağ", 40.9833, 27.5167],
  ["Tokat", 40.3167, 36.55],
  ["Trabzon", 41.0027, 39.7168],
  ["Tunceli", 39.1079, 39.5401],
  ["Şanlıurfa", 37.1591, 38.7969],
  ["Uşak", 38.6823, 29.4082],
  ["Van", 38.4891, 43.4089],
  ["Yozgat", 39.82, 34.8044],
  ["Zonguldak", 41.4564, 31.7987],
  ["Aksaray", 38.3687, 34.037],
  ["Bayburt", 40.2552, 40.2249],
  ["Karaman", 37.1759, 33.2287],
  ["Kırıkkale", 39.8468, 33.5153],
  ["Batman", 37.8812, 41.1351],
  ["Şırnak", 37.5164, 42.4611],
  ["Bartın", 41.6344, 32.3375],
  ["Ardahan", 41.1105, 42.7022],
  ["Iğdır", 39.9167, 44.0333],
  ["Yalova", 40.65, 29.2667],
  ["Karabük", 41.2061, 32.6204],
  ["Kilis", 36.7184, 37.1212],
  ["Osmaniye", 37.0742, 36.2478],
  ["Düzce", 40.8438, 31.1565],
];

const GOSSIP_SUFFIX = [
  "Bizim semtteki o olay hâlâ konuşuluyor...",
  "Kimse ses çıkarmıyor ama herkes biliyor 👀",
  "Dün akşam meydanda dolaşan söylenti şok edici.",
  "Okul/iş çıkışı kahvehanede patlayan gıybet viral oldu.",
];

const AUTHORS = [
  "gece_kusu",
  "dedikodu_kazani",
  "anonim_kedi",
  "gizli_motorcu",
  "latte_queen",
  "baskent_gizli",
  "ankara_kusu",
  "kuzey_ruh",
];

const COMMENT_AUTHORS = ["yorumcu_42", "mahalle_kusu", "sessiz_izleyici", "dedikodu_fan"];
const COMMENT_LINES = [
  "Burada da aynısı konuşuluyor 😂",
  "Detay verir misin?",
  "Kimse yüzüne söylemiyor ama herkes biliyor.",
  "Az önce kuaförde de aynısını duydum!",
];

function pick(arr, i) {
  return arr[i % arr.length];
}

function randAuthor() {
  return AUTHORS[Math.floor(Math.random() * AUTHORS.length)];
}

async function ensureAuth() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;

  if (email && password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Giriş hatası: ${error.message}`);
    console.log("Giriş OK:", email);
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    console.log("Mevcut oturum kullanılıyor.");
    return;
  }

  const tempEmail = `giybet-seed-${Date.now()}@giybet.local`;
  const tempPass = "GiybetSeed2026!";
  const { data, error } = await supabase.auth.signUp({
    email: tempEmail,
    password: tempPass,
  });
  if (error) throw new Error(`Kayıt hatası: ${error.message}`);
  if (!data.session) {
    throw new Error(
      "Oturum açılamadı (e-posta doğrulama açık olabilir). .env.local'e SEED_EMAIL ve SEED_PASSWORD ekleyin veya supabase/seed_turkey_gossips.sql dosyasını SQL Editor'da çalıştırın.",
    );
  }
  console.log("Geçici seed hesabı:", tempEmail);
}

async function insertGossip(row) {
  const { data, error } = await supabase.from("gossips").insert(row).select("id").single();
  if (error) throw error;
  return data.id;
}

async function insertComment(row) {
  const { error } = await supabase.from("comments").insert(row);
  if (error) throw error;
}

async function main() {
  await ensureAuth();

  const { data: existing } = await supabase.from("gossips").select("city");
  const cityCounts = new Map();
  for (const row of existing ?? []) {
    const c = row.city ?? "";
    cityCounts.set(c, (cityCounts.get(c) ?? 0) + 1);
  }

  let gossipCount = 0;
  let commentCount = 0;
  let skipped = 0;
  let errors = 0;

  for (const [city, baseLat, baseLng] of CITIES) {
    const already = cityCounts.get(city) ?? 0;
    if (already >= 4) {
      skipped++;
      continue;
    }
    const toAdd = 4 - already;
    for (let i = 0; i < toAdd; i++) {
      const author = randAuthor();
      const lat = baseLat + (Math.random() - 0.5) * 0.08;
      const lng = baseLng + (Math.random() - 0.5) * 0.08;
      const content = `${city} · ${GOSSIP_SUFFIX[i]}`;
      const reactions = ["fire", "shock", "secret"];
      const reactionKey = reactions[Math.floor(Math.random() * reactions.length)];

      try {
        const gossipId = await insertGossip({
          content,
          city,
          lat,
          lng,
          username: author,
          like_usernames: [author, "anonim_ruh"],
          reaction_counts: {
            fire: Math.floor(Math.random() * 4),
            shock: Math.floor(Math.random() * 3),
            secret: Math.floor(Math.random() * 2),
          },
          user_reactions: { [author]: reactionKey },
        });
        gossipCount++;

        for (let j = 0; j < 2; j++) {
          const commentAuthor = pick(COMMENT_AUTHORS, j);
          await insertComment({
            gossip_id: String(gossipId),
            username: commentAuthor,
            author: commentAuthor,
            content: pick(COMMENT_LINES, j),
          });
          commentCount++;
        }
      } catch (e) {
        errors++;
        console.error(`${city} #${i + 1}:`, e.message ?? e);
      }
    }
    process.stdout.write(`\r${city} … ${gossipCount} gıybet, ${commentCount} yorum`);
  }

  console.log(`\nBitti: ${gossipCount} gıybet, ${commentCount} yorum, ${skipped} il zaten dolu (${errors} hata)`);
  if (errors > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
