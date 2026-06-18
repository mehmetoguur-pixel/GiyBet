"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { normalizeGossipId } from "@/lib/gossip/parsers";
import type { ReportReason } from "@/lib/moderation";
import type { FeedPost, MapPin } from "@/lib/giybet/types";

type UseReportFlowOptions = {
  userId: string;
  nickname: string;
  posts: FeedPost[];
  t: (key: string) => string;
  onReportError: (message: string) => void;
  selectedMapPin: MapPin | null;
  setSelectedMapPin: (pin: MapPin | null) => void;
};

export function useReportFlow({
  userId,
  nickname,
  posts,
  t,
  onReportError,
  selectedMapPin,
  setSelectedMapPin,
}: UseReportFlowOptions) {
  const [reportTarget, setReportTarget] = useState<FeedPost | null>(null);
  const [showReportToast, setShowReportToast] = useState(false);
  const reportToastTimeoutRef = useRef<number | null>(null);

  const handleOpenReport = (postId: number) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    setSelectedMapPin(null);
    setReportTarget(post);
  };

  const handleSubmitReport = async (reason: ReportReason) => {
    if (!reportTarget || !userId) {
      setReportTarget(null);
      return;
    }
    const gossipId = reportTarget.gossipId ?? normalizeGossipId(reportTarget.id);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      onReportError(t("report.failed"));
      setReportTarget(null);
      return;
    }
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reporterUsername: nickname,
        gossipId,
        reportedUsername: reportTarget.author,
        reason,
        gossipPreview: reportTarget.text,
      }),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (payload.error === "already_reported") {
        onReportError(t("report.alreadyReported"));
      } else if (payload.error === "self_report_forbidden") {
        onReportError(t("report.selfReport"));
      } else {
        onReportError(t("report.failed"));
      }
    } else {
      setShowReportToast(true);
      if (reportToastTimeoutRef.current != null) {
        window.clearTimeout(reportToastTimeoutRef.current);
      }
      reportToastTimeoutRef.current = window.setTimeout(() => {
        setShowReportToast(false);
        reportToastTimeoutRef.current = null;
      }, 3500);
      if (selectedMapPin?.feedPostId === reportTarget.id) {
        setSelectedMapPin(null);
      }
    }
    setReportTarget(null);
  };

  return {
    reportTarget,
    setReportTarget,
    showReportToast,
    handleOpenReport,
    handleSubmitReport,
  };
}
