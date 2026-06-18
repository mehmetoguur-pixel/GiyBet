"use client";

import { ReportCard } from "@/components/admin/moderation/ReportCard";
import { TimelineChart } from "@/components/admin/moderation/TimelineChart";
import {
  REASON_FILTERS,
  type ReasonFilter,
  type ReportRow,
  type Stats,
  type StatusFilter,
  type TimelinePoint,
} from "@/lib/admin/moderation-types";

type ReportsTabProps = {
  timeline: TimelinePoint[];
  stats: Stats;
  statusFilter: StatusFilter;
  onStatusFilter: (filter: StatusFilter) => void;
  reasonFilter: ReasonFilter;
  onReasonFilter: (filter: ReasonFilter) => void;
  search: string;
  onSearch: (value: string) => void;
  loading: boolean;
  error: string;
  filteredReports: ReportRow[];
  noteDrafts: Record<string, string>;
  onNoteDraftChange: (id: string, value: string) => void;
  actionId: string | null;
  noteSavedId: string | null;
  reasonLabel: (reason: string) => string;
  statusBadge: (status: string) => React.ReactNode;
  onSaveNote: (id: string) => void;
  onHideGossip: (gossipId: string, reportId: string) => void;
  onBanUser: (userId: string, username: string, reportId: string) => void;
  onRestoreGossip: (gossipId: string, reportId: string) => void;
  onPatchReport: (id: string, status: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

function StatCard({
  label,
  value,
  accent,
  onClick,
}: {
  label: string;
  value: number;
  accent: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border bg-[#12121a]/90 p-4 text-left transition hover:border-pink-500/30 ${accent}`}
    >
      <p className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-100">{value}</p>
    </button>
  );
}

export function ReportsTab({
  timeline,
  stats,
  statusFilter,
  onStatusFilter,
  reasonFilter,
  onReasonFilter,
  search,
  onSearch,
  loading,
  error,
  filteredReports,
  noteDrafts,
  onNoteDraftChange,
  actionId,
  noteSavedId,
  reasonLabel,
  statusBadge,
  onSaveNote,
  onHideGossip,
  onBanUser,
  onRestoreGossip,
  onPatchReport,
  t,
}: ReportsTabProps) {
  return (
    <>
      {timeline.length > 0 && (
        <div className="mb-6">
          <TimelineChart data={timeline} title={t("moderation.timelineTitle")} />
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={t("moderation.filterOpen")}
          value={stats.open}
          accent="border-amber-500/20"
          onClick={() => onStatusFilter("open")}
        />
        <StatCard
          label={t("moderation.filterReviewed")}
          value={stats.reviewed}
          accent="border-emerald-500/20"
          onClick={() => onStatusFilter("reviewed")}
        />
        <StatCard
          label={t("moderation.filterDismissed")}
          value={stats.dismissed}
          accent="border-zinc-700"
          onClick={() => onStatusFilter("dismissed")}
        />
        <StatCard
          label={t("moderation.filterAll")}
          value={stats.total}
          accent="border-purple-500/20"
          onClick={() => onStatusFilter("all")}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["open", "all", "reviewed", "dismissed"] as StatusFilter[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onStatusFilter(id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === id
                ? "border-pink-500/60 bg-pink-950/40 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.15)]"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-purple-500/40"
            }`}
          >
            {t(
              `moderation.filter${id === "open" ? "Open" : id === "all" ? "All" : id === "reviewed" ? "Reviewed" : "Dismissed"}`,
            )}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("moderation.searchPlaceholder")}
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
        />
        <div className="flex flex-wrap gap-1.5">
          {REASON_FILTERS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onReasonFilter(r)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] transition ${
                reasonFilter === r
                  ? "border-purple-500/50 bg-purple-950/40 text-purple-200"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
              }`}
            >
              {r === "all" ? t("moderation.filterAll") : reasonLabel(r)}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-400" />
          {t("common.loading")}
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {!loading && !error && filteredReports.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-6 py-12 text-center">
          <p className="text-zinc-500">{t("moderation.empty")}</p>
          <p className="mt-1 text-xs text-zinc-600">{t("moderation.emptyHint")}</p>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {filteredReports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            noteDraft={noteDrafts[report.id] ?? ""}
            onNoteChange={(value) => onNoteDraftChange(report.id, value)}
            actionId={actionId}
            noteSavedId={noteSavedId}
            reasonLabel={reasonLabel}
            statusBadge={statusBadge}
            onSaveNote={onSaveNote}
            onHideGossip={onHideGossip}
            onBanUser={onBanUser}
            onRestoreGossip={onRestoreGossip}
            onPatchReport={onPatchReport}
            t={t}
          />
        ))}
      </ul>

      {!loading && filteredReports.length > 0 && (
        <p className="mt-6 text-center text-xs text-zinc-600">
          {t("moderation.showingCount", { count: filteredReports.length })}
        </p>
      )}
    </>
  );
}
