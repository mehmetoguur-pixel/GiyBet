"use client";

import { useState } from "react";
import { authInputNeonClass } from "@/lib/auth-utils";
import { useI18n } from "@/lib/i18n/provider";
import { NeonToast } from "@/components/ui/NeonToast";

export function BanAppealModal({
  open,
  username,
  onClose,
}: {
  open: boolean;
  username: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; variant: "success" | "error" } | null>(
    null,
  );

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setFeedback({ text: t("banAppeal.tooShort"), variant: "error" });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/ban-appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, message: trimmed }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFeedback({
          text:
            body.error === "already_pending"
              ? t("banAppeal.alreadyPending")
              : t("banAppeal.failed"),
          variant: "error",
        });
        return;
      }
      setFeedback({ text: t("banAppeal.success"), variant: "success" });
      setMessage("");
      window.setTimeout(onClose, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10070] flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      {feedback && <NeonToast message={feedback.text} variant={feedback.variant} />}
      <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[#12121a] p-6 shadow-[0_0_40px_rgba(239,68,68,0.25)]">
        <h2 className="text-lg font-bold text-red-300">{t("banAppeal.title")}</h2>
        <p className="mt-2 text-sm text-zinc-400">{t("banAppeal.body")}</p>
        {username && (
          <p className="mt-1 text-xs text-zinc-500">@{username}</p>
        )}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={t("banAppeal.placeholder")}
            className={`${authInputNeonClass} resize-none`}
            disabled={loading}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:border-red-400/60 disabled:opacity-50"
            >
              {loading ? "…" : t("banAppeal.submit")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200"
            >
              {t("common.close")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
