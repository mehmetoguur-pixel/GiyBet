import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminClient, getAdminSessionEmail } from "@/lib/admin-api";
import { DELETE, GET, POST } from "@/app/api/admin/bans/route";
import { jsonRequest } from "./helpers/request";

vi.mock("@/lib/admin-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin-api")>();
  return {
    ...actual,
    getAdminSessionEmail: vi.fn(),
    getAdminClient: vi.fn(),
  };
});

const mockedGetAdminSessionEmail = vi.mocked(getAdminSessionEmail);
const mockedGetAdminClient = vi.mocked(getAdminClient);

const VALID_USER_ID = "a1b2c3d4-e5f6-4789-a012-3456789abcde";

describe("admin bans API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 403 for non-admin sessions", async () => {
    mockedGetAdminSessionEmail.mockResolvedValue("stranger@test.com");
    const res = await GET(jsonRequest("/api/admin/bans"));
    expect(res.status).toBe(403);
  });

  it("POST returns 400 for invalid payload", async () => {
    mockedGetAdminSessionEmail.mockResolvedValue("admin@test.com");
    mockedGetAdminClient.mockReturnValue({ from: vi.fn() } as never);
    const res = await POST(
      jsonRequest("/api/admin/bans", {
        method: "POST",
        body: { userId: "not-a-uuid", username: "bad" },
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_body");
  });

  it("POST bans a user when payload is valid", async () => {
    mockedGetAdminSessionEmail.mockResolvedValue("admin@test.com");
    const upsert = vi.fn(async () => ({ error: null }));
    mockedGetAdminClient.mockReturnValue({
      from: vi.fn(() => ({ upsert })),
      auth: {
        admin: {
          getUserById: vi.fn(async () => ({
            data: { user: { id: VALID_USER_ID, email: "target@test.com" } },
            error: null,
          })),
        },
      },
    } as never);

    const res = await POST(
      jsonRequest("/api/admin/bans", {
        method: "POST",
        body: { userId: VALID_USER_ID, username: "target_user", reason: "spam" },
      }),
    );

    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: VALID_USER_ID,
        username: "target_user",
        banned_by_email: "admin@test.com",
      }),
      { onConflict: "user_id" },
    );
  });

  it("DELETE returns 400 without a valid userId", async () => {
    mockedGetAdminSessionEmail.mockResolvedValue("admin@test.com");
    mockedGetAdminClient.mockReturnValue({ from: vi.fn() } as never);
    const res = await DELETE(jsonRequest("/api/admin/bans", { search: { userId: "bad" } }));
    expect(res.status).toBe(400);
  });

  it("DELETE removes a ban for admins", async () => {
    mockedGetAdminSessionEmail.mockResolvedValue("admin@test.com");
    const eq = vi.fn(async () => ({ error: null }));
    const deleteFn = vi.fn(() => ({ eq }));
    mockedGetAdminClient.mockReturnValue({
      from: vi.fn(() => ({ delete: deleteFn })),
    } as never);

    const res = await DELETE(
      jsonRequest("/api/admin/bans", { method: "DELETE", search: { userId: VALID_USER_ID } }),
    );

    expect(res.status).toBe(200);
    expect(deleteFn).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("user_id", VALID_USER_ID);
  });
});
