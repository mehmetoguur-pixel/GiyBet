import { describe, expect, it } from "vitest";
import {
  buildAuthPayload,
  isValidContact,
  normalizeContact,
  toSupabasePhone,
} from "@/lib/auth/profile";

describe("auth profile", () => {
  it("validates email and phone contacts", () => {
    expect(isValidContact("ogur.0642@outlook.com")).toBe(true);
    expect(isValidContact("+90 532 000 00 00")).toBe(true);
    expect(isValidContact("not-a-contact")).toBe(false);
  });

  it("normalizes contact strings", () => {
    expect(normalizeContact("  Test@Mail.COM  ")).toBe("test@mail.com");
    expect(normalizeContact("0532 111 22 33")).toBe("05321112233");
  });

  it("formats turkish phone numbers for Supabase", () => {
    expect(toSupabasePhone("05321112233")).toBe("+905321112233");
    expect(toSupabasePhone("905321112233")).toBe("+905321112233");
  });

  it("builds email or phone auth payloads", () => {
    expect(buildAuthPayload("user@test.com", "secret12")).toEqual({
      email: "user@test.com",
      password: "secret12",
    });
    expect(buildAuthPayload("0532 111 22 33", "secret12")).toEqual({
      phone: "+905321112233",
      password: "secret12",
    });
  });
});
