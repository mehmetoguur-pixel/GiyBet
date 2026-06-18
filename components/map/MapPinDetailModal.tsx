"use client";

import { useState } from "react";
import type { AvatarCreatorConfig, FeedPost, MapPin } from "@/lib/giybet/types";
import { useI18n } from "@/lib/i18n/provider";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { RankBadge } from "@/components/feed/RankBadge";

export function MapPinDetailModal({
  pin,
  post,
  nickname: _nickname,
  avatar,
  authorReactionScores,
  onAddComment,
  onClose,
  onReport,
}: {
  pin: MapPin;
  post: FeedPost;
  nickname: string;
  avatar: AvatarCreatorConfig;
  authorReactionScores: Record<string, number>;
  onAddComment: (postId: number, text: string) => void;
  onClose: () => void;
  onReport: (postId: number) => void;
}) {
  const { t } = useI18n();
  const [commentDraft, setCommentDraft] = useState("");

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentDraft.trim();
    if (!trimmed) return;
    onAddComment(post.id, trimmed);
    setCommentDraft("");
  };

  const authorScore = authorReactionScores[post.author] ?? 0;

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-[9999] flex items-end justify-center px-4 pb-6 pt-16 sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-pin-detail-title"
      >
        <div
          className="pointer-events-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-purple-500/45 bg-[#12121a] shadow-[0_0_60px_rgba(168,85,247,0.4)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-purple-500/25 bg-purple-950/20 px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 id="map-pin-detail-title" className="text-sm font-bold text-pink-200">
                {t("map.mapGossipPin")}
              </h2>
              <p className="mt-0.5 truncate text-[10px] text-zinc-500">{pin.location}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => onReport(post.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/55 bg-red-950/40 text-xs shadow-[0_0_12px_rgba(239,68,68,0.35)] transition-all hover:border-red-400/70 hover:text-red-200 active:scale-95"
                aria-label={t("common.report")}
                title={t("common.report")}
              >
                🚨
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:border-pink-500/50 hover:text-pink-300"
                aria-label={t("common.close")}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="overflow-y-auto px-4 py-3">
            <div className="mb-3 flex items-center gap-2.5">
              <AvatarImage config={post.avatar} className="h-9 w-9" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-zinc-300">@{post.author}</p>
                  <RankBadge score={authorScore} />
                </div>
                <p className="text-[11px] text-zinc-600">{post.time}</p>
              </div>
            </div>

            {pin.venue && (
              <span className="mb-2 inline-flex rounded-full border border-pink-500/45 bg-pink-950/40 px-2.5 py-1 text-[10px] font-semibold text-pink-300">
                📍 {pin.venue}
              </span>
            )}

            <p className="text-sm leading-relaxed text-zinc-300">{post.text}</p>
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt={t("common.gossipPhoto")}
                className="mt-3 max-h-56 w-full rounded-xl border border-purple-500/40 object-cover shadow-[0_0_14px_rgba(168,85,247,0.25)]"
              />
            )}

            <div className="mt-4 rounded-xl border border-purple-500/20 bg-zinc-900/40 p-3">
              <p className="mb-3 text-xs font-semibold text-purple-300">
                💬 {t("comment.count", { count: post.commentItems.length })}
              </p>

              <form onSubmit={handleSubmitComment} className="mb-3 flex gap-2">
                <AvatarImage config={avatar} className="h-8 w-8 shrink-0" />
                <input
                  type="text"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder={t("comment.placeholder")}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition-all focus:border-purple-500/60 focus:shadow-[0_0_0_2px_rgba(168,85,247,0.15)]"
                />
                <button
                  type="submit"
                  disabled={!commentDraft.trim()}
                  className="shrink-0 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:from-purple-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                >
                  {t("common.send")}
                </button>
              </form>

              {post.commentItems.length > 0 ? (
                <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                  {post.commentItems.map((comment) => (
                    <li
                      key={comment.id}
                      className="flex gap-2.5 rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-2"
                    >
                      <AvatarImage
                        config={comment.avatar ?? post.avatar}
                        className="h-7 w-7 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold text-purple-300">@{comment.author}</span>
                          <RankBadge score={authorReactionScores[comment.author] ?? 0} compact />
                        </div>
                        {comment.text && (
                          <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{comment.text}</p>
                        )}
                        {comment.imageUrl && (
                          <img
                            src={comment.imageUrl}
                            alt={t("common.gossipEvidence")}
                            className="mt-2 max-h-36 w-full rounded-xl border border-purple-500/40 object-cover shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                          />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-xs text-zinc-600">{t("common.noComments")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
