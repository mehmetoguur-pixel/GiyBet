"use client";

import GiybetFeed from "@/components/feed/GiybetFeed";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { AuthForms } from "@/components/home/AuthForms";
import { HomeFooter } from "@/components/home/HomeFooter";
import { WelcomeModal } from "@/components/home/WelcomeModal";
import { useFeedActions } from "@/hooks/home/useFeedActions";
import { useHomeAuth } from "@/hooks/home/useHomeAuth";
import {
  authBtnPrimary,
  authBtnSecondary,
  authInputClass,
} from "@/lib/auth-utils";
import { saveRegisteredUser } from "@/lib/auth/profile";
import { useI18n } from "@/lib/i18n/provider";

export default function Home() {
  const { t, nominatimLanguage } = useI18n();
  const auth = useHomeAuth({ t });

  const feed = useFeedActions({
    onFeed: auth.onFeed,
    nickname: auth.nickname,
    avatarCreator: auth.avatarCreator,
    registeredUser: auth.registeredUser,
    nominatimLanguage,
    t,
    onLogout: () => {
      saveRegisteredUser(null);
      auth.resetAuthState();
    },
  });

  const inputClass = authInputClass;
  const btnPrimary = authBtnPrimary;
  const btnSecondary = authBtnSecondary;

  const errorBox = auth.error ? (
    <p className="rounded-xl border border-pink-500/30 bg-pink-950/20 px-4 py-2.5 text-sm text-pink-300">
      {auth.error}
    </p>
  ) : null;

  const noticeBox = auth.authNotice ? (
    <p className="rounded-xl border border-purple-500/30 bg-purple-950/20 px-4 py-2.5 text-sm text-purple-200">
      {auth.authNotice}
    </p>
  ) : null;

  const onSaveAvatar = async (newAvatar: import("@/lib/giybet/types").AvatarCreatorConfig) => {
    const normalized = await feed.handleSaveAvatar(newAvatar);
    auth.setAvatarCreator(normalized);
    auth.setRegisteredUser((prev) => (prev ? { ...prev, avatar: normalized } : prev));
  };

  return (
    <div className="flex min-h-full flex-col bg-[#08080f] text-zinc-100">
      <ForgotPasswordModal
        open={auth.forgotPasswordOpen}
        initialEmail={auth.contact.includes("@") ? auth.contact.trim() : ""}
        onClose={() => auth.setForgotPasswordOpen(false)}
      />

      {auth.showWelcome && (
        <WelcomeModal
          nickname={auth.nickname}
          btnPrimary={btnPrimary}
          onEnter={auth.handleEnterFeed}
          t={t}
        />
      )}

      <main
        className={`mx-auto flex w-full flex-1 flex-col px-5 pb-14 pt-10 ${auth.onFeed ? "max-w-2xl" : "max-w-md"}`}
      >
        {feed.engagementToast && (
          <div className="mb-4 rounded-xl border border-pink-500/40 bg-pink-950/30 px-4 py-3 text-sm text-pink-200 shadow-[0_0_20px_rgba(236,72,153,0.25)]">
            {feed.engagementToast}
          </div>
        )}

        {auth.onFeed ? (
          <GiybetFeed
            userId={auth.registeredUser?.userId ?? ""}
            nickname={auth.nickname}
            avatar={auth.avatarCreator}
            posts={feed.feedPosts}
            mapPins={feed.mapPins}
            rooms={feed.mapRooms}
            onShare={feed.handleShare}
            onCreateRoomAtPlace={feed.handleCreateRoomAtPlace}
            onToggleLike={feed.handleToggleLike}
            onToggleReaction={feed.handleToggleReaction}
            onAddComment={feed.handleAddComment}
            onDeleteGossip={feed.handleDeleteGossip}
            onSaveAvatar={onSaveAvatar}
            onLogout={feed.handleLogout}
            btnPrimary={btnPrimary}
            btnSecondary={btnSecondary}
          />
        ) : (
          <AuthForms
            t={t}
            step={auth.step}
            isLogin={auth.isLogin}
            contact={auth.contact}
            setContact={auth.setContact}
            password={auth.password}
            setPassword={auth.setPassword}
            confirmPassword={auth.confirmPassword}
            setConfirmPassword={auth.setConfirmPassword}
            showPassword={auth.showPassword}
            setShowPassword={auth.setShowPassword}
            showConfirmPassword={auth.showConfirmPassword}
            setShowConfirmPassword={auth.setShowConfirmPassword}
            nickname={auth.nickname}
            setNickname={auth.setNickname}
            error={auth.error}
            setError={auth.setError}
            authNotice={auth.authNotice}
            setAuthNotice={auth.setAuthNotice}
            authLoading={auth.authLoading}
            forgotPasswordOpen={auth.forgotPasswordOpen}
            setForgotPasswordOpen={auth.setForgotPasswordOpen}
            avatarCreator={auth.avatarCreator}
            updateAvatar={auth.updateAvatar}
            passwordsMismatch={auth.passwordsMismatch}
            canSubmitAuth={auth.canSubmitAuth}
            inputClass={inputClass}
            btnPrimary={btnPrimary}
            btnSecondary={btnSecondary}
            errorBox={errorBox}
            noticeBox={noticeBox}
            handleStep1={auth.handleStep1}
            handleLogin={auth.handleLogin}
            switchToLogin={auth.switchToLogin}
            switchToRegister={auth.switchToRegister}
            handleStep2={auth.handleStep2}
            handleRegister={auth.handleRegister}
            goBack={auth.goBack}
          />
        )}
      </main>

      <HomeFooter t={t} />
    </div>
  );
}
