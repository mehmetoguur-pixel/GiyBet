"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import {
  getAdminAccessToken,
  type BanRow,
  type ReasonFilter,
  type ReportRow,
  type Stats,
  type StatusFilter,
  type TimelinePoint,
  type ViewTab,
} from "@/lib/admin/moderation-types";

export function useModerationAdmin() {
  const { t } = useI18n();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [stats, setStats] = useState<Stats>({ open: 0, reviewed: 0, dismissed: 0, total: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("all");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<ViewTab>("reports");
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [bans, setBans] = useState<BanRow[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [noteSavedId, setNoteSavedId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = await getAdminAccessToken();
    if (!token) {
      setError(t("moderation.loginRequired"));
      setLoading(false);
      return;
    }

    const qs = statusFilter === "all" ? "" : `?status=${statusFilter}`;
    const res = await fetch(`/api/admin/reports${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (payload.error === "forbidden") setError(t("moderation.forbidden"));
      else if (payload.error === "admin_not_configured") setError(t("moderation.notConfigured"));
      else setError(t("moderation.loadFailed"));
      setLoading(false);
      return;
    }

    const payload = (await res.json()) as {
      reports: ReportRow[];
      stats?: Stats;
      timeline?: TimelinePoint[];
    };
    const list = payload.reports ?? [];
    setReports(list);
    if (payload.stats) setStats(payload.stats);
    if (payload.timeline) setTimeline(payload.timeline);
    const drafts: Record<string, string> = {};
    for (const r of list) {
      drafts[r.id] = r.admin_note ?? "";
    }
    setNoteDrafts(drafts);
    setLoading(false);
  }, [statusFilter, t]);

  const loadBans = useCallback(async () => {
    const token = await getAdminAccessToken();
    if (!token) return;
    const res = await fetch("/api/admin/bans", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const payload = (await res.json()) as { bans: BanRow[] };
    setBans(payload.bans ?? []);
  }, []);

  useEffect(() => {
    if (viewTab !== "reports") return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void loadReports();
    });
    return () => {
      cancelled = true;
    };
  }, [viewTab, loadReports]);

  const switchTab = (tab: ViewTab) => {
    setViewTab(tab);
    if (tab === "banned") void loadBans();
  };

  const refresh = () => {
    if (viewTab === "reports") void loadReports();
    else void loadBans();
  };

  const patchReport = async (id: string, status: string) => {
    const token = await getAdminAccessToken();
    if (!token) return;
    setActionId(id);
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    });
    setActionId(null);
    loadReports();
  };

  const saveNote = async (id: string) => {
    const token = await getAdminAccessToken();
    if (!token) return;
    setActionId(id);
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, admin_note: noteDrafts[id] ?? "" }),
    });
    setActionId(null);
    setNoteSavedId(id);
    window.setTimeout(() => setNoteSavedId(null), 2000);
  };

  const banUser = async (userId: string, username: string, reportId: string) => {
    if (!confirm(t("moderation.banConfirm", { username }))) return;
    const token = await getAdminAccessToken();
    if (!token) return;
    setActionId(reportId);
    const res = await fetch("/api/admin/bans", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, username }),
    });
    setActionId(null);
    if (!res.ok) {
      setError(t("moderation.banFailed"));
      return;
    }
    loadReports();
    loadBans();
  };

  const unbanUser = async (userId: string) => {
    const token = await getAdminAccessToken();
    if (!token) return;
    setActionId(userId);
    const res = await fetch(`/api/admin/bans?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setActionId(null);
    if (!res.ok) {
      setError(t("moderation.unbanFailed"));
      return;
    }
    loadBans();
    if (viewTab === "reports") loadReports();
  };

  const hideGossip = async (gossipId: string, reportId: string) => {
    if (!confirm(t("moderation.hideConfirm"))) return;
    const token = await getAdminAccessToken();
    if (!token) return;
    setActionId(reportId);
    const res = await fetch("/api/admin/gossips", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gossipId }),
    });
    setActionId(null);
    if (!res.ok) {
      setError(t("moderation.hideFailed"));
      return;
    }
    await patchReport(reportId, "reviewed");
  };

  const restoreGossip = async (gossipId: string, reportId: string) => {
    const token = await getAdminAccessToken();
    if (!token) return;
    setActionId(reportId);
    const res = await fetch("/api/admin/gossips", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gossipId }),
    });
    setActionId(null);
    if (!res.ok) {
      setError(t("moderation.restoreFailed"));
      return;
    }
    loadReports();
  };

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (reasonFilter !== "all" && r.reason !== reasonFilter) return false;
      if (!q) return true;
      const haystack = [
        r.gossip_author,
        r.reporter_username,
        r.reported_username,
        r.gossip_content,
        r.gossip_city,
        r.gossip_location,
        r.reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [reports, search, reasonFilter]);

  const reasonLabel = (reason: string) => {
    const key = `report.reason.${reason}`;
    const val = t(key);
    return val === key ? reason : val;
  };

  return {
    t,
    reports,
    stats,
    error,
    loading,
    statusFilter,
    setStatusFilter,
    reasonFilter,
    setReasonFilter,
    search,
    setSearch,
    actionId,
    viewTab,
    timeline,
    bans,
    noteDrafts,
    setNoteDrafts,
    noteSavedId,
    filteredReports,
    reasonLabel,
    switchTab,
    refresh,
    patchReport,
    saveNote,
    banUser,
    unbanUser,
    hideGossip,
    restoreGossip,
  };
}
