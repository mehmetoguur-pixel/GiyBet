"use client";

import { useI18n } from "@/lib/i18n/provider";

export function GossipChatFlash({
  gossipId,
  label,
  onNavigate,
}: {
  gossipId: string;
  label: string;
  onNavigate: (gossipId: string) => void;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => onNavigate(gossipId)}
      aria-live="polite"
      className="animate-gossip-flash fixed top-20 left-1/2 z-[9997] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 cursor-pointer rounded-xl border border-pink-500/60 bg-gradient-to-r from-pink-950/90 via-purple-950/90 to-pink-950/90 px-4 py-3 text-center text-xs font-bold text-pink-100 shadow-[0_0_32px_rgba(236,72,153,0.55)] transition-all hover:border-pink-400/80 hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] active:scale-[0.98]"
    >
      <span>🔔 {t("chat.newMessageInChat", { label })}</span>
      <span className="mt-1.5 block text-[10px] font-semibold tracking-wide text-pink-200 uppercase">
        {t("chat.goToChat")} 🚀
      </span>
    </button>
  );
}
