import Link from "next/link";
import type { ReactNode } from "react";

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 text-zinc-300">
      <Link href="/" className="text-sm text-purple-300 hover:text-pink-300">
        ← GıyBet
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-pink-200">{title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-400">{children}</div>
    </div>
  );
}
