"use client";

import { useState } from "react";
import {
  ACCESSORIES_OPTIONS,
  EYEBROWS_OPTIONS,
  EYES_OPTIONS,
  FACIAL_HAIR_OPTIONS,
  FEMALE_HAIR_OPTIONS,
  MALE_HAIR_OPTIONS,
  MOUTH_OPTIONS,
  SKIN_COLOR_OPTIONS,
  TOP_COLOR_OPTIONS,
  localizedOpt,
} from "@/lib/avatar/constants";
import type { AvatarCreatorConfig, FaceStudioTab, Gender } from "@/lib/giybet/types";
import { useI18n } from "@/lib/i18n/provider";
import { AvatarImage } from "@/components/ui/AvatarImage";

export function FaceStudioPanel({
  config,
  onChange,
}: {
  config: AvatarCreatorConfig;
  onChange: (patch: Partial<AvatarCreatorConfig>) => void;
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<FaceStudioTab>("skin");

  const tabs: { id: FaceStudioTab; label: string }[] = [
    { id: "skin", label: t("avatarStudio.tabSkin") },
    { id: "hair", label: t("avatarStudio.tabHair") },
    { id: "eyes", label: t("avatarStudio.tabEyes") },
    { id: "expression", label: t("avatarStudio.tabExpression") },
  ];

  const optionBtn = (active: boolean) =>
    `rounded-xl border px-3 py-2.5 text-xs font-medium transition-all active:scale-95 ${
      active
        ? "border-pink-400/80 bg-gradient-to-br from-purple-950/70 to-pink-950/50 text-pink-100 shadow-[0_0_22px_rgba(236,72,153,0.55)] ring-1 ring-pink-500/50"
        : "border-zinc-700/80 bg-zinc-900/60 text-zinc-400 hover:border-purple-500/40 hover:text-purple-200"
    }`;

  const colorSwatch = (active: boolean) =>
    `flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all active:scale-95 ${
      active
        ? "border-pink-400/80 bg-purple-950/50 shadow-[0_0_18px_rgba(236,72,153,0.45)] ring-1 ring-pink-500/40"
        : "border-zinc-700/80 hover:border-purple-500/40"
    }`;

  const genderBtn = (active: boolean) =>
    `flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-all active:scale-95 ${
      active
        ? "border-pink-400/80 bg-gradient-to-r from-purple-600/60 to-pink-600/60 text-pink-100 shadow-[0_0_28px_rgba(236,72,153,0.55)] ring-1 ring-pink-500/50"
        : "border-zinc-700/80 bg-zinc-900/60 text-zinc-400 hover:border-purple-500/40 hover:text-purple-200"
    }`;

  const hairOptions = config.gender === "erkek" ? MALE_HAIR_OPTIONS : FEMALE_HAIR_OPTIONS;
  const activeHair = config.gender === "erkek" ? config.maleHair : config.femaleHair;

  const setGender = (gender: Gender) => {
    onChange({
      gender,
      ...(gender === "kadin" ? { facialHair: "none" } : {}),
    });
  };

  const setHair = (hairId: string) => {
    onChange(config.gender === "erkek" ? { maleHair: hairId } : { femaleHair: hairId });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="relative flex flex-col items-center rounded-2xl border border-purple-500/30 bg-[#12121a] px-6 py-8 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10" />
        <p className="relative mb-4 text-xs font-medium tracking-widest text-purple-300/80 uppercase">
          {t("avatarStudio.preview")}
        </p>
        <AvatarImage config={config} className="relative h-44 w-44 border-2 border-purple-500/50 shadow-[0_0_32px_rgba(236,72,153,0.35)]" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-xl px-3 py-2.5 text-[11px] font-semibold whitespace-nowrap transition-all sm:text-xs ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-purple-600/40 to-pink-600/40 text-pink-200 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                : "border border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-purple-500/30 hover:text-purple-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "skin" && (
        <div className="flex flex-col gap-4">
          <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase">{t("avatarStudio.genderSelect")}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGender("erkek")}
              className={genderBtn(config.gender === "erkek")}
            >
              {t("avatarStudio.male")}
            </button>
            <button
              type="button"
              onClick={() => setGender("kadin")}
              className={genderBtn(config.gender === "kadin")}
            >
              {t("avatarStudio.female")}
            </button>
          </div>
          <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase">{t("avatarStudio.skinTone")}</p>
          <div className="grid grid-cols-5 gap-2">
            {SKIN_COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ skinColor: opt.id })}
                className={colorSwatch(config.skinColor === opt.id)}
                title={localizedOpt(t, "skin", opt.id, opt.label)}
              >
                <span
                  className="h-8 w-8 rounded-full border border-zinc-600/80"
                  style={{ backgroundColor: `#${opt.id}` }}
                />
                <span className="text-[9px] text-zinc-500">
                  {localizedOpt(t, "skin", opt.id, opt.label)}
                </span>
              </button>
            ))}
          </div>
          {config.gender === "erkek" && (
            <>
              <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase">{t("avatarStudio.beard")}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FACIAL_HAIR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ facialHair: opt.id })}
                    className={optionBtn(config.facialHair === opt.id)}
                  >
                    {localizedOpt(t, "facialHair", opt.id, opt.label)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "hair" && (
        <div className="flex flex-col gap-4">
          <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase">
            {config.gender === "erkek" ? t("avatarStudio.hairMaleTitle") : t("avatarStudio.hairFemaleTitle")}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {hairOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setHair(opt.id)}
                className={optionBtn(activeHair === opt.id)}
              >
                {localizedOpt(
                  t,
                  config.gender === "erkek" ? "hairMale" : "hairFemale",
                  opt.id,
                  opt.label,
                )}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase">{t("avatarStudio.hairColor")}</p>
          <div className="grid grid-cols-5 gap-2">
            {TOP_COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ topColor: opt.id })}
                className={colorSwatch(config.topColor === opt.id)}
              >
                <span
                  className="h-6 w-6 rounded-full border border-zinc-600"
                  style={{ backgroundColor: `#${opt.hex}` }}
                />
                <span className="text-[9px] text-zinc-500">
                  {localizedOpt(t, "hairColor", opt.id, opt.label)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === "eyes" && (
        <div className="flex flex-col gap-4">
          <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase">{t("avatarStudio.eyeShape")}</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
            {EYES_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ eyes: opt.id })}
                className={optionBtn(config.eyes === opt.id)}
              >
                {localizedOpt(t, "eyes", opt.id, opt.label)}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase">{t("avatarStudio.eyebrows")}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {EYEBROWS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ eyebrows: opt.id })}
                className={optionBtn(config.eyebrows === opt.id)}
              >
                {localizedOpt(t, "eyebrows", opt.id, opt.label)}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === "expression" && (
        <div className="flex flex-col gap-4">
          <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase">{t("avatarStudio.mouth")}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MOUTH_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ mouth: opt.id })}
                className={optionBtn(config.mouth === opt.id)}
              >
                {localizedOpt(t, "mouth", opt.id, opt.label)}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase">{t("avatarStudio.accessories")}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {ACCESSORIES_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ accessories: opt.id })}
                className={optionBtn(config.accessories === opt.id)}
              >
                {localizedOpt(t, "accessories", opt.id, opt.label)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
