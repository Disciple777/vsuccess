"use client";

import { useEffect, useCallback } from "react";
import { Eye, Heart, MessageCircle, ExternalLink, BarChart3, X } from "lucide-react";
import type { YouTubeVideo } from "@/lib/youtube";
import { formatCount } from "@/lib/youtube";

interface VideoPlayerModalProps {
  video: YouTubeVideo | null;
  onClose: () => void;
}

export default function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (video) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [video, handleKeyDown]);

  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black animate-fade-in"
      onClick={onClose}
    >
      {/* Top bar overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 sm:p-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500/40 to-purple-500/40 flex items-center justify-center flex-shrink-0 border border-white/10">
            <span className="text-[10px] sm:text-xs font-bold text-white/80">
              {video.channelTitle.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-white/90 truncate max-w-[40vw] sm:max-w-[50vw]">
              {video.title}
            </h3>
            <p className="text-[10px] sm:text-xs text-white/50 truncate">{video.channelTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 
                       border border-red-500/20 hover:border-red-500/40 transition-all duration-200
                       text-[11px] sm:text-sm font-medium text-red-300 hover:text-red-200"
          >
            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">YouTube</span>
          </a>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 
                       backdrop-blur-md border border-white/[0.12] hover:border-white/[0.2] text-white/60 hover:text-white 
                       transition-all duration-200 text-[11px] sm:text-sm font-medium"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Video fills the ENTIRE screen edge-to-edge */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
        <iframe
          src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={video.title}
        />
      </div>

      {/* Bottom bar overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3 sm:gap-5 text-white/40">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="text-[10px] sm:text-xs">{formatCount(video.viewCount)} views</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400/50" />
            <span className="text-[10px] sm:text-xs">{formatCount(video.likeCount)}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400/50" />
            <span className="text-[10px] sm:text-xs">{formatCount(video.commentCount)}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-green-400/50" />
            <span className="text-xs">{video.engagementRate.toFixed(1)}% eng.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
