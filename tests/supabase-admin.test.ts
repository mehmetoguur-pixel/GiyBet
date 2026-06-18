import { describe, expect, it } from "vitest";
import { createSupabaseAdmin, isAdminEmail } from "@/lib/supabase-admin";

describe("supabase-admin", () => {
  it("recognizes configured admin emails", () => {
    expect(isAdminEmail("admin@test.com")).toBe(true);
    expect(isAdminEmail("Admin@Test.com")).toBe(true);
    expect(isAdminEmail("stranger@test.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });

  it("creates admin client when service key is set", () => {
    expect(createSupabaseAdmin()).not.toBeNull();
  });
});
