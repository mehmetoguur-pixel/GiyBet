export const GOSSIP_RATE_LIMIT = {
  perMinute: 3,
  perHour: 30,
  clientCooldownMs: 8000,
} as const;

export function isRateLimitError(message: string): boolean {
  return message.includes("rate_limit");
}

export function isBanError(message: string): boolean {
  return message.includes("user_banned");
}
