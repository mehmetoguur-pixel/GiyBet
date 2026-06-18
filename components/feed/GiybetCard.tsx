"use client";

import { useState } from "react";
import { formatDistance, formatLocationLabel } from "@/lib/feed/format";
import { REACTION_BUTTONS } from "@/lib/feed/rank";
import { gossipChatLabel, resolvePostGossipKey } from "@/lib/rooms/chat-utils";
import type { AvatarCreatorConfig, FeedPost, ReactionKey } from "@/lib/giybet/types";
import { useI18n } from "@/lib/i18n/provider";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { RankBadge } from "@/components/feed/RankBadge";

export function GiybetCard({
  post,
  currentUserId,
  currentNickname,
  currentUserAvatar,
  authorReactionScores,
  onToggleLike,
  onToggleReaction,
  onAddComment,
  onShowLikers,
  onOpenGossipChat,
  onOpenReport,
  onBlockUser,
  onDeleteGossip,
  onTagClick,
}: {
  post: FeedPost;
  currentUserId?: string;
  currentNickname: string;
  currentUserAvatar: AvatarCreatorConfig;
  authorReactionScores: Record<string, number>;
  onToggleLike: (postId: number) => void;
  onToggleReaction: (postId: number, reaction: ReactionKey) => void;
  onAddComment: (postId: number, text: string) => void;
  onShowLikers: (postId: number) => void;
  onOpenGossipChat: (gossipId: string, label: string) => void;
  onOpenReport: (postId: number) => void;
  onBlockUser?: (author: string) => void;
  onDeleteGossip?: (postId: number) => void;
  onTagClick?: (tag: string) => void;
}) {
  const { t } = useI18n();
  const [showComments, setShowComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const isOwner =
    (currentUserId && post.ownerUserId === currentUserId) ||
    post.author === currentNickname.trim();

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentDraft.trim();
    if (!trimmed) return;
    onAddComment(post.id, trimmed);
    setCommentDraft("");
    setShowComments(true);
  };

  const reactionBtnClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
      active
        ? "border-pink-400/70 bg-pink-950/40 text-pink-200 shadow-[0_0_14px_rgba(236,72,153,0.4)]"
        : "border-zinc-700/80 bg-zinc-900/60 text-zinc-400 hover:border-purple-500/40 hover:text-purple-200"
    }`;

  return (
    <article className="relative rounded-2xl border border-zinc-800/80 bg-[#12121a]/80 p-4 transition-colors hover:border-purple-500/25">
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        {isOwner && onDeleteGossip && (
          <button
            type="button"
            onClick={() => onDeleteGossip(post.id)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/80 text-xs hover:border-red-500/50"
            aria-label={t("common.deleteGossip")}
            title={t("common.deleteGossip")}
          >
            🗑
          </button>
        )}
        {!isOwner && (
          <button
            type="button"
            onClick={() => {
              setShowActionsMenu(false);
              onOpenReport(post.id);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-red-500/55 bg-red-950/50 text-xs shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all hover:border-red-400/70 hover:bg-red-950/70 active:scale-95"
            aria-label={t("common.report")}
            title={t("common.report")}
          >
            🚨
          </button>
        )}
        {!isOwner && onBlockUser && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowActionsMenu((open) => !open)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/80 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              aria-label={t("common.moreActions")}
              title={t("common.moreActions")}
            >
              ⋯
            </button>
            {showActionsMenu && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-[1] cursor-default"
                  aria-label={t("common.close")}
                  onClick={() => setShowActionsMenu(false)}
                />
                <div className="absolute right-0 top-8 z-[2] min-w-[9rem] rounded-xl border border-zinc-700 bg-[#12121a] py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      onBlockUser(post.author);
                    }}
                    className="block w-full px-3 py-2 text-left text-xs text-orange-300 hover:bg-zinc-900/80"
                  >
                    🚫 {t("common.blockUser")}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {post.distanceMeters != null && (
          <span className="inline-flex rounded-full border border-emerald-500/35 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            📡 {formatDistance(post.distanceMeters)}
          </span>
        )}
      </div>
      {(formatLocationLabel(post) || resolvePostGossipKey(post)) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {formatLocationLabel(post) && (
            <span className="inline-flex rounded-full border border-pink-500/45 bg-pink-950/40 px-2.5 py-1 text-[10px] font-semibold text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.3)]">
              📍 {formatLocationLabel(post)}
            </span>
          )}
          {resolvePostGossipKey(post) && (
            <button
              type="button"
              onClick={() =>
                onOpenGossipChat(resolvePostGossipKey(post)!, gossipChatLabel(post.text))
              }
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/45 bg-emerald-950/35 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all hover:border-emerald-400/60 hover:text-emerald-200 active:scale-95"
            >
              {t("chat.roomButton")}
            </button>
          )}
        </div>
      )}
      <div className="mb-3 flex items-center gap-2.5">
        <AvatarImage config={post.avatar} className="h-9 w-9" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-medium text-zinc-300">@{post.author}</p>
            <RankBadge score={authorReactionScores[post.author] ?? 0} />
          </div>
          <p className="text-[11px] text-zinc-600">{post.time}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-zinc-300">{post.text}</p>
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={t("common.gossipPhoto")}
          loading="lazy"
          decoding="async"
          className="mt-3 max-h-72 w-full rounded-xl border border-purple-500/40 object-cover shadow-[0_0_14px_rgba(168,85,247,0.25)]"
        />
      )}
      {post.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick?.(tag)}
              className="rounded-md border border-purple-500/25 bg-purple-950/30 px-1.5 py-0.5 text-[10px] text-purple-300/90 transition hover:border-pink-500/45 hover:text-pink-200 active:scale-95"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center gap-5 border-t border-zinc-800/60 pt-3">
        <div
          className={`flex items-center gap-1.5 text-xs ${
            post.liked ? "text-pink-400" : "text-zinc-500"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              onToggleLike(post.id);
              onShowLikers(post.id);
            }}
            className={`transition-all active:scale-95 ${
              post.liked
                ? "drop-shadow-[0_0_8px_rgba(236,72,153,0.6)] hover:text-pink-300"
                : "hover:text-pink-400"
            }`}
            aria-pressed={post.liked}
            aria-label={post.liked ? t("common.unlike") : t("common.like")}
          >
            <span
              aria-hidden="true"
              className={`text-base transition-all ${
                post.liked
                  ? "scale-110 text-pink-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                  : ""
              }`}
            >
              {post.liked ? "♥" : "♡"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onShowLikers(post.id)}
            className="font-medium transition-all hover:text-pink-300 active:scale-95"
            aria-label={t("reactions.showLikers")}
          >
            {post.likers.length}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowComments((prev) => !prev)}
          className={`flex items-center gap-1.5 text-xs transition-all active:scale-95 ${
            showComments
              ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
              : "text-zinc-500 hover:text-purple-400"
          }`}
          aria-expanded={showComments}
        >
          <span aria-hidden="true">💬</span>
          <span>{t("comment.count", { count: post.commentItems.length })}</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-800/60 pt-3">
        {REACTION_BUTTONS.map(({ key, emoji, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onToggleReaction(post.id, key)}
            className={reactionBtnClass(post.userReaction === key)}
            aria-label={label}
            aria-pressed={post.userReaction === key}
          >
            <span className="text-base">{emoji}</span>
            <span>{post.reactions[key]}</span>
          </button>
        ))}
      </div>

      <div
        className={`grid transition-all duration-300 ease-out ${
          showComments ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-xl border border-purple-500/20 bg-zinc-900/40 p-3">
            <form onSubmit={handleSubmitComment} className="mb-3 flex gap-2">
              <AvatarImage config={currentUserAvatar} className="h-8 w-8 shrink-0" />
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
              <ul className="flex flex-col gap-2">
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
                          className="mt-2 max-h-44 w-full rounded-xl border border-purple-500/40 object-cover shadow-[0_0_14px_rgba(168,85,247,0.25)]"
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
    </article>
  );
}
