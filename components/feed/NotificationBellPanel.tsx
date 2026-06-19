"use client";

import { NOTIFICATION_LIST_LIMIT } from "@/lib/gossip/constants";
import type { BellNotification } from "@/lib/giybet/types";
import { useI18n } from "@/lib/i18n/provider";

export function NotificationBellPanel({
  notifications,
  unreadCount,
  open,
  onToggle,
  onSelect,
}: {
  notifications: BellNotification[];
  unreadCount: number;
  open: boolean;
  onToggle: () => void;
  onSelect: (notification: BellNotification) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-sky-500/50 bg-[#12121a] text-lg shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all hover:border-sky-400/70 hover:shadow-[0_0_28px_rgba(56,189,248,0.55)] active:scale-95"
        aria-label={t("notifications.bellAria")}
        aria-expanded={open}
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-red-400/70 bg-red-600 px-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.7)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-sky-500/40 bg-[#12121a]/95 shadow-[0_0_32px_rgba(56,189,248,0.25)] backdrop-blur-md">
          <div className="border-b border-sky-500/25 bg-sky-950/30 px-3 py-2">
            <p className="text-xs font-bold text-sky-200">{t("notifications.historyTitle")}</p>
            <p className="text-[10px] text-zinc-500">
              {t("notifications.historyHint", { count: NOTIFICATION_LIST_LIMIT })}
            </p>
          </div>
          {notifications.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-zinc-500">{t("notifications.empty")}</p>
          ) : (
            <ul className="max-h-56 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(n)}
                    className="w-full border-b border-zinc-800/60 px-3 py-2.5 text-left text-xs text-zinc-300 transition-all hover:bg-purple-950/40 hover:text-pink-200"
                  >
                    {n.type === "follow" || n.gossipId.startsWith("follow-") ? "👤" : "⚡"} {n.message}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
