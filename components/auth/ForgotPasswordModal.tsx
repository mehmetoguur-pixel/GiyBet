"use client";

import { useEffect, useState } from "react";
import {
  authBtnPrimary,
  authBtnSecondary,
  authInputClass,
  isValidEmail,
  supabaseAuthError,
} from "@/lib/auth-utils";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n/provider";
import { NeonToast } from "@/components/ui/NeonToast";

export function ForgotPasswordModal({
  open,
  initialEmail,
  onClose,
}: {
  open: boolean;
  initialEmail: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setEmail(initialEmail);
      setError("");
      setToast(null);
    });
  }, [open, initialEmail]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setToast(null);

    if (!isValidEmail(email)) {
      setError(t("auth.resetEmailOnly"));
      return;
    }

    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/update-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo },
      );
      if (resetError) {
        throw resetError;
      }
      setToast(t("auth.resetSent"));
    } catch (err) {
      setError(supabaseAuthError(err as { message?: string }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center px-4">
        <div
          className="pointer-events-auto relative w-full max-w-md rounded-2xl border border-purple-500/45 bg-[#12121a] p-6 shadow-[0_0_60px_rgba(168,85,247,0.4)]"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-all hover:border-pink-500/50 hover:text-pink-300"
            aria-label={t("common.close")}
          >
            ✕
          </button>
          <h2
            id="forgot-password-title"
            className="mb-1 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-lg font-bold text-transparent"
          >
            {t("auth.forgotTitle")}
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            {t("auth.forgotSubtitle")}
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-medium text-zinc-400">
                {t("auth.emailLabel")}
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder={t("auth.emailPlaceholder")}
                className={authInputClass}
                autoComplete="email"
              />
            </div>
            {error && (
              <p className="rounded-xl border border-pink-500/30 bg-pink-950/20 px-4 py-2.5 text-sm text-pink-300">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className={`${authBtnPrimary} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {loading ? t("auth.sending") : t("auth.sendReset")}
            </button>
            <button type="button" onClick={onClose} className={authBtnSecondary}>
              {t("auth.dismiss")}
            </button>
          </form>
        </div>
      </div>
      {toast && <NeonToast message={toast} variant="success" />}
    </>
  );
}
