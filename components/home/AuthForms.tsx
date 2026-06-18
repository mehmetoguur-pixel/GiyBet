"use client";

import { PasswordField } from "@/components/auth/PasswordField";
import { StepIndicator } from "@/components/auth/StepIndicator";
import { FaceStudioPanel } from "@/components/profile/FaceStudioPanel";
import type { AvatarCreatorConfig, Step } from "@/lib/giybet/types";

type AuthFormsProps = {
  t: (key: string, params?: Record<string, string | number>) => string;
  step: Step;
  isLogin: boolean;
  contact: string;
  setContact: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean | ((p: boolean) => boolean)) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean | ((p: boolean) => boolean)) => void;
  nickname: string;
  setNickname: (v: string) => void;
  error: string;
  setError: (v: string) => void;
  authNotice: string;
  setAuthNotice: (v: string) => void;
  authLoading: boolean;
  forgotPasswordOpen: boolean;
  setForgotPasswordOpen: (v: boolean) => void;
  avatarCreator: AvatarCreatorConfig;
  updateAvatar: (patch: Partial<AvatarCreatorConfig>) => void;
  passwordsMismatch: boolean;
  canSubmitAuth: boolean;
  inputClass: string;
  btnPrimary: string;
  btnSecondary: string;
  errorBox: React.ReactNode;
  noticeBox: React.ReactNode;
  handleStep1: (e: React.FormEvent) => void;
  handleLogin: (e: React.FormEvent) => void;
  switchToLogin: () => void;
  switchToRegister: () => void;
  handleStep2: (e: React.FormEvent) => void;
  handleRegister: (e: React.FormEvent) => void;
  goBack: (target: Step) => void;
};

export function AuthForms({
  t,
  step,
  isLogin,
  contact,
  setContact,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  nickname,
  setNickname,
  error,
  setError,
  authNotice,
  setAuthNotice,
  authLoading,
  setForgotPasswordOpen,
  avatarCreator,
  updateAvatar,
  passwordsMismatch,
  canSubmitAuth,
  inputClass,
  btnPrimary,
  btnSecondary,
  errorBox,
  noticeBox,
  handleStep1,
  handleLogin,
  switchToLogin,
  switchToRegister,
  handleStep2,
  handleRegister,
  goBack,
}: AuthFormsProps) {
  return (
    <>
      <header className="mb-10 text-center">
        <h1 className="bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-500 bg-clip-text text-5xl font-black tracking-tight text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.4)] sm:text-6xl">
          {t("common.appName")}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{t("auth.tagline")}</p>
      </header>

      {!isLogin && <StepIndicator current={step} />}

      {step === 1 && (
        <form onSubmit={isLogin ? handleLogin : handleStep1} className="flex flex-col gap-5">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-zinc-100">
              {isLogin ? t("auth.welcomeBack") : t("auth.welcome")}
            </h2>
            <p className="text-sm text-zinc-500">
              {isLogin ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="contact" className="mb-1.5 block text-xs font-medium text-zinc-400">
                {t("auth.contactLabel")}
              </label>
              <input
                id="contact"
                type="text"
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  if (error) setError("");
                  if (authNotice) setAuthNotice("");
                }}
                placeholder={t("auth.contactPlaceholder")}
                className={inputClass}
                autoComplete="username"
              />
            </div>
            <PasswordField
              id="password"
              label={t("auth.password")}
              value={password}
              onChange={(val) => {
                setPassword(val);
                if (error) setError("");
                if (authNotice) setAuthNotice("");
              }}
              show={showPassword}
              onToggleShow={() => setShowPassword((prev) => !prev)}
              autoComplete={isLogin ? "current-password" : "new-password"}
              inputClass={inputClass}
            />
            {!isLogin && (
              <PasswordField
                id="confirm-password"
                label={t("auth.confirmPassword")}
                value={confirmPassword}
                onChange={(val) => {
                  setConfirmPassword(val);
                  if (error) setError("");
                }}
                show={showConfirmPassword}
                onToggleShow={() => setShowConfirmPassword((prev) => !prev)}
                autoComplete="new-password"
                inputClass={inputClass}
              />
            )}
            {isLogin && (
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(true)}
                className="-mt-1 self-end text-xs font-medium text-purple-400/90 transition-colors hover:text-pink-300"
              >
                {t("auth.forgotPassword")}
              </button>
            )}
          </div>

          {passwordsMismatch && (
            <p className="rounded-xl border border-red-500/50 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-300 shadow-[0_0_14px_rgba(239,68,68,0.25)]">
              {t("auth.passwordsMismatch")}
            </p>
          )}

          {noticeBox}
          {errorBox}

          <button
            type="submit"
            disabled={!canSubmitAuth || authLoading}
            className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:from-purple-600 disabled:hover:to-pink-600 disabled:active:scale-100`}
          >
            {authLoading ? t("auth.authLoading") : isLogin ? t("auth.login") : t("auth.continue")}
          </button>
          {isLogin ? (
            <button
              type="button"
              onClick={switchToRegister}
              className="text-center text-sm text-purple-400/80 hover:text-purple-300"
            >
              {t("auth.noAccount")}
            </button>
          ) : (
            <button
              type="button"
              onClick={switchToLogin}
              className="text-center text-sm text-purple-400/80 hover:text-purple-300"
            >
              {t("auth.hasAccount")}
            </button>
          )}
        </form>
      )}

      {!isLogin && step === 2 && (
        <form onSubmit={handleStep2} className="flex flex-col gap-5">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-zinc-100">{t("auth.nicknameTitle")}</h2>
            <p className="text-sm text-zinc-500">{t("auth.nicknameSubtitle")}</p>
          </div>

          <div>
            <label htmlFor="nickname" className="mb-1.5 block text-xs font-medium text-zinc-400">
              {t("auth.nicknameLabel")}
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (error) setError("");
              }}
              placeholder={t("auth.nicknamePlaceholder")}
              maxLength={24}
              className={inputClass}
              autoComplete="off"
            />
            <p className="mt-1.5 text-xs text-zinc-600">
              {t("auth.charCount", { count: nickname.length })}
            </p>
          </div>

          {nickname.trim() && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 px-4 py-3 text-center">
              <span className="text-xs text-zinc-500">{t("auth.previewNickname")} </span>
              <span className="font-semibold text-purple-300">@{nickname.trim()}</span>
            </div>
          )}

          {errorBox}

          <button type="submit" disabled={authLoading} className={btnPrimary}>
            {authLoading ? t("auth.authLoading") : t("auth.continue")}
          </button>
          <button type="button" onClick={() => goBack(1)} className={btnSecondary}>
            {t("auth.back")}
          </button>
        </form>
      )}

      {!isLogin && step === 3 && (
        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-zinc-100">{t("auth.faceStudioTitle")}</h2>
            <p className="text-sm text-zinc-500">{t("auth.avatarSubtitle")}</p>
          </div>

          <FaceStudioPanel config={avatarCreator} onChange={updateAvatar} />

          {nickname && (
            <div className="rounded-xl border border-pink-500/20 bg-pink-950/20 px-4 py-3 text-center text-sm">
              <span className="text-zinc-500">{t("auth.faceStudioReady")} </span>
              <span className="font-bold text-pink-300">@{nickname}</span>
            </div>
          )}

          {errorBox}

          <button type="submit" disabled={authLoading} className={btnPrimary}>
            {authLoading ? t("auth.authLoading") : t("auth.register")}
          </button>
          <button type="button" onClick={() => goBack(2)} className={btnSecondary}>
            {t("auth.back")}
          </button>
        </form>
      )}
    </>
  );
}
