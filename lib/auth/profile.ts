import type { User } from "@supabase/supabase-js";
import { DEFAULT_AVATAR, normalizeAvatar } from "@/lib/avatar";
import type { AvatarCreatorConfig, RegisteredUser } from "@/lib/giybet/types";

export function isValidContact(value: string) {
  const trimmed = value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^(\+?\d[\d\s-]{8,})$/;
  return emailPattern.test(trimmed) || phonePattern.test(trimmed.replace(/\s/g, ""));
}

export function normalizeContact(value: string) {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  return trimmed.replace(/\s/g, "");
}

export const REGISTERED_USER_KEY = "giybet_registered_user";

export function toSupabasePhone(contact: string): string {
  const digits = contact.replace(/\D/g, "");
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+9${digits}`;
  return `+${digits}`;
}

export function buildAuthPayload(
  contact: string,
  password: string,
): { email: string; password: string } | { phone: string; password: string } {
  const trimmed = contact.trim();
  if (trimmed.includes("@")) {
    return { email: trimmed.toLowerCase(), password };
  }
  return { phone: toSupabasePhone(trimmed), password };
}

export function profileFromUser(user: User): RegisteredUser {
  const meta = user.user_metadata ?? {};
  return {
    userId: user.id,
    contact: user.email ?? user.phone ?? "",
    nickname: typeof meta.nickname === "string" ? meta.nickname : "",
    avatar: normalizeAvatar(
      meta.avatar && typeof meta.avatar === "object"
        ? (meta.avatar as Partial<AvatarCreatorConfig>)
        : DEFAULT_AVATAR,
    ),
  };
}

export function loadRegisteredUser(): RegisteredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(REGISTERED_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegisteredUser & { avatar?: unknown; password?: string };
    if (!parsed.userId) return null;
    if (
      parsed.avatar &&
      typeof parsed.avatar === "object" &&
      ("maleHair" in (parsed.avatar as object) ||
        "femaleHair" in (parsed.avatar as object) ||
        "top" in (parsed.avatar as object) ||
        "eyes" in (parsed.avatar as object))
    ) {
      return {
        userId: parsed.userId,
        contact: parsed.contact,
        nickname: parsed.nickname,
        avatar: normalizeAvatar(parsed.avatar as Partial<AvatarCreatorConfig>),
      };
    }
    return {
      userId: parsed.userId,
      contact: parsed.contact,
      nickname: parsed.nickname,
      avatar: DEFAULT_AVATAR,
    };
  } catch {
    return null;
  }
}

export function saveRegisteredUser(user: RegisteredUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    sessionStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(REGISTERED_USER_KEY);
  }
}
