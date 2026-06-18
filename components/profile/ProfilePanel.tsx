"use client";

import { useEffect, useRef, useState } from "react";
import {
  authInputNeonClass,
  reauthenticateWithPassword,
  supabaseAuthError,
} from "@/lib/auth-utils";
import { formatReactionScore, getRankFromScore, getRankTitle } from "@/lib/feed/rank";
import { formatLocationLabel } from "@/lib/feed/format";
import type { AvatarCreatorConfig, FeedPost } from "@/lib/giybet/types";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n/provider";
import { LanguageSwitcher } from "@/lib/i18n/LanguageSwitcher";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { FaceStudioPanel } from "@/components/profile/FaceStudioPanel";
import { ProfileGossipDetailModal } from "@/components/profile/ProfileGossipDetailModal";
import { NotificationPreferencesPanel } from "@/components/profile/NotificationPreferencesPanel";
import { NeonToast } from "@/components/ui/NeonToast";
import { PasswordField } from "@/components/auth/PasswordField";

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
}) {
  const { t } = useI18n();
  const [profileTab, setProfileTab] = useState<"overview" | "history">("overview");
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordToast, setPasswordToast] = useState<string | null>(null);
  const [selectedHistoryPost, setSelectedHistoryPost] = useState<FeedPost | null>(null);
  const passwordToastTimeoutRef = useRef<number | null>(null);

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordFeedback(null);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    setPasswordToast(null);

    if (!currentPassword.trim()) {
      setPasswordFeedback({ type: "error", text: t("profile.currentPasswordRequired") });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: "error", text: t("auth.passwordMinLength") });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback({ type: "error", text: t("auth.passwordsMismatch") });
      return;
    }

    setPasswordUpdating(true);
    try {
      const reauth = await reauthenticateWithPassword(currentPassword);
      if (!reauth.ok) {
        setPasswordFeedback({ type: "error", text: reauth.message });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        throw updateError;
      }

      resetPasswordForm();
      setPasswordFormOpen(false);
      setPasswordToast(t("profile.passwordToastSuccess"));
      if (passwordToastTimeoutRef.current != null) {
        window.clearTimeout(passwordToastTimeoutRef.current);
      }
      passwordToastTimeoutRef.current = window.setTimeout(() => {
        setPasswordToast(null);
        passwordToastTimeoutRef.current = null;
      }, 4000);
    } catch (err) {
      setPasswordFeedback({
        type: "error",
        text: supabaseAuthError(err as { message?: string }),
      });
    } finally {
      setPasswordUpdating(false);
    }
  };

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setPasswordFormOpen(false);
        resetPasswordForm();
        setSelectedHistoryPost(null);
      });
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (passwordToastTimeoutRef.current != null) {
        window.clearTimeout(passwordToastTimeoutRef.current);
      }
    };
  }, []);

  if (!open) return null;

  const studioConfig = editingAvatar ?? avatar;

  const statBox =
    "flex flex-1 flex-col items-center rounded-xl border border-purple-500/30 bg-purple-950/25 px-3 py-3 shadow-[0_0_12px_rgba(168,85,247,0.15)]";

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
              <h2 className="mb-1 pr-10 text-lg font-semibold text-zinc-100">{t("profile.wardrobeTitle")}</h2>
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
                <AvatarImage config={avatar} className="h-24 w-24 border-2 border-purple-500/50 shadow-[0_0_32px_rgba(236,72,153,0.35)]" />
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
                  <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">{t("profile.statsFollowers")}</span>
                </div>
                <div className={statBox}>
                  <span className="text-lg font-bold text-purple-300">{following}</span>
                  <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">{t("profile.statsFollowing")}</span>
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
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
                    profileTab === "overview"
                      ? "bg-gradient-to-r from-purple-600/50 to-pink-600/50 text-pink-100 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                      : "border border-zinc-800 text-zinc-500 hover:text-purple-300"
                  }`}
                >
                  {t("profile.overview")}
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab("history")}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
                    profileTab === "history"
                      ? "bg-gradient-to-r from-purple-600/50 to-pink-600/50 text-pink-100 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                      : "border border-zinc-800 text-zinc-500 hover:text-purple-300"
                  }`}
                >
                  {t("profile.historyGossips")}
                </button>
              </div>

              {profileTab === "overview" ? (
                <>
                  <button type="button" onClick={onStartEdit} className={`${btnPrimary} mt-4`}>
                    {t("profile.editAvatar")}
                  </button>

                  <NotificationPreferencesPanel nickname={nickname} />

                  <button
                    type="button"
                    onClick={() => {
                      setPasswordFormOpen((prev) => !prev);
                      if (passwordFormOpen) resetPasswordForm();
                    }}
                    className={`mt-4 w-full rounded-xl border px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                      passwordFormOpen
                        ? "border-pink-500/50 bg-gradient-to-r from-purple-950/50 to-pink-950/40 text-pink-200 shadow-[0_0_20px_rgba(236,72,153,0.25)]"
                        : "border-purple-500/40 bg-purple-950/30 text-purple-200 hover:border-pink-500/50 hover:text-pink-200 hover:shadow-[0_0_16px_rgba(168,85,247,0.25)]"
                    }`}
                  >
                    {t("profile.changePassword")}
                  </button>

                  {passwordFormOpen && (
                    <form
                      onSubmit={handlePasswordUpdate}
                      className="mt-3 rounded-xl border border-purple-500/35 bg-purple-950/20 p-4 shadow-[0_0_20px_rgba(168,85,247,0.12)]"
                    >
                      <p className="mb-3 text-[10px] font-semibold tracking-widest text-purple-300/80 uppercase">
                        {t("profile.securityVerification")}
                      </p>
                      <div className="flex flex-col gap-3">
                        <PasswordField
                          id="profile-current-password"
                          label={t("profile.oldPassword")}
                          value={currentPassword}
                          onChange={(val) => {
                            setCurrentPassword(val);
                            if (passwordFeedback) setPasswordFeedback(null);
                          }}
                          show={showCurrentPassword}
                          onToggleShow={() => setShowCurrentPassword((prev) => !prev)}
                          autoComplete="current-password"
                          inputClass={authInputNeonClass}
                        />
                        <PasswordField
                          id="profile-new-password"
                          label={t("profile.newPassword")}
                          value={newPassword}
                          onChange={(val) => {
                            setNewPassword(val);
                            if (passwordFeedback) setPasswordFeedback(null);
                          }}
                          show={showNewPassword}
                          onToggleShow={() => setShowNewPassword((prev) => !prev)}
                          autoComplete="new-password"
                          inputClass={authInputNeonClass}
                        />
                        <PasswordField
                          id="profile-confirm-password"
                          label={t("profile.confirmNewPassword")}
                          value={confirmNewPassword}
                          onChange={(val) => {
                            setConfirmNewPassword(val);
                            if (passwordFeedback) setPasswordFeedback(null);
                          }}
                          show={showConfirmNewPassword}
                          onToggleShow={() => setShowConfirmNewPassword((prev) => !prev)}
                          autoComplete="new-password"
                          inputClass={authInputNeonClass}
                        />
                      </div>
                      {passwordFeedback && (
                        <p
                          className={`mt-3 rounded-lg border px-3 py-2 text-xs font-semibold ${
                            passwordFeedback.type === "success"
                              ? "border-emerald-500/35 bg-emerald-950/25 text-emerald-200"
                              : "border-red-500/50 bg-red-950/30 text-red-300 shadow-[0_0_14px_rgba(239,68,68,0.25)]"
                          }`}
                        >
                          {passwordFeedback.text}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={
                          passwordUpdating ||
                          !currentPassword.trim() ||
                          !newPassword.trim() ||
                          !confirmNewPassword.trim()
                        }
                        className={`${btnPrimary} mt-3 text-sm disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        {passwordUpdating ? t("profile.verifying") : t("profile.updatePassword")}
                      </button>
                    </form>
                  )}
                </>
              ) : (
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

              <LanguageSwitcher />

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
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(t("account.deleteConfirm"))) return;
                  const { data } = await supabase.auth.getSession();
                  const token = data.session?.access_token;
                  if (!token) return;
                  const res = await fetch("/api/account", {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (res.ok) {
                    await supabase.auth.signOut();
                    onLogout();
                  } else {
                    alert(t("account.deleteFailed"));
                  }
                }}
                className="mt-2 w-full rounded-xl border border-zinc-700 py-3 text-xs text-zinc-500 hover:border-red-500/40 hover:text-red-300"
              >
                {t("account.delete")}
              </button>
            </>
          )}
        </div>
      </div>
      </div>
      {passwordToast && <NeonToast message={passwordToast} variant="success" />}
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
