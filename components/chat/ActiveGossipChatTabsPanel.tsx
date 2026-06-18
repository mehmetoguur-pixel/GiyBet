"use client";

import { MAX_VENUE_ROOMS } from "@/lib/gossip/constants";
import { useI18n } from "@/lib/i18n/provider";

export function ActiveGossipChatTabsPanel({
  activeGossipIds,
  gossipLabels,
  focusedGossipId,
  onFocusChat,
  onLeaveChat,
}: {
  activeGossipIds: string[];
  gossipLabels: Record<string, string>;
  focusedGossipId: string | null;
  onFocusChat: (gossipId: string) => void;
  onLeaveChat: (gossipId: string) => void;
}) {
  const { t } = useI18n();
  if (activeGossipIds.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 text-xs text-zinc-500">
        {t("chat.noActive")}
        <span className="mt-1 block text-[10px] text-zinc-600">
          {t("chat.maxRoomsHint", { max: MAX_VENUE_ROOMS })}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase">
        {t("chat.activeTitle", { count: activeGossipIds.length, max: MAX_VENUE_ROOMS })}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {activeGossipIds.map((gossipId) => {
          const label = gossipLabels[gossipId] ?? t("chat.defaultLabel");
          const isFocused = gossipId === focusedGossipId;
          return (
            <div
              key={gossipId}
              className={`flex shrink-0 items-center gap-1 rounded-xl border px-1 py-1 transition-all ${
                isFocused
                  ? "border-emerald-500/60 bg-emerald-950/40 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                  : "border-purple-500/30 bg-purple-950/25 opacity-80 shadow-[0_0_8px_rgba(168,85,247,0.15)]"
              }`}
            >
              <button
                type="button"
                onClick={() => onFocusChat(gossipId)}
                className={`max-w-[8.5rem] truncate px-2 py-1 text-[11px] font-semibold transition-all ${
                  isFocused ? "text-emerald-200" : "text-purple-300/90 hover:text-purple-200"
                }`}
                title={label}
              >
                {isFocused ? "📍 " : "💬 "}
                {label}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLeaveChat(gossipId);
                }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-red-500/40 bg-red-950/30 text-[10px] text-red-400 transition-all hover:border-red-400/60 hover:bg-red-950/50 hover:text-red-200"
                aria-label={t("chat.leaveChatAria", { label })}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
