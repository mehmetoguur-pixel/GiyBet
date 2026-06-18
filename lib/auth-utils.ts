import { supabase } from "./supabase";

export const authInputClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none transition-all focus:border-purple-500/60 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.15)]";

export const authInputNeonClass = `${authInputClass} focus:border-purple-400/80 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.35),0_0_20px_rgba(236,72,153,0.28)]`;

export const authBtnPrimary =
  "w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3.5 font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.35)] transition-all hover:from-purple-500 hover:to-pink-500 hover:shadow-[0_0_32px_rgba(236,72,153,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

export const authBtnSecondary =
  "w-full rounded-xl border border-zinc-700 bg-zinc-900/60 py-3.5 font-medium text-zinc-400 transition-all hover:border-purple-500/40 hover:text-purple-300 active:scale-[0.98]";

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function supabaseAuthError(err: { message?: string } | null): string {
  const msg = err?.message ?? "";
  if (msg.includes("Invalid login credentials")) {
    return "Hatalı e-posta veya şifre! Lütfen kayıt olduğun bilgileri gir.";
  }
  if (msg.includes("User already registered") || msg.includes("already been registered")) {
    return "Bu e-posta veya telefon zaten kayıtlı.";
  }
  if (msg.includes("Password should be at least")) {
    return "Şifre en az 6 karakter olmalı.";
  }
  if (msg.includes("New password should be different")) {
    return "Yeni şifre mevcut şifrenden farklı olmalı.";
  }
  if (msg.includes("Auth session missing")) {
    return "Oturum bulunamadı. Lütfen e-postadaki sıfırlama linkini tekrar aç.";
  }
  return msg || "Bir hata oluştu. Lütfen tekrar dene.";
}

export const AUTH_NOTICE_KEY = "giybet_auth_notice";

export const WRONG_CURRENT_PASSWORD_MSG =
  "Mevcut şifreniz hatalı, lütfen tekrar deneyin";

export async function reauthenticateWithPassword(
  oldPassword: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, message: "Oturum bulunamadı. Lütfen tekrar giriş yap." };
  }

  const credentials = user.email
    ? { email: user.email, password: oldPassword }
    : user.phone
      ? { phone: user.phone, password: oldPassword }
      : null;

  if (!credentials) {
    return { ok: false, message: "Hesap bilgisi bulunamadı." };
  }

  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { ok: false, message: WRONG_CURRENT_PASSWORD_MSG };
    }
    return { ok: false, message: supabaseAuthError(error) };
  }

  return { ok: true };
}
