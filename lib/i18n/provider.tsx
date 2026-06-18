"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  buildI18nValue,
  getLocaleSnapshot,
  getServerLocaleSnapshot,
  persistLocale,
  subscribeLocale,
} from "./locale-store";
import type { SupportedLocale } from "./index";

type I18nContextValue = ReturnType<typeof buildI18nValue>;

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const storedLocale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );
  const [localeOverride, setLocaleOverride] = useState<SupportedLocale | null>(null);
  const locale = localeOverride ?? storedLocale;

  const setLocale = useCallback((next: SupportedLocale) => {
    persistLocale(next);
    setLocaleOverride(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => buildI18nValue(locale, setLocale),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
