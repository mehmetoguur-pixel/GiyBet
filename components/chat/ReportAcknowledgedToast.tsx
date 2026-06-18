"use client";

import { useI18n } from "@/lib/i18n/provider";

export function ReportAcknowledgedToast() {
  const { t } = useI18n();
  return (
    <div
      role="status"
      className="animate-gossip-flash fixed top-20 left-1/2 z-[10051] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-red-500/60 bg-gradient-to-r from-red-950/90 via-purple-950/90 to-red-950/90 px-4 py-3 text-center text-xs font-bold text-red-200 shadow-[0_0_32px_rgba(239,68,68,0.45)]"
    >
      {t("report.acknowledged")}
    </div>
  );
}
