import type { Translator } from "@/lib/i18n";
import type { AvatarCreatorConfig } from "@/lib/giybet/types";

export function localizedOpt(t: Translator, group: string, id: string, fallback: string): string {
  const key = `avatarStudio.opt.${group}.${id}`;
  const val = t(key);
  return val === key ? fallback : val;
}

export const DEFAULT_AVATAR: AvatarCreatorConfig = {
  gender: "kadin",
  maleHair: "shortHair",
  femaleHair: "longHair",
  skinColor: "edb98a",
  topColor: "brown",
  eyes: "happy",
  eyebrows: "default",
  mouth: "smile",
  facialHair: "none",
  accessories: "none",
};

export const SKIN_COLOR_OPTIONS = [
  { id: "614335", label: "Koyu" },
  { id: "ae5d29", label: "Bronz" },
  { id: "d08b5b", label: "Buğday" },
  { id: "edb98a", label: "Açık" },
  { id: "ffdbb4", label: "Soluk" },
];

export const MALE_HAIR_OPTIONS = [
  { id: "shortHair", label: "Kısa" },
  { id: "theCaesar", label: "Klasik" },
  { id: "shortFlat", label: "Düz" },
  { id: "shortCurly", label: "Kıvırcık" },
  { id: "frizzle", label: "Dağınık" },
  { id: "shaggy", label: "Dağınık Uzun" },
  { id: "sides", label: "Yan Kesim" },
  { id: "dreads", label: "Rasta" },
];

export const FEMALE_HAIR_OPTIONS = [
  { id: "longHair", label: "Uzun" },
  { id: "bob", label: "Küt" },
  { id: "bun", label: "Topuz" },
  { id: "curly", label: "Kıvırcık" },
  { id: "curvy", label: "Dalgalı" },
  { id: "frida", label: "Frida" },
  { id: "fro", label: "Afro" },
  { id: "hijab", label: "Başörtüsü" },
];

export const VALID_MALE_HAIR = new Set(MALE_HAIR_OPTIONS.map((o) => o.id));
export const VALID_FEMALE_HAIR = new Set(FEMALE_HAIR_OPTIONS.map((o) => o.id));

export const TOP_COLOR_OPTIONS = [
  { id: "black", label: "Siyah", hex: "2c1b18" },
  { id: "blonde", label: "Sarı", hex: "d6b370" },
  { id: "brown", label: "Kahve", hex: "724133" },
  { id: "red", label: "Kızıl", hex: "c93305" },
  { id: "pastelPink", label: "Pembe", hex: "f59797" },
];

export const EYES_OPTIONS = [
  { id: "default", label: "Normal" },
  { id: "happy", label: "Mutlu" },
  { id: "wink", label: "Göz Kırpan" },
  { id: "side", label: "Yan Bakış" },
  { id: "hearts", label: "Flörtöz" },
  { id: "surprised", label: "Şaşkın" },
  { id: "close", label: "Kapalı" },
  { id: "cry", label: "Üzgün" },
];

export const EYEBROWS_OPTIONS = [
  { id: "default", label: "Doğal" },
  { id: "angry", label: "Öfkeli" },
  { id: "up", label: "Kalkık" },
  { id: "flat", label: "Düz" },
  { id: "raisedExcited", label: "Yay Biçimli" },
  { id: "sadConcerned", label: "Düşünceli" },
];

export const MOUTH_OPTIONS = [
  { id: "smile", label: "Gülümseme" },
  { id: "serious", label: "Ciddi" },
  { id: "open", label: "Açık" },
  { id: "twinkle", label: "Muzip" },
  { id: "grimace", label: "Grimace" },
  { id: "tongue", label: "Dil Çıkarma" },
  { id: "eating", label: "Sırıtma" },
];

export const FACIAL_HAIR_OPTIONS = [
  { id: "none", label: "Yok" },
  { id: "beardMedium", label: "Orta Sakal" },
  { id: "beardLight", label: "Hafif Sakal" },
  { id: "moustacheMagnum", label: "Bıyık" },
];

export const ACCESSORIES_OPTIONS = [
  { id: "none", label: "Gözlük Yok" },
  { id: "rxGlasses", label: "Optik Gözlük" },
  { id: "sunglasses", label: "Güneş Gözlüğü" },
  { id: "kurt", label: "Kurt Gözlük" },
  { id: "round", label: "Yuvarlak Gözlük" },
];

/** UI saç id → DiceBear avataaars top enum */
export const HAIR_API_MAP: Record<string, string> = {
  shortHair: "shortFlat",
  theCaesar: "theCaesar",
  shortFlat: "straight01",
  shortCurly: "shortCurly",
  frizzle: "frizzle",
  shaggy: "shaggy",
  sides: "sides",
  dreads: "dreads01",
  longHair: "longButNotTooLong",
  bob: "bob",
  bun: "bun",
  curly: "curly",
  curvy: "curvy",
  frida: "frida",
  fro: "fro",
  hijab: "hijab",
};

export const TOP_COLOR_HEX: Record<string, string> = Object.fromEntries(
  TOP_COLOR_OPTIONS.map((o) => [o.id, o.hex]),
);

export const EYEBROWS_API_MAP: Record<string, string> = {
  default: "default",
  angry: "angry",
  up: "upDown",
  flat: "flatNatural",
  raisedExcited: "raisedExcited",
  sadConcerned: "sadConcerned",
};

export const EYES_API_MAP: Record<string, string> = {
  close: "closed",
};

export const MOUTH_API_MAP: Record<string, string> = {
  open: "default",
};

export const ACCESSORIES_API_MAP: Record<string, string> = {
  rxGlasses: "prescription02",
  sunglasses: "sunglasses",
  kurt: "kurt",
  round: "round",
};

export const SAMPLE_AVATARS: AvatarCreatorConfig[] = [
  {
    gender: "kadin",
    maleHair: "shortHair",
    femaleHair: "longHair",
    skinColor: "d08b5b",
    topColor: "brown",
    eyes: "happy",
    eyebrows: "default",
    mouth: "smile",
    facialHair: "none",
    accessories: "none",
  },
  {
    gender: "kadin",
    maleHair: "shortHair",
    femaleHair: "curly",
    skinColor: "ffdbb4",
    topColor: "black",
    eyes: "hearts",
    eyebrows: "raisedExcited",
    mouth: "twinkle",
    facialHair: "none",
    accessories: "round",
  },
  {
    gender: "erkek",
    maleHair: "shortFlat",
    femaleHair: "longHair",
    skinColor: "ae5d29",
    topColor: "black",
    eyes: "default",
    eyebrows: "angry",
    mouth: "serious",
    facialHair: "beardLight",
    accessories: "sunglasses",
  },
];
