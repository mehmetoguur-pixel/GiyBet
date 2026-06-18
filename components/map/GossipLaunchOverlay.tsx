"use client";

import { useI18n } from "@/lib/i18n/provider";

export function GossipLaunchOverlay({ visible }: { visible: boolean }) {
  const { t } = useI18n();
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="mx-4 rounded-2xl border border-purple-500/55 bg-[#0d0d14]/95 px-10 py-8 text-center shadow-[0_0_48px_rgba(168,85,247,0.5)]">
        <div className="gossip-launch-spinner mx-auto mb-4" aria-hidden />
        <p className="bg-gradient-to-r from-purple-300 via-pink-300 to-fuchsia-300 bg-clip-text text-sm font-bold tracking-wide text-transparent animate-pulse">
          {t("chat.launchOverlay")}
        </p>
        <p className="mt-2 text-xs text-zinc-500">{t("chat.launchOverlayHint")}</p>
      </div>
    </div>
  );
}
