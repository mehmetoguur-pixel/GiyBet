"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  saveNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notification-preferences";
import { useI18n } from "@/lib/i18n/provider";

export function NotificationPreferencesPanel({ nickname }: { nickname: string }) {
  const { t } = useI18n();
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    muteLike: false,
    muteComment: false,
    muteReaction: false,
    muteFollow: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!nickname.trim()) return;
    void supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      fetch("/api/notification-preferences", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          setPrefs({
            muteLike: data.muteLike ?? false,
            muteComment: data.muteComment ?? false,
            muteReaction: data.muteReaction ?? false,
            muteFollow: data.muteFollow ?? false,
          });
        })
        .catch(() => {});
    });
  }, [nickname]);

  const toggle = async (key: keyof NotificationPreferences) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        await fetch("/api/notification-preferences", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            muteLike: next.muteLike,
            muteComment: next.muteComment,
            muteReaction: next.muteReaction,
            muteFollow: next.muteFollow,
          }),
        });
      } else {
        await saveNotificationPreferences(nickname, next);
      }
    } finally {
      setSaving(false);
    }
  };

  const items: { key: keyof NotificationPreferences; label: string }[] = [
    { key: "muteLike", label: t("notifications.muteLike") },
    { key: "muteComment", label: t("notifications.muteComment") },
    { key: "muteReaction", label: t("notifications.muteReaction") },
    { key: "muteFollow", label: t("notifications.muteFollow") },
  ];

  return (
    <div className="mt-4 rounded-xl border border-sky-500/25 bg-sky-950/15 p-4">
      <p className="text-xs font-bold text-sky-200">{t("notifications.prefsTitle")}</p>
      <p className="mt-1 text-[10px] text-zinc-500">{t("notifications.prefsHint")}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => toggle(item.key)}
              disabled={saving}
              className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-xs transition-all active:scale-[0.98] disabled:opacity-50 ${
                prefs[item.key]
                  ? "border-pink-500/45 bg-pink-950/35 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.2)]"
                  : "border-zinc-700/80 bg-zinc-900/50 text-zinc-300 hover:border-purple-500/35"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  prefs[item.key]
                    ? "bg-pink-500/30 text-pink-200"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {prefs[item.key] ? t("notifications.muted") : t("notifications.active")}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
