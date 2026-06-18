"use client";

export function NeonToast({
  message,
  variant,
}: {
  message: string;
  variant: "success" | "error";
}) {
  return (
    <div
      role="status"
      className={`fixed top-20 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border px-4 py-3 text-center text-xs font-bold shadow-[0_0_32px_rgba(168,85,247,0.35)] ${
        variant === "success"
          ? "border-emerald-500/60 bg-gradient-to-r from-emerald-950/90 via-purple-950/90 to-emerald-950/90 text-emerald-200"
          : "border-pink-500/60 bg-gradient-to-r from-pink-950/90 via-purple-950/90 to-pink-950/90 text-pink-200"
      }`}
    >
      {message}
    </div>
  );
}
