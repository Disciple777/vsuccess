/**
 * UpgradeBanner.tsx — Dismissible upgrade prompt
 *
 * Shown when a free-tier user has used all 5 weekly searches.
 * Soft limit — user can still search but sees this banner.
 */

"use client";

import { X, Zap, Sparkles } from "lucide-react";

interface UpgradeBannerProps {
  /** Number of searches remaining this week (should be <= 0) */
  remaining: number;
  /** Total weekly limit (typically 5) */
  totalLimit: number;
  /** Called when the user dismisses the banner */
  onDismiss: () => void;
}

export default function UpgradeBanner({
  remaining,
  totalLimit,
  onDismiss,
}: UpgradeBannerProps) {
  const isExhausted = remaining <= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-pink-500/10 
                    border border-amber-500/20 p-4 mb-6 animate-fade-in group">
      {/* Animated glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-pink-500/5 pointer-events-none 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-xl 
                        bg-gradient-to-br from-amber-500/20 to-orange-500/20 
                        border border-amber-500/20 flex-shrink-0
                        group-hover:scale-105 transition-transform duration-300">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>

          {/* Content */}
          <div>
            <h4 className="text-sm font-semibold text-amber-300/90 mb-1">
              {isExhausted
                ? `You've used all ${totalLimit}/${totalLimit} free searches this week!`
                : `Only ${remaining}/${totalLimit} free searches remaining`}
            </h4>
            <p className="text-xs text-white/50 leading-relaxed max-w-lg">
              {isExhausted
                ? "Your searches still work — but you're missing out on unlimited searches, advanced analytics, and priority support."
                : "Upgrade to VSuccess PRO for unlimited searches, advanced analytics, and more."}
            </p>

            {/* CTA */}
            <div className="flex items-center gap-3 mt-3">
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg 
                           bg-gradient-to-r from-amber-500 to-orange-600 
                           hover:from-amber-400 hover:to-orange-500 
                           text-white text-xs font-semibold 
                           transition-all duration-300 
                           shadow-lg shadow-amber-500/20 
                           hover:shadow-amber-500/30
                           active:scale-[0.97]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade Now
              </button>
              <span className="text-[10px] text-white/30 font-medium">
                Coming soon
              </span>
            </div>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="flex items-center justify-center w-7 h-7 rounded-lg 
                     bg-white/5 hover:bg-white/10 
                     border border-white/[0.06] hover:border-white/[0.12] 
                     transition-all duration-200
                     text-white/30 hover:text-white/60 
                     flex-shrink-0
                     active:scale-90"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
