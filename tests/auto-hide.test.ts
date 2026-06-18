import { describe, expect, it } from "vitest";
import { REPORT_AUTO_HIDE_THRESHOLD } from "@/lib/moderation/auto-hide";

describe("auto-hide threshold", () => {
  it("uses 3 reports as threshold", () => {
    expect(REPORT_AUTO_HIDE_THRESHOLD).toBe(3);
  });
});
