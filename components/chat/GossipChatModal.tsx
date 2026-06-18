"use client";

import { useEffect, useRef, useState } from "react";
import type { AvatarCreatorConfig, VenueChatMessage } from "@/lib/giybet/types";
import { useI18n } from "@/lib/i18n/provider";
import { AvatarImage } from "@/components/ui/AvatarImage";

export function GossipChatModal({
  label,
  nickname,
  avatar,
  messages,
  sendError,
  onSend,
  onClose,
  onLeave,
}: {
  label: string;
  nickname: string;
  avatar: AvatarCreatorConfig;
  messages: VenueChatMessage[];
  sendError?: string;
  onSend: (text: string) => void;
  onClose: () => void;
  onLeave: () => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft("");
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gossip-chat-title"
      >
      <div
        className="pointer-events-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-emerald-500/40 bg-[#12121a]/95 shadow-[0_0_48px_rgba(16,185,129,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-emerald-500/25 bg-emerald-950/20 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 id="gossip-chat-title" className="text-sm font-bold text-emerald-200">
              💬 {label}
            </h2>
            <p className="mt-0.5 text-[10px] text-zinc-500">{t("chat.liveChatHint")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onLeave}
              className="rounded-lg border border-red-500/55 bg-red-950/40 px-2.5 py-1.5 text-[10px] font-bold text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-all hover:border-red-400/70 hover:text-red-200 active:scale-95"
            >
              {t("chat.leave")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:border-pink-500/50 hover:text-pink-300"
              aria-label={t("chat.closeWindow")}
            >
              ✕
            </button>
          </div>
        </div>

        {sendError && (
          <p className="border-t border-red-500/30 bg-red-950/30 px-4 py-2 text-[11px] text-red-300">
            ⚠️ {sendError}
          </p>
        )}

        <div ref={listRef} className="flex max-h-72 flex-col gap-2 overflow-y-auto px-4 py-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 rounded-xl border px-3 py-2 ${
                msg.author === nickname
                  ? "border-pink-500/35 bg-pink-950/25"
                  : "border-zinc-800/70 bg-zinc-900/50"
              }`}
            >
              <AvatarImage config={msg.avatar} className="h-7 w-7 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-purple-300">@{msg.author}</span>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-300">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-emerald-500/20 bg-zinc-900/40 p-3">
          <div className="flex gap-2">
            <AvatarImage config={avatar} className="h-8 w-8 shrink-0" />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("chat.liveGossipPlaceholder")}
              className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-emerald-500/50 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.15)]"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="shrink-0 rounded-lg bg-gradient-to-r from-emerald-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:from-emerald-500 hover:to-purple-500 disabled:opacity-40 active:scale-95"
            >
              {t("feed.launch")}
            </button>
          </div>
          <button
            type="button"
            onClick={onLeave}
            className="w-full rounded-lg border border-red-500/50 bg-red-950/30 py-2 text-xs font-semibold text-red-300 shadow-[0_0_16px_rgba(239,68,68,0.2)] transition-all hover:border-red-400/60 hover:text-red-200 active:scale-95"
          >
            {t("chat.leaveRoomGhost")}
          </button>
        </form>
      </div>
      </div>
    </>
  );
}
