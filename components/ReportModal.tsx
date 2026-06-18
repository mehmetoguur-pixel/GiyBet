"use client";

import type { ReportReason } from "@/lib/moderation";
import { useI18n } from "@/lib/i18n/provider";

const REASONS: ReportReason[] = ["spam", "harassment", "inappropriate", "other"];

export function ReportModal({
  open,
  author,
  onClose,
  onSubmit,
}: {
  open: boolean;
  author: string;
  onClose: () => void;
  onSubmit: (reason: ReportReason) => void;
}) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-red-500/40 bg-[#12121a] p-5 shadow-[0_0_32px_rgba(239,68,68,0.25)]">
        <h2 className="text-lg font-bold text-red-200">{t("report.modalTitle")}</h2>
        <p className="mt-2 text-sm text-zinc-400">
          @{author} — {t("report.modalHint")}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => onSubmit(reason)}
              className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-red-500/50 hover:text-red-200"
            >
              {t(`report.reason.${reason}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-zinc-700 py-2 text-sm text-zinc-500"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
