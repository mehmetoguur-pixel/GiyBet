import { registerDeviceToken } from "./moderation";

/** Push bildirim altyapısı — web için foundation; native plugin ileride eklenebilir. */
export async function initPushNotifications(userId: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (!("Notification" in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const token = `web:${userId}:${navigator.userAgent.slice(0, 40)}`;
    await registerDeviceToken(userId, token, "web");
  } catch {
    /* push opsiyonel */
  }
}
