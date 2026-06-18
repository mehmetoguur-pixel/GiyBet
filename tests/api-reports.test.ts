import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSessionUser } from "@/lib/api-auth";
import { notifyAdminNewReport } from "@/lib/admin-notify";
import { getAdminClient } from "@/lib/supabase-admin";
import { POST } from "@/app/api/reports/route";
import { jsonRequest } from "./helpers/request";

vi.mock("@/lib/api-auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/supabase-admin", () => ({ getAdminClient: vi.fn() }));
vi.mock("@/lib/admin-notify", () => ({ notifyAdminNewReport: vi.fn() }));

const mockedGetSessionUser = vi.mocked(getSessionUser);
const mockedGetAdminClient = vi.mocked(getAdminClient);
const mockedNotify = vi.mocked(notifyAdminNewReport);

function mockUser(id: string, nickname = "reporter") {
  return {
    id,
    user_metadata: { nickname },
  };
}

function mockReportsAdmin(options: {
  gossip?: Record<string, unknown> | null;
  gossipError?: { message: string } | null;
  existingReport?: { id: string } | null;
  insertError?: { message: string } | null;
}) {
  const from = vi.fn((table: string) => {
    if (table === "gossips") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: options.gossip ?? null,
              error: options.gossipError ?? null,
            }),
          }),
        }),
      };
    }
    if (table === "content_reports") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: options.existingReport ?? null,
                error: null,
              }),
            }),
          }),
        }),
        insert: vi.fn(async () => ({ error: options.insertError ?? null })),
      };
    }
    return {};
  });
  mockedGetAdminClient.mockReturnValue({ from } as never);
  return { from };
}

describe("POST /api/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedNotify.mockResolvedValue(undefined);
  });

  it("returns 401 without a session", async () => {
    mockedGetSessionUser.mockResolvedValue(null);
    const res = await POST(
      jsonRequest("/api/reports", {
        method: "POST",
        body: { gossipId: "abc", reason: "spam" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid gossip id", async () => {
    mockedGetSessionUser.mockResolvedValue(mockUser("user-1") as never);
    mockReportsAdmin({ gossip: null });
    const res = await POST(
      jsonRequest("/api/reports", {
        method: "POST",
        body: { gossipId: "bad id!", reason: "spam" },
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_gossip_id");
  });

  it("returns 404 when gossip is missing or deleted", async () => {
    mockedGetSessionUser.mockResolvedValue(mockUser("user-2") as never);
    mockReportsAdmin({ gossip: null });
    const res = await POST(
      jsonRequest("/api/reports", {
        method: "POST",
        body: { gossipId: "missing-gossip", reason: "spam" },
      }),
    );
    expect(res.status).toBe(404);
  });

  it("forbids reporting your own gossip", async () => {
    mockedGetSessionUser.mockResolvedValue(mockUser("author-user") as never);
    mockReportsAdmin({
      gossip: {
        id: "gossip-1",
        username: "author",
        user_id: "author-user",
        deleted_at: null,
        content: "hello",
      },
    });
    const res = await POST(
      jsonRequest("/api/reports", {
        method: "POST",
        body: { gossipId: "gossip-1", reason: "spam" },
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("self_report_forbidden");
  });

  it("returns 409 when the gossip was already reported", async () => {
    mockedGetSessionUser.mockResolvedValue(mockUser("user-3") as never);
    mockReportsAdmin({
      gossip: {
        id: "gossip-2",
        username: "target",
        user_id: "other-user",
        deleted_at: null,
        content: "spam post",
      },
      existingReport: { id: "report-1" },
    });
    const res = await POST(
      jsonRequest("/api/reports", {
        method: "POST",
        body: { gossipId: "gossip-2", reason: "spam" },
      }),
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("already_reported");
  });

  it("creates a report and notifies admins", async () => {
    mockedGetSessionUser.mockResolvedValue(mockUser("user-4", "gececi") as never);
    const admin = mockReportsAdmin({
      gossip: {
        id: "gossip-3",
        username: "target_user",
        user_id: "other-user",
        deleted_at: null,
        content: "offensive",
      },
    });
    const res = await POST(
      jsonRequest("/api/reports", {
        method: "POST",
        body: { gossipId: "gossip-3", reason: "harassment", gossipPreview: "offensive" },
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(admin.from).toHaveBeenCalledWith("content_reports");
    expect(mockedNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterUsername: "gececi",
        reportedUsername: "target_user",
        reason: "harassment",
        gossipId: "gossip-3",
      }),
    );
  });
});
