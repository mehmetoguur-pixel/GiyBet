import type { AvatarCreatorConfig, Gender } from "@/lib/giybet/types";
import {
  ACCESSORIES_API_MAP,
  DEFAULT_AVATAR,
  EYEBROWS_API_MAP,
  EYES_API_MAP,
  HAIR_API_MAP,
  MOUTH_API_MAP,
  TOP_COLOR_HEX,
  VALID_FEMALE_HAIR,
  VALID_MALE_HAIR,
} from "./constants";

export function resolveTop(config: AvatarCreatorConfig): string {
  const hairId = config.gender === "erkek" ? config.maleHair : config.femaleHair;
  return HAIR_API_MAP[hairId] ?? hairId;
}

/** DiceBear geçersiz "none" değerlerini göndermez; hairColor ile renk uygulanır */
export function buildAvatarSrc(config: AvatarCreatorConfig): string {
  const { skinColor, topColor, eyes, eyebrows, mouth, facialHair, accessories, gender } = config;

  const top = resolveTop(config);
  const hairColor = TOP_COLOR_HEX[topColor] ?? topColor;
  const apiEyes = EYES_API_MAP[eyes] ?? eyes;
  const apiEyebrows = EYEBROWS_API_MAP[eyebrows] ?? eyebrows;
  const apiMouth = MOUTH_API_MAP[mouth] ?? mouth;
  const effectiveFacialHair = gender === "kadin" ? "none" : facialHair;

  let url = `https://api.dicebear.com/7.x/avataaars/svg?skinColor=${skinColor}&top=${top}&topColor=${topColor}&eyes=${apiEyes}&eyebrows=${apiEyebrows}&mouth=${apiMouth}&hairColor=${hairColor}&backgroundColor=12121a&clothing=hoodie&clothesColor=262e33`;

  if (effectiveFacialHair !== "none") {
    url += `&facialHair=${effectiveFacialHair}&facialHairProbability=100`;
  } else {
    url += "&facialHairProbability=0";
  }

  if (accessories !== "none") {
    url += `&accessories=${ACCESSORIES_API_MAP[accessories]}&accessoriesProbability=100`;
  } else {
    url += "&accessoriesProbability=0";
  }

  return url;
}

export function normalizeAvatar(
  raw: Partial<AvatarCreatorConfig> & { top?: string },
): AvatarCreatorConfig {
  const gender: Gender = raw.gender === "erkek" ? "erkek" : "kadin";

  let maleHair = raw.maleHair;
  let femaleHair = raw.femaleHair;

  if (raw.top && !maleHair && !femaleHair) {
    if (VALID_MALE_HAIR.has(raw.top) || HAIR_API_MAP[raw.top]) {
      maleHair = Object.entries(HAIR_API_MAP).find(([, v]) => v === raw.top)?.[0] ?? raw.top;
    }
    if (VALID_FEMALE_HAIR.has(raw.top) || HAIR_API_MAP[raw.top]) {
      femaleHair = Object.entries(HAIR_API_MAP).find(([, v]) => v === raw.top)?.[0] ?? raw.top;
    }
    if (gender === "erkek" && !maleHair) maleHair = "shortHair";
    if (gender === "kadin" && !femaleHair) femaleHair = "longHair";
  }

  const safeMale = maleHair && VALID_MALE_HAIR.has(maleHair) ? maleHair : "shortHair";
  const safeFemale = femaleHair && VALID_FEMALE_HAIR.has(femaleHair) ? femaleHair : "longHair";

  return {
    ...DEFAULT_AVATAR,
    ...raw,
    gender,
    maleHair: safeMale,
    femaleHair: safeFemale,
    facialHair: gender === "kadin" ? "none" : (raw.facialHair ?? "none"),
  };
}
