"use client";

import { useEffect, useState } from "react";
import { formatReactionScore, getRankFromScore, getRankTitle } from "@/lib/feed/rank";
import { formatLocationLabel } from "@/lib/feed/format";
import type { AvatarCreatorConfig, FeedPost } from "@/lib/giybet/types";
import { useI18n } from "@/lib/i18n/provider";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { FaceStudioPanel } from "@/components/profile/FaceStudioPanel";
import { ProfileGossipDetailModal } from "@/components/profile/ProfileGossipDetailModal";
import { ProfileSettingsPanel } from "@/components/profile/ProfileSettingsPanel";

export function ProfilePanel({
  open,
  onClose,
  nickname,
  avatar,
  postCount,
  followers,
  following,
  totalReactionScore,
  userPosts,
  editingAvatar,
  onStartEdit,
  onCancelEdit,
  onSaveAvatar,
  onDraftChange,
  onLogout,
  btnPrimary,
  btnSecondary,
  authorReactionScores,
  blockedAuthors,
  blockedAuthorsLoading,
  onUnblockUser,
  onRefreshBlockedList,
}: {
  open: boolean;
  onClose: () => void;
  nickname: string;
  avatar: AvatarCreatorConfig;
  postCount: number;
  followers: number;
  following: number;
  totalReactionScore: number;
  userPosts: FeedPost[];
  editingAvatar: AvatarCreatorConfig | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveAvatar: () => void;
  onDraftChange: (patch: Partial<AvatarCreatorConfig>) => void;
  onLogout: () => void;
  btnPrimary: string;
  btnSecondary: string;
  authorReactionScores?: Record<string, number>;
  blockedAuthors?: Set<string>;
  blockedAuthorsLoading?: boolean;
  onUnblockUser?: (author: string) => Promise<boolean> | boolean;
  onRefreshBlockedList?: () => void;
}) {
  const { t } = useI18n();
  const [profileTab, setProfileTab] = useState<"overview" | "history" | "settings">("overview");
  const [selectedHistoryPost, setSelectedHistoryPost] = useState<FeedPost | null>(null);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setProfileTab("overview");
        setSelectedHistoryPost(null);
      });
    }
  }, [open]);

  useEffect(() => {
    if (open && profileTab === "settings") {
      onRefreshBlockedList?.();
    }
  }, [open, profileTab, onRefreshBlockedList]);

  if (!open) return null;

  const studioConfig = editingAvatar ?? avatar;

  const statBox =
    "flex flex-1 flex-col items-center rounded-xl border border-purple-500/30 bg-purple-950/25 px-3 py-3 shadow-[0_0_12px_rgba(168,85,247,0.15)]";

  const tabClass = (active: boolean) =>
    `flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
      active
        ? "bg-gradient-to-r from-purple-600/50 to-pink-600/50 text-pink-100 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
        : "border border-zinc-800 text-zinc-500 hover:text-purple-300"
    }`;

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
        aria-labelledby="profile-panel-title"
      >
        <div
          className="pointer-events-auto relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-purple-500/45 bg-[#12121a] shadow-[0_0_60px_rgba(168,85,247,0.4)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-all hover:border-pink-500/50 hover:text-pink-300"
            aria-label={t("common.close")}
          >
            ✕
          </button>

          <div className="overflow-y-auto p-6">
            {editingAvatar ? (
              <>
                <h2 className="mb-1 pr-10 text-lg font-semibold text-zinc-100">
                  {t("profile.wardrobeTitle")}
                </h2>
                <p className="mb-4 text-sm text-zinc-500">{t("profile.wardrobeSubtitle")}</p>
                <FaceStudioPanel config={studioConfig} onChange={onDraftChange} />
                <button type="button" onClick={onSaveAvatar} className={`${btnPrimary} mt-5`}>
                  {t("common.save")}
                </button>
                <button type="button" onClick={onCancelEdit} className={`${btnSecondary} mt-3`}>
                  {t("common.cancel")}
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center">
                  <AvatarImage
                    config={avatar}
                    className="h-24 w-24 border-2 border-purple-500/50 shadow-[0_0_32px_rgba(236,72,153,0.35)]"
                  />
                  <h2
                    id="profile-panel-title"
                    className="mt-4 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-xl font-bold text-transparent"
                  >
                    {t("profile.title")}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-purple-200">@{nickname}</p>
                </div>

                <div className="mt-5 flex gap-3">
                  <div className={statBox}>
                    <span className="text-lg font-bold text-pink-300">{followers}</span>
                    <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">
                      {t("profile.statsFollowers")}
                    </span>
                  </div>
                  <div className={statBox}>
                    <span className="text-lg font-bold text-purple-300">{following}</span>
                    <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">
                      {t("profile.statsFollowing")}
                    </span>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-pink-500/35 bg-gradient-to-r from-pink-950/40 to-purple-950/40 px-4 py-3 text-center shadow-[0_0_16px_rgba(236,72,153,0.2)]">
                  <p className="text-sm font-bold text-pink-200">
                    {t("profile.reactionScore", { score: formatReactionScore(totalReactionScore) })}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    {t("profile.postCountScore", { count: postCount })}
                  </p>
                </div>

                {(() => {
                  const rank = getRankFromScore(totalReactionScore);
                  const rankTitle = getRankTitle(totalReactionScore, t);
                  return (
                    <div
                      className={`mt-3 rounded-xl border px-4 py-3 text-center text-sm font-bold ${rank.panelClass}`}
                    >
                      {rank.emoji} {rankTitle}
                    </div>
                  );
                })()}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setProfileTab("overview")}
                    className={tabClass(profileTab === "overview")}
                  >
                    {t("profile.overview")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileTab("history")}
                    className={tabClass(profileTab === "history")}
                  >
                    {t("profile.historyGossips")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileTab("settings")}
                    className={tabClass(profileTab === "settings")}
                  >
                    {t("profile.settings")}
                  </button>
                </div>

                {profileTab === "overview" && (
                  <button type="button" onClick={onStartEdit} className={`${btnPrimary} mt-4`}>
                    {t("profile.editAvatar")}
                  </button>
                )}

                {profileTab === "history" && (
                  <div className="mt-4 flex max-h-52 flex-col gap-2 overflow-y-auto">
                    {userPosts.length === 0 ? (
                      <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-6 text-center text-xs text-zinc-500">
                        {t("profile.noGossips")}
                      </p>
                    ) : (
                      userPosts.map((post) => (
                        <button
                          key={post.gossipId ?? String(post.id)}
                          type="button"
                          onClick={() => setSelectedHistoryPost(post)}
                          className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-3 py-2.5 text-left transition-all hover:border-purple-500/35 hover:bg-zinc-900/80 active:scale-[0.99]"
                        >
                          {formatLocationLabel(post) && (
                            <p className="mb-1 text-[10px] font-medium text-pink-300/80">
                              📍 {formatLocationLabel(post)}
                            </p>
                          )}
                          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-300">
                            {post.text || (post.imageUrl ? t("common.photo") : "")}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-zinc-600">
                            <span>{post.time}</span>
                            <span>♥ {post.likers.length}</span>
                            <span>💬 {post.commentItems.length}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {profileTab === "settings" && (
                  <ProfileSettingsPanel
                    nickname={nickname}
                    btnPrimary={btnPrimary}
                    blockedAuthors={blockedAuthors ?? new Set()}
                    blockedAuthorsLoading={blockedAuthorsLoading ?? false}
                    onUnblockUser={onUnblockUser}
                    onLogout={onLogout}
                  />
                )}

                <button type="button" onClick={onClose} className={`${btnSecondary} mt-4`}>
                  {t("common.close")}
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-3 w-full rounded-xl border border-red-500/50 bg-red-950/30 py-3.5 text-sm font-semibold text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.25)] transition-all hover:border-red-400/70 hover:bg-red-950/50 hover:text-red-200 active:scale-[0.98]"
                >
                  🚪 {t("common.logout")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {selectedHistoryPost && (
        <ProfileGossipDetailModal
          post={selectedHistoryPost}
          authorReactionScores={authorReactionScores}
          onClose={() => setSelectedHistoryPost(null)}
        />
      )}
    </>
  );
}
