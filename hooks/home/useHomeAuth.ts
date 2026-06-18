"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_AVATAR, normalizeAvatar } from "@/lib/avatar";
import { AUTH_NOTICE_KEY, supabaseAuthError } from "@/lib/auth-utils";
import {
  buildAuthPayload,
  isValidContact,
  loadRegisteredUser,
  profileFromUser,
  saveRegisteredUser,
} from "@/lib/auth/profile";
import { fetchBanStatus } from "@/lib/moderation";
import type { AvatarCreatorConfig, RegisteredUser, Step } from "@/lib/giybet/types";
import { supabase } from "@/lib/supabase";

function getStoredAuthBootstrap() {
  if (typeof window === "undefined") {
    return {
      user: null as RegisteredUser | null,
      notice: "",
      fromNotice: false,
      nickname: "",
      contact: "",
      avatar: normalizeAvatar(DEFAULT_AVATAR),
    };
  }
  const user = loadRegisteredUser();
  const notice = sessionStorage.getItem(AUTH_NOTICE_KEY);
  if (notice) sessionStorage.removeItem(AUTH_NOTICE_KEY);
  const fromNotice = Boolean(notice);
  return {
    user,
    notice: notice ?? "",
    fromNotice,
    nickname: user?.nickname ?? "",
    contact: user?.contact ?? "",
    avatar: user ? normalizeAvatar(user.avatar) : normalizeAvatar(DEFAULT_AVATAR),
  };
}

type UseHomeAuthOptions = {
  t: (key: string, params?: Record<string, string | number>) => string;
};

