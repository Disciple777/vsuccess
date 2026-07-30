/**
 * useSearchQuota.ts — Hook for free tier search quota tracking
 *
 * Provides:
 *  - Remaining search count for the week
 *  - Whether to show the upgrade banner
 *  - A trackSearch() function to call after each successful search
 *  - Auto-refreshes when the user changes
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { checkRemainingSearches, logSearchUsage } from "@/lib/api";

export interface QuotaState {
  /** Remaining searches this week. -1 = unlimited (paid). null = not loaded. */
  remaining: number | null;
  /** Total weekly limit (5 for free users) */
  totalLimit: number;
  /** Whether the upgrade banner should be shown */
  showBanner: boolean;
  /** Manually dismiss the banner */
  dismissBanner: () => void;
  /** Whether quota is being fetched */
  loading: boolean;
  /** Call after a successful search to log it */
  trackSearch: (niche: string) => Promise<void>;
  /** Manually re-fetch quota from server */
  refreshQuota: () => Promise<void>;
}

export function useSearchQuota(): QuotaState {
  const { user } = useAuth();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [totalLimit, setTotalLimit] = useState(5);
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Refresh quota from server ─────────────────────
  const refreshQuota = useCallback(async () => {
    if (!user) {
      setRemaining(null);
      setShowBanner(false);
      return;
    }

    if (user.tier === "paid") {
      setRemaining(-1);
      setShowBanner(false);
      return;
    }

    setLoading(true);
    try {
      const info = await checkRemainingSearches();
      if (info) {
        setRemaining(info.remaining);
        setTotalLimit(info.total);
        if (info.remaining <= 0 && info.remaining !== -1) {
          setShowBanner(true);
        }
      }
    } catch {
      // Silently fail — quota is non-critical
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-refresh when user changes
  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);

  // ── Track a search ────────────────────────────────
  const trackSearch = useCallback(
    async (niche: string) => {
      if (!user || user.tier === "paid") return;

      try {
        await logSearchUsage(niche);
        // Re-fetch fresh data
        await refreshQuota();
      } catch {
        // Best-effort
      }
    },
    [user, refreshQuota]
  );

  // ── Dismiss banner ────────────────────────────────
  const dismissBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  return {
    remaining,
    totalLimit,
    showBanner,
    dismissBanner,
    loading,
    trackSearch,
    refreshQuota,
  };
}
