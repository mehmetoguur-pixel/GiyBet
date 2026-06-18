/** Web bildirim izni — tarayıcı Notification API (device_tokens kaydı opsiyonel, ileride native). */
export async function initPushNotifications(_userId: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (!("Notification" in window)) return;
    await Notification.requestPermission();
  } catch {
    /* push opsiyonel */
  }
}
