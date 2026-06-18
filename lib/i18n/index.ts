import { ar } from "./locales/ar";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { tr, type Messages } from "./locales/tr";

export type SupportedLocale = "tr" | "en" | "de" | "ar";

export const LOCALE_STORAGE_KEY = "giybet_locale";
export const SUPPORTED_LOCALES: SupportedLocale[] = ["tr", "en", "de", "ar"];
export const DEFAULT_LOCALE: SupportedLocale = "en";

const messages: Record<SupportedLocale, Messages> = { tr, en, de, ar };

export function getMessages(locale: SupportedLocale): Messages {
  return messages[locale];
}

export function detectDeviceLocale(): SupportedLocale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const lang = navigator.language?.toLowerCase() ?? "";
  if (lang.startsWith("tr")) return "tr";
  if (lang.startsWith("de")) return "de";
  if (lang.startsWith("ar")) return "ar";
  return "en";
}

export function resolveStoredLocale(): SupportedLocale | null {
  if (typeof localStorage === "undefined") return null;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (
    stored === "tr" ||
    stored === "en" ||
    stored === "de" ||
    stored === "ar"
  ) {
    return stored;
  }
  return null;
}

export function getNominatimLanguage(locale: SupportedLocale): string {
  switch (locale) {
    case "tr":
      return "tr";
    case "de":
      return "de";
    case "ar":
      return "ar";
    default:
      return "en";
  }
}

export function getTomTomLanguage(locale: SupportedLocale): string {
  switch (locale) {
    case "tr":
      return "tr-TR";
    case "de":
      return "de-DE";
    case "ar":
      return "ar-SA";
    default:
      return "en-US";
  }
}

export function getPlacesLanguage(locale: SupportedLocale): string {
  return getNominatimLanguage(locale);
}

type InterpolationVars = Record<string, string | number>;

export type Translator = ReturnType<typeof createTranslator>;

export function getLocalizedString(key: string, vars?: InterpolationVars): string {
  const locale = resolveStoredLocale() ?? detectDeviceLocale();
  return createTranslator(locale)(key, vars);
}

export function createTranslator(locale: SupportedLocale) {
  const dict = getMessages(locale);

  return function t(key: string, vars?: InterpolationVars): string {
    const parts = key.split(".");
    let value: unknown = dict;
    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }
    if (typeof value !== "string") return key;
    if (!vars) return value;
    return value.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
      String(vars[name] ?? ""),
    );
  };
}

export function formatGossipTime(
  createdAt?: string,
  locale: SupportedLocale = "en",
): string {
  const t = createTranslator(locale);
  if (!createdAt) return t("time.justNow");
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return t("time.justNow");
  if (mins < 60) return t("time.minutesAgo", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("time.hoursAgo", { n: hours });
  return t("time.daysAgo", { n: Math.floor(hours / 24) });
}
