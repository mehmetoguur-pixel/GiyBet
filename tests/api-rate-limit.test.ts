import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/api-rate-limit";

describe("api-rate-limit", () => {
  it("allows requests within the limit", () => {
    const key = `test-allow-${Date.now()}`;
    expect(checkRateLimit(key, 3, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).ok).toBe(true);
  });

  it("blocks when the window is exhausted", () => {
    const key = `test-block-${Date.now()}`;
    for (let i = 0; i < 2; i += 1) {
      expect(checkRateLimit(key, 2, 60_000).ok).toBe(true);
    }
    const blocked = checkRateLimit(key, 2, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
});
