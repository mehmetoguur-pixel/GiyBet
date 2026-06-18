import { describe, expect, it } from "vitest";
import { reasonIcon } from "@/lib/admin/moderation-types";

describe("moderation types", () => {
  it("maps report reasons to icons", () => {
    expect(reasonIcon("spam")).toBe("🗑️");
    expect(reasonIcon("harassment")).toBe("⚠️");
    expect(reasonIcon("inappropriate")).toBe("🚫");
    expect(reasonIcon("other")).toBe("❓");
  });
});
