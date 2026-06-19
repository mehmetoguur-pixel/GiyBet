/** Capacitor native shell — yalnızca APK içinde çalışır */
import { PRODUCTION_APP_URL } from "./constants";

export { PRODUCTION_APP_URL };

export async function isNativeApp(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { Capacitor } = await import("@capacitor/core");
  return Capacitor.isNativePlatform();
}

export async function initCapacitorApp(): Promise<void> {
  if (typeof window === "undefined") return;
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;

  const { StatusBar, Style } = await import("@capacitor/status-bar");
  const { SplashScreen } = await import("@capacitor/splash-screen");

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#08080f" });
  } catch {
    /* status bar plugin optional on some devices */
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* splash already hidden */
  }
}
