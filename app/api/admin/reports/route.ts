import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, getAdminClient, getAdminSessionEmail } from "@/lib/admin-api";
import { REPORT_LIMITS, sanitizeText } from "@/lib/report-validation";

const REPORT_STATUSES = new Set(["open", "reviewed", "dismissed"]);

type ReportRow = {
  id: string;
  reporter_username: string;
  gossip_id: string;
  reported_username: string | null;
  reason: string;
  status: string;
  created_at: string;
  admin_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

type GossipPreview = {
  id: string;
  content: string;
  username: string | null;
  deleted_at: string | null;
  created_at: string | null;
  city: string | null;
  district: string | null;
  venue_name: string | null;
  location_label: string | null;
  image_url: string | null;
  tags: string[] | null;
  like_usernames: string[] | null;
  user_id: string | null;
};

export async function GET(request: NextRequest) {
  const email = await getAdminSessionEmail(request);
  if (!assertAdmin(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const statusFilter = request.nextUrl.searchParams.get("status");
  let query = admin.from("content_reports").select("*").order("created_at", { ascending: false }).limit(100);

  if (statusFilter === "open" || statusFilter === "reviewed" || statusFilter === "dismissed") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reports = (data ?? []) as ReportRow[];
  const gossipIds = [...new Set(reports.map((r) => r.gossip_id).filter(Boolean))];

  const gossipMap = new Map<string, GossipPreview>();
  const reportCountMap = new Map<string, number>();

  if (gossipIds.length > 0) {
    const { data: gossips } = await admin
      .from("gossips")
      .select(
        "id, content, username, deleted_at, created_at, city, district, venue_name, location_label, image_url, tags, like_usernames, user_id",
      )
      .in("id", gossipIds);

    for (const row of gossips ?? []) {
      const g = row as GossipPreview;
      gossipMap.set(String(g.id), g);
    }

    const { data: reportCounts } = await admin
      .from("content_reports")
      .select("gossip_id")
      .in("gossip_id", gossipIds);

    for (const row of reportCounts ?? []) {
      const gid = String((row as { gossip_id: string }).gossip_id);
      reportCountMap.set(gid, (reportCountMap.get(gid) ?? 0) + 1);
    }
  }

  const [{ count: openCount }, { count: reviewedCount }, { count: dismissedCount }, { count: totalCount }, timelineRes, bansRes] =
    await Promise.all([
      admin.from("content_reports").select("*", { count: "exact", head: true }).eq("status", "open"),
      admin.from("content_reports").select("*", { count: "exact", head: true }).eq("status", "reviewed"),
      admin.from("content_reports").select("*", { count: "exact", head: true }).eq("status", "dismissed"),
      admin.from("content_reports").select("*", { count: "exact", head: true }),
      admin
        .from("content_reports")
        .select("created_at")
        .gte("created_at", new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()),
      admin.from("user_bans").select("user_id"),
    ]);

  const bannedUserIds = new Set(
    (bansRes.data ?? []).map((row) => String((row as { user_id: string }).user_id)),
  );

  const timelineMap = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    timelineMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of timelineRes.data ?? []) {
    const day = String((row as { created_at: string }).created_at).slice(0, 10);
    if (timelineMap.has(day)) {
      timelineMap.set(day, (timelineMap.get(day) ?? 0) + 1);
    }
  }
  const timeline = [...timelineMap.entries()].map(([date, count]) => ({ date, count }));

  const enriched = reports.map((report) => {
    const gossip = gossipMap.get(report.gossip_id);
    const likeCount = Array.isArray(gossip?.like_usernames) ? gossip.like_usernames.length : 0;
    const authorUserId = gossip?.user_id ?? null;
    return {
      ...report,
      gossip_content: gossip?.content ?? null,
      gossip_author: gossip?.username ?? report.reported_username,
      gossip_deleted: Boolean(gossip?.deleted_at),
      gossip_created_at: gossip?.created_at ?? null,
      gossip_city: gossip?.city ?? null,
      gossip_district: gossip?.district ?? null,
      gossip_venue: gossip?.venue_name ?? null,
      gossip_location: gossip?.location_label ?? null,
      gossip_image_url: gossip?.image_url ?? null,
      gossip_tags: gossip?.tags ?? null,
      gossip_like_count: likeCount,
      gossip_user_id: authorUserId,
      author_banned: authorUserId ? bannedUserIds.has(String(authorUserId)) : false,
      report_count: reportCountMap.get(report.gossip_id) ?? 1,
    };
  });

  return NextResponse.json({
    reports: enriched,
    stats: {
      open: openCount ?? 0,
      reviewed: reviewedCount ?? 0,
      dismissed: dismissedCount ?? 0,
      total: totalCount ?? 0,
      banned: bannedUserIds.size,
    },
    timeline,
  });
}

export async function PATCH(request: NextRequest) {
  const email = await getAdminSessionEmail(request);
  if (!assertAdmin(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const body = (await request.json()) as {
    id?: string;
    status?: string;
    admin_note?: string;
  };
  if (!body.id) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const patch: Record<string, string | null> = {};
  if (body.status) {
    if (!REPORT_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }
    patch.status = body.status;
    patch.reviewed_at = new Date().toISOString();
    patch.reviewed_by = email ?? null;
  }
  if (body.admin_note !== undefined) {
    patch.admin_note = sanitizeText(body.admin_note, REPORT_LIMITS.maxAdminNoteLength) || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { error } = await admin.from("content_reports").update(patch).eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
