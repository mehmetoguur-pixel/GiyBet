"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import {
  AUTH_NOTICE_KEY,
  authBtnPrimary,
  authBtnSecondary,
  authInputClass,
  supabaseAuthError,
} from "../../lib/auth-utils";
import { useI18n } from "../../lib/i18n/provider";

function PasswordInput({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  showLabel,
  hideLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  autoComplete: string;
  showLabel: string;
  hideLabel: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-zinc-400">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${authInputClass} pr-11`}
          autoComplete={autoComplete}
          minLength={6}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1 text-base opacity-70 transition-all hover:opacity-100 active:scale-95"
          aria-label={show ? hideLabel : showLabel}
        >
          👁️
        </button>
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setSessionReady(true);
        setCheckingSession(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setSessionReady(true);
      }
      setCheckingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setToast(null);

    if (password.length < 6) {
      setError(t("auth.passwordMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordsMismatch"));
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }

      setToast({
        type: "success",
        message: t("auth.updatePasswordSuccess"),
      });

      await supabase.auth.signOut();
      sessionStorage.setItem(AUTH_NOTICE_KEY, t("auth.updatePasswordDone"));

      window.setTimeout(() => {
        router.push("/");
      }, 1800);
    } catch (err) {
      const message = supabaseAuthError(err as { message?: string });
      setError(message);
      setToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[#08080f] px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-purple-500/35 bg-[#12121a]/90 p-6 shadow-[0_0_40px_rgba(168,85,247,0.25)]">
        <div className="mb-6 text-center">
          <h1 className="bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-500 bg-clip-text text-3xl font-black text-transparent">
            {t("auth.updatePasswordPageTitle")}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{t("auth.updatePasswordSubtitle")}</p>
        </div>

        {checkingSession ? (
          <p className="rounded-xl border border-purple-500/30 bg-purple-950/20 px-4 py-3 text-center text-sm text-purple-200">
            {t("auth.sessionChecking")}
          </p>
        ) : !sessionReady ? (
          <div className="flex flex-col gap-4">
            <p className="rounded-xl border border-pink-500/30 bg-pink-950/20 px-4 py-3 text-sm text-pink-300">
              {t("auth.invalidSession")}
            </p>
            <Link href="/" className={`${authBtnSecondary} block text-center`}>
              {t("auth.backToLogin")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <PasswordInput
              id="new-password"
              label={t("profile.newPassword")}
              value={password}
              onChange={(val) => {
                setPassword(val);
                if (error) setError("");
              }}
              show={showPassword}
              onToggleShow={() => setShowPassword((prev) => !prev)}
              autoComplete="new-password"
              showLabel={t("auth.showPassword")}
              hideLabel={t("auth.hidePassword")}
            />
            <PasswordInput
              id="confirm-new-password"
              label={t("profile.confirmNewPassword")}
              value={confirmPassword}
              onChange={(val) => {
                setConfirmPassword(val);
                if (error) setError("");
              }}
              show={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword((prev) => !prev)}
              autoComplete="new-password"
              showLabel={t("auth.showPassword")}
              hideLabel={t("auth.hidePassword")}
            />

            {error && (
              <p className="rounded-xl border border-pink-500/30 bg-pink-950/20 px-4 py-2.5 text-sm text-pink-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className={authBtnPrimary}
            >
              {loading ? t("auth.updating") : t("profile.updatePassword")}
            </button>
          </form>
        )}
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed top-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border px-4 py-3 text-center text-xs font-bold shadow-[0_0_32px_rgba(168,85,247,0.35)] ${
            toast.type === "success"
              ? "border-emerald-500/60 bg-gradient-to-r from-emerald-950/90 via-purple-950/90 to-emerald-950/90 text-emerald-200"
              : "border-pink-500/60 bg-gradient-to-r from-pink-950/90 via-purple-950/90 to-pink-950/90 text-pink-200"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