export function useHomeAuth({ t }: UseHomeAuthOptions) {
  const [bootstrap] = useState(() => getStoredAuthBootstrap());

  const [step, setStep] = useState<Step>(1);
  const [isLogin, setIsLogin] = useState(() => bootstrap.fromNotice);
  const [contact, setContact] = useState(() => bootstrap.contact);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nickname, setNickname] = useState(() => bootstrap.nickname);
  const [error, setError] = useState("");
  const [authNotice, setAuthNotice] = useState(() => bootstrap.notice);
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showBanAppeal, setShowBanAppeal] = useState(false);
  const [bannedUsername, setBannedUsername] = useState("");
  const [onFeed, setOnFeed] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(
    () => bootstrap.user,
  );
  const [avatarCreator, setAvatarCreator] = useState<AvatarCreatorConfig>(() => bootstrap.avatar);

  useEffect(() => {
    if (registeredUser) {
      saveRegisteredUser(registeredUser);
    }
  }, [registeredUser]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted || !session?.user) return;
      const profile = profileFromUser(session.user);
      const banStatus = await fetchBanStatus(profile.userId);
      if (banStatus.banned) {
        await supabase.auth.signOut();
        setBannedUsername(profile.nickname || profile.contact);
        setShowBanAppeal(true);
        sessionStorage.setItem(AUTH_NOTICE_KEY, t("auth.banned"));
        setAuthNotice(t("auth.banned"));
        setIsLogin(true);
        setOnFeed(false);
        setStep(1);
        return;
      }
      setRegisteredUser(profile);
      setNickname(profile.nickname);
      setAvatarCreator(profile.avatar);
      setContact(profile.contact);
      if (profile.nickname.trim()) {
        setOnFeed(true);
      } else {
        setIsLogin(false);
        setStep(2);
      }
    });

    return () => {
      mounted = false;
    };
  }, [t]);

  const updateAvatar = useCallback((patch: Partial<AvatarCreatorConfig>) => {
    setAvatarCreator((prev) => normalizeAvatar({ ...prev, ...patch }));
  }, []);

  const validateCredentials = () => {
    if (!contact.trim()) {
      setError(t("auth.contactRequired"));
      return false;
    }
    if (!isValidContact(contact)) {
      setError(t("auth.invalidContact"));
      return false;
    }
    if (password.length < 6) {
      setError(t("auth.passwordMinLength"));
      return false;
    }
    if (!isLogin && password !== confirmPassword) {
      setError(t("auth.passwordsMismatch"));
      return false;
    }
    return true;
  };

  const passwordsMismatch =
    !isLogin && confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmitAuth = isLogin
    ? contact.trim().length > 0 && password.length >= 6
    : contact.trim().length > 0 &&
      password.length >= 6 &&
      confirmPassword.length > 0 &&
      password === confirmPassword;

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAuthNotice("");
    if (!validateCredentials()) return;

    setAuthLoading(true);
    try {
      const payload = buildAuthPayload(contact, password);
      const { data, error: signUpError } = await supabase.auth.signUp({
        ...payload,
        options: {
          data: {
            nickname: "",
            avatar: avatarCreator,
          },
        },
      });

      if (signUpError) {
        setError(supabaseAuthError(signUpError));
        return;
      }

      if (!data.user) {
        setError(t("auth.registerFailed"));
        return;
      }

      const profile: RegisteredUser = {
        userId: data.user.id,
        contact: contact.trim(),
        nickname: "",
        avatar: avatarCreator,
      };
      setRegisteredUser(profile);

      if (data.session) {
        setStep(2);
        return;
      }

      setAuthNotice(t("auth.emailVerifyNotice"));
      setIsLogin(true);
      setPassword("");
      setConfirmPassword("");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAuthNotice("");
    if (!validateCredentials()) return;

    setAuthLoading(true);
    try {
      const payload = buildAuthPayload(contact, password);
      const { data, error: signInError } = await supabase.auth.signInWithPassword(payload);

      if (signInError) {
        setError(supabaseAuthError(signInError));
        return;
      }

      if (!data.user) {
        setError(t("auth.loginFailed"));
        return;
      }

      const profile = profileFromUser(data.user);
      const banStatus = await fetchBanStatus(profile.userId);
      if (banStatus.banned) {
        await supabase.auth.signOut();
        setBannedUsername(profile.nickname || profile.contact);
        setShowBanAppeal(true);
        setError(t("auth.banned"));
        return;
      }
      setRegisteredUser(profile);
      setNickname(profile.nickname);
      setAvatarCreator(profile.avatar);

      if (!profile.nickname.trim()) {
        setIsLogin(false);
        setStep(2);
        return;
      }

      setOnFeed(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const switchToLogin = () => {
    setError("");
    setAuthNotice("");
    setIsLogin(true);
    setStep(1);
    setConfirmPassword("");
    setShowConfirmPassword(false);
  };

  const switchToRegister = () => {
    setError("");
    setAuthNotice("");
    setIsLogin(false);
    setStep(1);
    setConfirmPassword("");
    setShowConfirmPassword(false);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = nickname.trim();
    if (trimmed.length < 3) {
      setError(t("auth.nicknameMinLength"));
      return;
    }
    if (!/^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+$/.test(trimmed)) {
      setError(t("auth.nicknameCharsOnly"));
      return;
    }

    setAuthLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { nickname: trimmed },
      });
      if (updateError) {
        setError(supabaseAuthError(updateError));
        return;
      }
      setNickname(trimmed);
      setRegisteredUser((prev) => (prev ? { ...prev, nickname: trimmed } : prev));
      setStep(3);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAuthLoading(true);
    try {
      const trimmedNickname = nickname.trim();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { nickname: trimmedNickname, avatar: avatarCreator },
      });
      if (updateError) {
        setError(supabaseAuthError(updateError));
        return;
      }
      setRegisteredUser((prev) =>
        prev ? { ...prev, nickname: trimmedNickname, avatar: avatarCreator } : prev,
      );
      setShowWelcome(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEnterFeed = () => {
    setShowWelcome(false);
    setOnFeed(true);
  };

  const resetAuthState = () => {
    setOnFeed(false);
    setStep(1);
    setIsLogin(true);
    setContact("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setNickname("");
    setError("");
    setAuthNotice("");
    setShowWelcome(false);
    setRegisteredUser(null);
    setAvatarCreator(normalizeAvatar(DEFAULT_AVATAR));
  };

  const goBack = (target: Step) => {
    setError("");
    setStep(target);
  };

  return {
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
    forgotPasswordOpen,
    setForgotPasswordOpen,
    showWelcome,
    showBanAppeal,
    setShowBanAppeal,
    bannedUsername,
    onFeed,
    registeredUser,
    setRegisteredUser,
    avatarCreator,
    setAvatarCreator,
    updateAvatar,
    passwordsMismatch,
    canSubmitAuth,
    handleStep1,
    handleLogin,
    switchToLogin,
    switchToRegister,
    handleStep2,
    handleRegister,
    handleEnterFeed,
    resetAuthState,
    goBack,
  };
}
