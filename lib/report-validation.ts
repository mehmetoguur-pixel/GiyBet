import type { ReportReason } from "./moderation";

export const REPORT_REASONS: ReportReason[] = ["spam", "harassment", "inappropriate", "other"];

export const REPORT_LIMITS = {
  maxGossipIdLength: 128,
  maxUsernameLength: 64,
  maxPreviewLength: 500,
  maxAdminNoteLength: 2000,
} as const;

export function isValidReportReason(reason: string): reason is ReportReason {
  return REPORT_REASONS.includes(reason as ReportReason);
}

export function sanitizeText(input: string, maxLen: number): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLen);
}

export function isValidGossipId(id: string): boolean {
  if (!id || id.length > REPORT_LIMITS.maxGossipIdLength) return false;
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

export function isValidUsername(username: string): boolean {
  if (!username || username.length > REPORT_LIMITS.maxUsernameLength) return false;
  // Gıybet adı kurallarıyla uyumlu (Türkçe harfler dahil)
  return /^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ.-]+$/.test(username);
}
