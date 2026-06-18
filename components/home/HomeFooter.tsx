"use client";

import Link from "next/link";

type HomeFooterProps = {
  t: (key: string) => string;
};

export function HomeFooter({ t }: HomeFooterProps) {
  return (
    <footer className="sticky bottom-0 z-10 flex h-10 w-full items-center justify-between gap-2 border-t border-zinc-800/80 bg-[#0c0c14]/95 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3 text-[10px] text-zinc-600">
        <Link href="/privacy" className="hover:text-purple-300">{t("common.legalPrivacy")}</Link>
        <Link href="/terms" className="hover:text-purple-300">{t("common.legalTerms")}</Link>
        <Link href="/admin/moderation" className="hover:text-purple-300">{t("common.moderation")}</Link>
      </div>
      <span className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase">
        {t("common.adBanner")}
      </span>
    </footer>
  );
}
