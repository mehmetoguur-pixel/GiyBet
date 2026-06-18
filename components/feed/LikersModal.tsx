"use client";

import { useI18n } from "@/lib/i18n/provider";

export function LikersModal({
  likers,
  currentUser,
  onClose,
}: {
  likers: string[];
  currentUser: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center px-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="likers-title"
      >
      <div
        className="pointer-events-auto relative w-full max-w-sm rounded-2xl border border-purple-500/40 bg-[#12121a] p-6 shadow-[0_0_60px_rgba(168,85,247,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-all hover:border-pink-500/50 hover:text-pink-300"
          aria-label={t("common.close")}
        >
          ✕
        </button>
        <h2
          id="likers-title"
          className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text pr-8 text-lg font-bold text-transparent"
        >
          {t("likers.modalTitle")}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">{t("likers.likedCount", { count: likers.length })}</p>
        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {likers.length === 0 ? (
            <li className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500">
              {t("likers.emptyModal")}
            </li>
          ) : (
            likers.map((name) => (
              <li
                key={name}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                  name === currentUser
                    ? "border-pink-500/40 bg-pink-950/25 shadow-[0_0_12px_rgba(236,72,153,0.15)]"
                    : "border-zinc-800/60 bg-zinc-900/50"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                    name === currentUser
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                      : "border border-purple-500/30 bg-purple-950/40 text-purple-300"
                  }`}
                >
                  {name === currentUser ? "★" : "♥"}
                </span>
                <span
                  className={`truncate text-sm font-medium ${
                    name === currentUser ? "text-pink-300" : "text-purple-200"
                  }`}
                >
                  @{name}
                  {name === currentUser && (
                    <span className="ml-1.5 text-xs font-normal text-pink-400/80">(sen)</span>
                  )}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
      </div>
    </>
  );
}
