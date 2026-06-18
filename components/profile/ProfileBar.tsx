"use client";

import type { AvatarCreatorConfig } from "@/lib/giybet/types";
import { useI18n } from "@/lib/i18n/provider";
import { AvatarImage } from "@/components/ui/AvatarImage";

export function ProfileBar({ nickname, avatar }: { nickname: string; avatar: AvatarCreatorConfig }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-purple-500/25 bg-[#12121a]/90 px-4 py-3 shadow-[0_0_24px_rgba(168,85,247,0.12)]">
      <AvatarImage config={avatar} className="h-12 w-12" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-purple-200">@{nickname}</p>
        <p className="text-xs text-zinc-500">{t("profileBar.subtitle")}</p>
      </div>
      <span className="rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 px-2.5 py-1 text-[10px] font-medium tracking-wide text-pink-300 uppercase">
        {t("profileBar.active")}
      </span>
    </div>
  );
}
