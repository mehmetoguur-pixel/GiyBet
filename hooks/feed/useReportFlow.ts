"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { normalizeGossipId } from "@/lib/gossip/parsers";
import type { ReportReason } from "@/lib/moderation";
import type { FeedPost, MapPin } from "@/lib/giybet/types";

type UseReportFlowOptions = {
  nickname: string;
  posts: FeedPost[];
  t: (key: string) => string;
  selectedMapPin: MapPin | null;
  setSelectedMapPin: (pin: MapPin | null) => void;
};

export function useReportFlow({
  nickname,
  posts,
  t,
  selectedMapPin,
  setSelectedMapPin,
}: UseReportFlowOptions) {
  const [reportTarget, setReportTarget] = useState<FeedPost | null>(null);
  const [showReportToast, setShowReportToast] = useState(false);
  const [reportError, setReportError] = useState("");
  const reportToastTimeoutRef = useRef<number | null>(null);
  const reportErrorTimeoutRef = useRef<number | null>(null);

  const clearReportError = () => {
    setReportError("");
    if (reportErrorTimeoutRef.current != null) {
      window.clearTimeout(reportErrorTimeoutRef.current);
      reportErrorTimeoutRef.current = null;
    }
  };

  const showReportError = (message: string) => {
    setReportError(message);
    if (reportErrorTimeoutRef.current != null) {
      window.clearTimeout(reportErrorTimeoutRef.current);
    }
    reportErrorTimeoutRef.current = window.setTimeout(() => {
      setReportError("");
      reportErrorTimeoutRef.current = null;
    }, 4500);
  };

  const handleOpenReport = (postId: number) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const trimmedNickname = nickname.trim();
    if (post.author === trimmedNickname) {
      showReportError(t("report.selfReport"));
      return;
    }
    clearReportError();
    setSelectedMapPin(null);
    setReportTarget(post);
  };

  const handleSubmitReport = async (reason: ReportReason) => {
    if (!reportTarget) return;

    const gossipId = reportTarget.gossipId ?? normalizeGossipId(reportTarget.id);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      showReportError(t("report.failed"));
      setReportTarget(null);
      return;
    }

    try {
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
          showReportError(t("report.alreadyReported"));
        } else if (payload.error === "self_report_forbidden") {
          showReportError(t("report.selfReport"));
        } else if (payload.error === "report_rate_limit_hour" || payload.error === "rate_limit") {
          showReportError(t("errors.rateLimitHour"));
        } else if (payload.error === "server_not_configured") {
          showReportError(t("report.serverNotConfigured"));
        } else {
          showReportError(t("report.failed"));
        }
      } else {
        clearReportError();
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
    } catch {
      showReportError(t("report.failed"));
    }
    setReportTarget(null);
  };

  return {
    reportTarget,
    setReportTarget,
    showReportToast,
    reportError,
    handleOpenReport,
    handleSubmitReport,
  };
}
