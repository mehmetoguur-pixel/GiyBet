/** Haritada gösterilecek gıybet pinlerinin max yaşı */
export const MAP_PIN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function isMapPinWithinWindow(createdAt?: string | null, nowMs = Date.now()): boolean {
  if (!createdAt) return false;
  const ms = Date.parse(createdAt);
  if (Number.isNaN(ms)) return false;
  return nowMs - ms < MAP_PIN_MAX_AGE_MS;
}

export function filterFreshMapPins<T extends { createdAt?: string | null }>(
  pins: T[],
  nowMs = Date.now(),
): T[] {
  return pins.filter((pin) => isMapPinWithinWindow(pin.createdAt, nowMs));
}
