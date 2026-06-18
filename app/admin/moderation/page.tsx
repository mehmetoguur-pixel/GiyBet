"use client";

import Link from "next/link";
import { BannedUsersTab } from "@/components/admin/moderation/BannedUsersTab";
import { ReportsTab } from "@/components/admin/moderation/ReportsTab";
import { useModerationAdmin } from "@/hooks/admin/useModerationAdmin";

export default function ModerationPage() {
  const admin = useModerationAdmin();
  const {
    t,
    stats,
    loading,
    viewTab,
    bans,
    switchTab,
    refresh,
    setNoteDrafts,
  } = admin;

  const statusBadge = (status: string) => {
    if (status === "open") {
      return (
        <span className="rounded-full border border-amber-500/40 bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200">
          {t("moderation.statusOpen")}
        </span>
      );
    }
    if (status === "reviewed") {
      return (
        <span className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200">
          {t("moderation.statusReviewed")}
        </span>
      );
    }
    return (
      <span className="rounded-full border border-zinc-600 bg-zinc-900/80 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        {t("moderation.statusDismissed")}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#08080f] text-zinc-200">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.12),_transparent_50%)]" />

      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-400">
                GıyBet Admin
              </p>
              <h1 className="mt-1 text-3xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-pink-200 bg-clip-text text-transparent">
                {t("moderation.title")}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-zinc-500">{t("moderation.subtitle")}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:border-purple-500/40 hover:text-purple-200 disabled:opacity-50"
              >
                {t("moderation.refresh")}
              </button>
              <Link
                href="/"
                className="rounded-lg border border-pink-500/30 bg-pink-950/20 px-3 py-2 text-xs text-pink-200 hover:bg-pink-950/40"
              >
                {t("moderation.backHome")}
              </Link>
            </div>
          </div>
        </header>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => switchTab("reports")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              viewTab === "reports"
                ? "border-purple-500/50 bg-purple-950/40 text-purple-200"
                : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
            }`}
          >
            {t("moderation.tabReports")}
          </button>
          <button
            type="button"
            onClick={() => switchTab("banned")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              viewTab === "banned"
                ? "border-red-500/50 bg-red-950/40 text-red-200"
                : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
            }`}
          >
            {t("moderation.tabBanned")} ({stats.banned ?? bans.length})
          </button>
        </div>

        {viewTab === "reports" && (
          <ReportsTab
            timeline={admin.timeline}
            stats={admin.stats}
            statusFilter={admin.statusFilter}
            onStatusFilter={admin.setStatusFilter}
            reasonFilter={admin.reasonFilter}
            onReasonFilter={admin.setReasonFilter}
            search={admin.search}
            onSearch={admin.setSearch}
            loading={admin.loading}
            error={admin.error}
            filteredReports={admin.filteredReports}
            noteDrafts={admin.noteDrafts}
            onNoteDraftChange={(id, value) =>
              setNoteDrafts((prev) => ({ ...prev, [id]: value }))
            }
            actionId={admin.actionId}
            noteSavedId={admin.noteSavedId}
            reasonLabel={admin.reasonLabel}
            statusBadge={statusBadge}
            onSaveNote={admin.saveNote}
            onHideGossip={admin.hideGossip}
            onBanUser={admin.banUser}
            onRestoreGossip={admin.restoreGossip}
            onPatchReport={admin.patchReport}
            t={admin.t}
          />
        )}

        {viewTab === "banned" && (
          <BannedUsersTab
            bans={bans}
            loading={loading}
            actionId={admin.actionId}
            onUnban={admin.unbanUser}
            t={t}
          />
        )}

        <p className="mt-8 text-center text-[10px] text-zinc-600">{t("moderation.emailNotifyHint")}</p>
      </div>
    </div>
  );
}
