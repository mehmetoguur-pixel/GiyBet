"use client";

import { buildAvatarSrc } from "@/lib/avatar";
import type { AvatarCreatorConfig } from "@/lib/giybet/types";
import { useI18n } from "@/lib/i18n/provider";

export function AvatarImage({
  config,
  className = "h-10 w-10",
  alt,
}: {
  config: AvatarCreatorConfig;
  className?: string;
  alt?: string;
}) {
  const { t } = useI18n();
  const src = buildAvatarSrc(config);
  const imageAlt = alt ?? t("avatarStudio.avatarAlt");

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-purple-500/35 bg-[#12121a] shadow-[0_0_12px_rgba(168,85,247,0.2)] ${className}`}
    >
      <img
        src={src}
        alt={imageAlt}
        className="h-full w-full scale-[1.08] object-contain object-center"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
