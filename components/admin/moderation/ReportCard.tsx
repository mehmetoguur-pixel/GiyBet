"use client";

import { reasonIcon, type ReportRow } from "@/lib/admin/moderation-types";

type ReportCardProps = {
  report: ReportRow;
  noteDraft: string;
  onNoteChange: (value: string) => void;
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

export function ReportCard({
  report,
  noteDraft,
  onNoteChange,
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
}: ReportCardProps) {
  const locationParts = [
    report.gossip_location,
    report.gossip_venue,
    report.gossip_district,
    report.gossip_city,
  ].filter(Boolean);
  const locationText = locationParts[0] ?? locationParts.slice(1).join(" · ");

  return (
    <li
      className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#12121a]/95 shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-950/40 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg">{reasonIcon(report.reason)}</span>
          <span className="font-semibold text-pink-200">
            @{report.gossip_author ?? report.reported_username ?? "?"}
          </span>
          {statusBadge(report.status)}
          {report.author_banned && (
            <span className="rounded border border-red-500/40 bg-red-950/40 px-2 py-0.5 text-[10px] text-red-300">
              {t("moderation.authorBanned")}
            </span>
          )}
          {report.gossip_deleted && (
            <span className="rounded border border-red-500/30 bg-red-950/30 px-2 py-0.5 text-[10px] text-red-300">
              {t("moderation.gossipHidden")}
            </span>
          )}
          {report.report_count > 1 && (
            <span className="rounded border border-amber-500/30 bg-amber-950/30 px-2 py-0.5 text-[10px] text-amber-200">
              {t("moderation.multipleReports", { count: report.report_count })}
            </span>
          )}
        </div>
        <time className="text-xs text-zinc-500">
          {new Date(report.created_at).toLocaleString()}
        </time>
      </div>

      <div className="p-4">
        {report.gossip_content && (
          <p className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3 text-sm leading-relaxed text-zinc-300">
            {report.gossip_content}
          </p>
        )}

        {report.gossip_image_url && (
          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">
            <img
              src={report.gossip_image_url}
              alt=""
              className="max-h-48 w-full object-cover"
            />
          </div>
        )}

        {report.gossip_tags && report.gossip_tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {report.gossip_tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-purple-500/20 bg-purple-950/20 px-2 py-0.5 text-[10px] text-purple-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2">
            <span className="text-zinc-500">{t("moderation.reporter")}</span>
            <p className="font-medium text-zinc-300">@{report.reporter_username}</p>
          </div>
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2">
            <span className="text-zinc-500">{t("moderation.reason")}</span>
            <p className="font-medium text-zinc-300">{reasonLabel(report.reason)}</p>
          </div>
          {locationText && (
            <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2">
              <span className="text-zinc-500">{t("moderation.location")}</span>
              <p className="font-medium text-zinc-300">{locationText}</p>
            </div>
          )}
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2">
            <span className="text-zinc-500">{t("moderation.meta")}</span>
            <p className="font-medium text-zinc-300">
              {report.gossip_like_count} {t("moderation.likes")}
              {report.gossip_created_at &&
                ` · ${new Date(report.gossip_created_at).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        <p className="mt-3 font-mono text-[10px] text-zinc-600">
          gossip: {report.gossip_id}
          {report.gossip_user_id && ` · user: ${report.gossip_user_id.slice(0, 8)}…`}
        </p>

        {report.reviewed_by && (
          <p className="mt-2 text-[10px] text-zinc-600">
            {t("moderation.reviewedBy")}: {report.reviewed_by}
            {report.reviewed_at && ` · ${new Date(report.reviewed_at).toLocaleString()}`}
          </p>
        )}

        <div className="mt-4">
          <label className="text-xs text-zinc-500">{t("moderation.adminNote")}</label>
          <textarea
            value={noteDraft}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-300 focus:border-purple-500/40 focus:outline-none"
            placeholder="…"
          />
          <button
            type="button"
            disabled={actionId === report.id}
            onClick={() => onSaveNote(report.id)}
            className="mt-2 rounded-lg border border-purple-500/40 px-3 py-1 text-xs text-purple-300 disabled:opacity-50"
          >
            {noteSavedId === report.id ? t("moderation.noteSaved") : t("moderation.saveNote")}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800/60 pt-4">
          {!report.gossip_deleted && (
            <button
              type="button"
              disabled={actionId === report.id}
              onClick={() => onHideGossip(report.gossip_id, report.id)}
              className="rounded-lg border border-red-500/50 bg-red-950/20 px-4 py-2 text-xs font-medium text-red-300 hover:bg-red-950/40 disabled:opacity-50"
            >
              {t("moderation.hideGossip")}
            </button>
          )}
          {report.gossip_user_id && !report.author_banned && (
            <button
              type="button"
              disabled={actionId === report.id}
              onClick={() =>
                onBanUser(
                  report.gossip_user_id!,
                  report.gossip_author ?? report.reported_username ?? "user",
                  report.id,
                )
              }
              className="rounded-lg border border-orange-500/50 bg-orange-950/20 px-4 py-2 text-xs font-medium text-orange-300 hover:bg-orange-950/40 disabled:opacity-50"
            >
              {t("moderation.banUser")}
            </button>
          )}
          {report.gossip_deleted && (
            <button
              type="button"
              disabled={actionId === report.id}
              onClick={() => onRestoreGossip(report.gossip_id, report.id)}
              className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 px-4 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-50"
            >
              {t("moderation.restoreGossip")}
            </button>
          )}
          {report.status === "open" && (
            <>
              <button
                type="button"
                disabled={actionId === report.id}
                onClick={() => onPatchReport(report.id, "reviewed")}
                className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 px-4 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-50"
              >
                {t("moderation.markReviewed")}
              </button>
              <button
                type="button"
                disabled={actionId === report.id}
                onClick={() => onPatchReport(report.id, "dismissed")}
                className="rounded-lg border border-zinc-600 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-500 disabled:opacity-50"
              >
                {t("moderation.dismiss")}
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
