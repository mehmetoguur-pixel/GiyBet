"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { formatLocationLabel } from "@/lib/feed/format";
import { REACTION_BUTTONS } from "@/lib/feed/rank";
import type { FeedPost } from "@/lib/giybet/types";
import { useI18n } from "@/lib/i18n/provider";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { RankBadge } from "@/components/feed/RankBadge";

export function ProfileGossipDetailModal({
  post,
  authorReactionScores,
  onClose,
}: {
  post: FeedPost;
  authorReactionScores?: Record<string, number>;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const location = formatLocationLabel(post);
  const totalReactions =
    post.reactions.fire + post.reactions.shock + post.reactions.secret;

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-purple-500/45 bg-[#12121a] shadow-[0_0_60px_rgba(168,85,247,0.45)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-gossip-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-purple-500/25 bg-purple-950/20 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 id="profile-gossip-detail-title" className="text-sm font-bold text-pink-200">
              {t("profile.gossipDetailTitle")}
            </h2>
            <p className="mt-0.5 text-[10px] text-zinc-500">{post.time}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-all hover:border-pink-500/50 hover:text-pink-300"
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4">
          <div className="mb-3 flex items-center gap-2.5">
            <AvatarImage config={post.avatar} className="h-10 w-10" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-medium text-zinc-300">@{post.author}</p>
                {authorReactionScores && (
                  <RankBadge score={authorReactionScores[post.author] ?? 0} compact />
                )}
              </div>
              {location && (
                <p className="mt-0.5 text-[10px] font-medium text-pink-300/90">📍 {location}</p>
              )}
            </div>
          </div>

          {post.text && (
            <p className="text-sm leading-relaxed text-zinc-300">{post.text}</p>
          )}

          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={t("common.gossipPhoto")}
              className="mt-3 max-h-56 w-full rounded-xl border border-purple-500/40 object-cover shadow-[0_0_14px_rgba(168,85,247,0.25)]"
            />
          )}

          {post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-purple-500/25 bg-purple-950/30 px-1.5 py-0.5 text-[10px] text-purple-300/90"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-800/60 pt-3 text-xs text-zinc-500">
            <span className="text-pink-300">
              ♥ {post.likers.length}
            </span>
            <span>💬 {post.commentItems.length}</span>
            {totalReactions > 0 && (
              <span className="flex flex-wrap gap-1">
                {REACTION_BUTTONS.map(({ key, emoji }) =>
                  post.reactions[key] > 0 ? (
                    <span key={key} className="text-zinc-400">
                      {emoji} {post.reactions[key]}
                    </span>
                  ) : null,
                )}
              </span>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-purple-500/20 bg-zinc-900/40 p-3">
            <p className="mb-3 text-xs font-semibold text-purple-300">
              💬 {t("comment.count", { count: post.commentItems.length })}
            </p>

            {post.commentItems.length > 0 ? (
              <ul className="flex max-h-52 flex-col gap-2 overflow-y-auto">
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
                        <span className="text-xs font-semibold text-purple-300">
                          @{comment.author}
                        </span>
                        {authorReactionScores && (
                          <RankBadge
                            score={authorReactionScores[comment.author] ?? 0}
                            compact
                          />
                        )}
                      </div>
                      {comment.text && (
                        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                          {comment.text}
                        </p>
                      )}
                      {comment.imageUrl && (
                        <img
                          src={comment.imageUrl}
                          alt={t("common.gossipEvidence")}
                          className="mt-2 max-h-36 w-full rounded-xl border border-purple-500/40 object-cover"
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

        <div className="border-t border-zinc-800/80 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-zinc-700 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:border-pink-500/40 hover:text-pink-200"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
