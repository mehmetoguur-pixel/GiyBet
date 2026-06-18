"use client";

import { MAX_VENUE_ROOMS } from "@/lib/gossip/constants";
import { useI18n } from "@/lib/i18n/provider";

export function RoomLimitAlert() {
  const { t } = useI18n();
  return (
    <div
      role="alert"
      className="animate-gossip-flash fixed top-20 left-1/2 z-[9997] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-pink-500/70 bg-gradient-to-r from-red-950/90 via-pink-950/90 to-purple-950/90 px-4 py-3 text-center text-xs font-bold text-pink-100 shadow-[0_0_32px_rgba(236,72,153,0.6)]"
    >
      ⚠️ {t("chat.roomLimitFull", { max: MAX_VENUE_ROOMS })}
    </div>
  );
}
