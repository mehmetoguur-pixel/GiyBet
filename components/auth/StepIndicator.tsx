"use client";

import type { Step } from "@/lib/giybet/types";
import { useI18n } from "@/lib/i18n/provider";

export function StepIndicator({ current }: { current: Step }) {
  const { t } = useI18n();
  const steps = [
    { num: 1 as Step, label: t("steps.contact") },
    { num: 2 as Step, label: t("steps.nickname") },
    { num: 3 as Step, label: t("steps.avatar") },
  ];

  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
              current >= step.num
                ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_0_16px_rgba(168,85,247,0.5)]"
                : "border border-zinc-700 bg-zinc-900 text-zinc-500"
            }`}
          >
            {step.num}
          </div>
          <span
            className={`hidden text-xs font-medium sm:inline ${
              current >= step.num ? "text-purple-300" : "text-zinc-600"
            }`}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`mx-1 h-px w-8 transition-colors duration-300 sm:w-12 ${
                current > step.num ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-zinc-800"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
