import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminClient, getAdminSessionEmail } from "@/lib/admin-api";
import { GET, PATCH } from "@/app/api/admin/reports/route";
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

describe("admin reports API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 403 for non-admin sessions", async () => {
    mockedGetAdminSessionEmail.mockResolvedValue("user@test.com");
    const res = await GET(jsonRequest("/api/admin/reports"));
    expect(res.status).toBe(403);
  });

  it("PATCH returns 403 for non-admin sessions", async () => {
    mockedGetAdminSessionEmail.mockResolvedValue(null);
    const res = await PATCH(
      jsonRequest("/api/admin/reports", {
        method: "PATCH",
        body: { id: "report-1", status: "reviewed" },
      }),
    );
    expect(res.status).toBe(403);
  });

  it("PATCH returns 400 when id is missing", async () => {
    mockedGetAdminSessionEmail.mockResolvedValue("admin@test.com");
    mockedGetAdminClient.mockReturnValue({ from: vi.fn() } as never);
    const res = await PATCH(
      jsonRequest("/api/admin/reports", {
        method: "PATCH",
        body: { status: "reviewed" },
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_body");
  });

  it("PATCH returns 400 for invalid status", async () => {
    mockedGetAdminSessionEmail.mockResolvedValue("admin@test.com");
    mockedGetAdminClient.mockReturnValue({ from: vi.fn() } as never);
    const res = await PATCH(
      jsonRequest("/api/admin/reports", {
        method: "PATCH",
        body: { id: "report-1", status: "bogus" },
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_status");
  });

  it("PATCH updates report status for admins", async () => {
    mockedGetAdminSessionEmail.mockResolvedValue("admin@test.com");
    const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
    mockedGetAdminClient.mockReturnValue({
      from: vi.fn(() => ({ update })),
    } as never);

    const res = await PATCH(
      jsonRequest("/api/admin/reports", {
        method: "PATCH",
        body: { id: "report-1", status: "dismissed", admin_note: "ok" },
      }),
    );

    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "dismissed",
        reviewed_by: "admin@test.com",
        admin_note: "ok",
      }),
    );
  });
});
