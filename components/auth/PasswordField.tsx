"use client";

import { useI18n } from "@/lib/i18n/provider";

export function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  inputClass,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  autoComplete: string;
  inputClass: string;
}) {
  const { t } = useI18n();
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
          placeholder="••••••••"
          className={`${inputClass} pr-11`}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1 text-base opacity-70 transition-all hover:opacity-100 active:scale-95"
          aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")}
        >
          👁️
        </button>
      </div>
    </div>
  );
}
