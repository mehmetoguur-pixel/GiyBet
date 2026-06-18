import { describe, expect, it } from "vitest";
import { getBearerToken } from "@/lib/api-auth";
import { jsonRequest } from "./helpers/request";

describe("api-auth", () => {
  it("extracts bearer tokens from authorization header", () => {
    const req = jsonRequest("/api/reports", {
      headers: { authorization: "Bearer secret-token" },
    });
    expect(getBearerToken(req)).toBe("secret-token");
  });

  it("returns null when authorization is missing", () => {
    expect(getBearerToken(jsonRequest("/api/reports"))).toBeNull();
  });
});
