import {
  createTranslator,
  DEFAULT_LOCALE,
  detectDeviceLocale,
  getNominatimLanguage,
  getPlacesLanguage,
  getTomTomLanguage,
  LOCALE_STORAGE_KEY,
  resolveStoredLocale,
  type SupportedLocale,
} from "./index";

function readClientLocale(): SupportedLocale {
  return resolveStoredLocale() ?? detectDeviceLocale();
}

export function subscribeLocale(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function getLocaleSnapshot(): SupportedLocale {
  return readClientLocale();
}

export function getServerLocaleSnapshot(): SupportedLocale {
  return DEFAULT_LOCALE;
}

export function persistLocale(locale: SupportedLocale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function buildI18nValue(
  locale: SupportedLocale,
  setLocale: (locale: SupportedLocale) => void,
) {
  const t = createTranslator(locale);
  return {
    locale,
    setLocale,
    t,
    nominatimLanguage: getNominatimLanguage(locale),
    tomTomLanguage: getTomTomLanguage(locale),
    placesLanguage: getPlacesLanguage(locale),
  };
}
