"use client";

import { useEffect, useRef, useState } from "react";
import {
  authInputNeonClass,
  reauthenticateWithPassword,
  supabaseAuthError,
} from "@/lib/auth-utils";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n/provider";
import { LanguageSwitcher } from "@/lib/i18n/LanguageSwitcher";
import { NotificationPreferencesPanel } from "@/components/profile/NotificationPreferencesPanel";
import { NeonToast } from "@/components/ui/NeonToast";
import { PasswordField } from "@/components/auth/PasswordField";

type ProfileSettingsPanelProps = {
  nickname: string;
  btnPrimary: string;
  onLogout: () => void;
};

export function ProfileSettingsPanel({
  nickname,
  btnPrimary,
  onLogout,
}: ProfileSettingsPanelProps) {
  const { t } = useI18n();
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
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

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

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

  const handleDeleteAccount = async () => {
    if (!confirm(t("account.deleteConfirm"))) return;
    setDeleteError("");
    setDeleteLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setDeleteError(t("account.deleteFailed"));
        return;
      }
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setDeleteError(body.error === "server_not_configured" ? t("account.deleteFailed") : t("account.deleteFailed"));
        return;
      }
      await supabase.auth.signOut();
      onLogout();
    } catch {
      setDeleteError(t("account.deleteFailed"));
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (passwordToastTimeoutRef.current != null) {
        window.clearTimeout(passwordToastTimeoutRef.current);
      }
    };
  }, []);

  const sectionBtn =
    "w-full rounded-xl border px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]";

  return (
    <div className="mt-4 flex flex-col gap-3">
      <p className="text-xs text-zinc-500">{t("profile.settingsHint")}</p>

      <NotificationPreferencesPanel nickname={nickname} />

      <button
        type="button"
        onClick={() => {
          setPasswordFormOpen((prev) => !prev);
          if (passwordFormOpen) resetPasswordForm();
        }}
        className={`${sectionBtn} ${
          passwordFormOpen
            ? "border-pink-500/50 bg-gradient-to-r from-purple-950/50 to-pink-950/40 text-pink-200 shadow-[0_0_20px_rgba(236,72,153,0.25)]"
            : "border-purple-500/40 bg-purple-950/30 text-purple-200 hover:border-pink-500/50 hover:text-pink-200"
        }`}
      >
        {t("profile.changePassword")}
      </button>

      {passwordFormOpen && (
        <form
          onSubmit={handlePasswordUpdate}
          className="rounded-xl border border-purple-500/35 bg-purple-950/20 p-4 shadow-[0_0_20px_rgba(168,85,247,0.12)]"
        >
          <p className="mb-3 text-[10px] font-semibold tracking-widest text-purple-300/80 uppercase">
            {t("profile.securityVerification")}
          </p>
          <div className="flex flex-col gap-3">
            <PasswordField
              id="settings-current-password"
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
              id="settings-new-password"
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
              id="settings-confirm-password"
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
                  : "border-red-500/50 bg-red-950/30 text-red-300"
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

      <LanguageSwitcher />

      <button
        type="button"
        onClick={handleDeleteAccount}
        disabled={deleteLoading}
        className={`${sectionBtn} border-red-500/40 bg-red-950/20 text-red-300 hover:border-red-400/60 hover:bg-red-950/40 disabled:opacity-50`}
      >
        {deleteLoading ? t("account.deleting") : t("account.delete")}
      </button>
      {deleteError && (
        <p className="rounded-lg border border-red-500/35 bg-red-950/25 px-3 py-2 text-xs text-red-300">
          {deleteError}
        </p>
      )}

      {passwordToast && <NeonToast message={passwordToast} variant="success" />}
    </div>
  );
}
