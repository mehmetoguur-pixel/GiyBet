"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";

const ONBOARDING_KEY = "giybet_onboarding_done";

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function markOnboardingDone(): void {
  localStorage.setItem(ONBOARDING_KEY, "1");
}

export function OnboardingTour({
  onComplete,
  btnPrimary,
}: {
  onComplete: () => void;
  btnPrimary: string;
}) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: "📍",
      title: t("onboarding.step1Title"),
      body: t("onboarding.step1Body"),
    },
    {
      icon: "💬",
      title: t("onboarding.step2Title"),
      body: t("onboarding.step2Body"),
    },
    {
      icon: "👥",
      title: t("onboarding.step3Title"),
      body: t("onboarding.step3Body"),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      markOnboardingDone();
      onComplete();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div
      className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-purple-500/40 bg-[#12121a] p-6 text-center shadow-[0_0_60px_rgba(168,85,247,0.35)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600/50 to-pink-600/50 text-2xl">
          {current.icon}
        </div>
        <h2 className="text-lg font-bold text-pink-200">{current.title}</h2>
        <p className="mt-3 text-sm text-zinc-400">{current.body}</p>
        <div className="mt-4 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === step ? "bg-pink-400" : "bg-zinc-700"
              }`}
            />
          ))}
        </div>
        <button type="button" onClick={handleNext} className={`${btnPrimary} mt-6 w-full`}>
          {isLast ? t("onboarding.finish") : t("onboarding.next")}
        </button>
        {!isLast && (
          <button
            type="button"
            onClick={() => {
              markOnboardingDone();
              onComplete();
            }}
            className="mt-3 text-xs text-zinc-500 hover:text-zinc-300"
          >
            {t("onboarding.skip")}
          </button>
        )}
      </div>
    </div>
  );
}
