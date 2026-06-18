"use client";

import type { BanRow } from "@/lib/admin/moderation-types";

type BannedUsersTabProps = {
  bans: BanRow[];
  loading: boolean;
  actionId: string | null;
  onUnban: (userId: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

export function BannedUsersTab({ bans, loading, actionId, onUnban, t }: BannedUsersTabProps) {
  return (
    <div className="flex flex-col gap-3">
      {bans.length === 0 && !loading && (
        <p className="text-sm text-zinc-500">{t("moderation.noBannedUsers")}</p>
      )}
      {bans.map((ban) => (
        <div
          key={ban.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-950/10 p-4"
        >
          <div>
            <p className="font-semibold text-red-200">@{ban.username}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {t("moderation.bannedSince")}: {new Date(ban.created_at).toLocaleString()}
              {ban.banned_by_email && ` · ${t("moderation.bannedBy")}: ${ban.banned_by_email}`}
            </p>
            {ban.reason && <p className="mt-1 text-xs text-zinc-400">{ban.reason}</p>}
            <p className="mt-1 font-mono text-[10px] text-zinc-600">{ban.user_id}</p>
          </div>
          <button
            type="button"
            disabled={actionId === ban.user_id}
            onClick={() => onUnban(ban.user_id)}
            className="rounded-lg border border-emerald-500/40 px-4 py-2 text-xs text-emerald-300 disabled:opacity-50"
          >
            {t("moderation.unbanUser")}
          </button>
        </div>
      ))}
    </div>
  );
}
