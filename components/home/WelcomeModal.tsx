"use client";

type WelcomeModalProps = {
  nickname: string;
  btnPrimary: string;
  onEnter: () => void;
  t: (key: string) => string;
};

export function WelcomeModal({ nickname, btnPrimary, onEnter, t }: WelcomeModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-purple-500/40 bg-[#12121a] p-8 text-center shadow-[0_0_60px_rgba(168,85,247,0.35)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-2xl shadow-[0_0_24px_rgba(236,72,153,0.5)]">
          ✦
        </div>
        <h2
          id="welcome-title"
          className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-xl font-bold text-transparent"
        >
          {t("auth.welcomeTitle")}
        </h2>
        <p className="mt-3 text-sm text-zinc-400">{t("auth.welcomeBody")}</p>
        {nickname && <p className="mt-2 font-semibold text-purple-300">@{nickname}</p>}
        <button type="button" onClick={onEnter} className={`${btnPrimary} mt-6`}>
          {t("auth.startGossip")}
        </button>
      </div>
    </div>
  );
}
