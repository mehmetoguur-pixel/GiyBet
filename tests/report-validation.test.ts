import { describe, expect, it } from "vitest";
import {
  isValidGossipId,
  isValidReportReason,
  isValidUsername,
  sanitizeText,
} from "@/lib/report-validation";

describe("report-validation", () => {
  it("validates report reasons", () => {
    expect(isValidReportReason("spam")).toBe(true);
    expect(isValidReportReason("invalid")).toBe(false);
  });

  it("validates gossip ids", () => {
    expect(isValidGossipId("abc-123_uuid")).toBe(true);
    expect(isValidGossipId("")).toBe(false);
    expect(isValidGossipId("bad id")).toBe(false);
  });

  it("validates usernames", () => {
    expect(isValidUsername("gece_yarasi_07")).toBe(true);
    expect(isValidUsername("bad name")).toBe(false);
  });

  it("sanitizes control characters", () => {
    expect(sanitizeText("hello\x00world", 100)).toBe("helloworld");
  });

  it("truncates and trims sanitized text", () => {
    expect(sanitizeText("  padded  ", 100)).toBe("padded");
    expect(sanitizeText("abcdefghij", 5)).toBe("abcde");
  });

  it("rejects overly long ids and usernames", () => {
    const longId = "a".repeat(129);
    const longUsername = "u".repeat(65);
    expect(isValidGossipId(longId)).toBe(false);
    expect(isValidUsername(longUsername)).toBe(false);
  });
});
