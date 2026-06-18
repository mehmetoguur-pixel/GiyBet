"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchNotificationPreferences,
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
    fetchNotificationPreferences(nickname).then(setPrefs);
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
            <label className="flex items-center justify-between gap-3 text-xs text-zinc-300">
              <span>{item.label}</span>
              <input
                type="checkbox"
                checked={prefs[item.key]}
                onChange={() => toggle(item.key)}
                disabled={saving}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-pink-500"
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
