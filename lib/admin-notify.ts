type ReportNotifyPayload = {
  reporterUsername: string;
  reportedUsername: string;
  reason: string;
  gossipId: string;
  gossipPreview?: string | null;
};

/** Yeni şikayet için opsiyonel e-posta (RESEND_API_KEY + ADMIN_NOTIFY_EMAIL) */
export async function notifyAdminNewReport(payload: ReportNotifyPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.ADMIN_NOTIFY_EMAIL?.trim();
  if (!apiKey || !to) return;

  const from = process.env.RESEND_FROM?.trim() || "GıyBet <onboarding@resend.dev>";
  const preview = (payload.gossipPreview ?? "").slice(0, 200);
  const body = [
    `Şikayet eden: @${payload.reporterUsername}`,
    `Yazar: @${payload.reportedUsername}`,
    `Neden: ${payload.reason}`,
    `Gıybet ID: ${payload.gossipId}`,
    preview ? `İçerik: ${preview}` : "",
    "",
    "Moderasyon: /admin/moderation",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `GıyBet şikayet: @${payload.reportedUsername}`,
        text: body,
      }),
    });
  } catch {
    /* bildirim başarısız olsa da şikayet kaydı kalır */
  }
}
