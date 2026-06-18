import { describe, expect, it } from "vitest";
import { GOSSIP_RATE_LIMIT, isRateLimitError } from "@/lib/rate-limit";

describe("rate-limit", () => {
  it("detects rate limit errors", () => {
    expect(isRateLimitError("rate_limit_minute")).toBe(true);
    expect(isRateLimitError("rate_limit_hour")).toBe(true);
    expect(isRateLimitError("other")).toBe(false);
  });

  it("defines client cooldown", () => {
    expect(GOSSIP_RATE_LIMIT.perMinute).toBe(3);
    expect(GOSSIP_RATE_LIMIT.clientCooldownMs).toBeGreaterThan(0);
  });
});
