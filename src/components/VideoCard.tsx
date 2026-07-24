"use client";

import { useState } from "react";
import { Eye, Heart, MessageCircle, ExternalLink, Clock, BarChart3, Play } from "lucide-react";
import type { YouTubeVideo } from "@/lib/youtube";
import { getEngagementLabel, formatCount } from "@/lib/youtube";

interface VideoCardProps {
  video: YouTubeVideo;
  rank: number;
  onPlay?: (video: YouTubeVideo) => void;
}

export default function VideoCard({ video, rank, onPlay }: VideoCardProps) {
  const [imgError, setImgError] = useState(false);
  const engagementLabel = getEngagementLabel(video.engagementRate);
  const publishedDate = new Date(video.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <div className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden 
                      hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 
                      hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)]">
        {/* Rank Badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 
                          border border-white/[0.08] backdrop-blur-sm text-white font-bold text-sm">
            {rank}
          </div>
        </div>

        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 overflow-hidden cursor-pointer" onClick={() => onPlay?.(video)}>
          {!imgError ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-4xl opacity-20">🎬</div>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 
                          flex items-center justify-center transition-all duration-300 
                          group-hover:bg-white/30 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              <Play className="w-6 h-6 text-white ml-0.5" />
            </div>
          </div>

          {/* Engagement Badge */}
          <div className="absolute bottom-3 right-3">
            <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/[0.08] text-xs font-medium text-white">
              {engagementLabel}
            </div>
          </div>

          {/* View count overlay */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/[0.08]">
            <Eye className="w-3 h-3 text-white/70" />
            <span className="text-xs font-medium text-white">{formatCount(video.viewCount)}</span>
          </div>
        </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug text-white/90 line-clamp-2 group-hover:text-white transition-colors">
          {video.title}
        </h3>

        {/* Channel */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
            <span className="text-xs font-bold text-white/60">
              {video.channelTitle.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-white/50 truncate">{video.channelTitle}</span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-red-400/70" />
              <span className="text-xs text-white/50">{formatCount(video.likeCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-blue-400/70" />
              <span className="text-xs text-white/50">{formatCount(video.commentCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-green-400/70" />
              <span className="text-xs text-white/50">{video.engagementRate.toFixed(1)}%</span>
            </div>
          </div>
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 
                       border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300
                       text-xs text-white/50 hover:text-white/80"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Watch</span>
          </a>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-[11px] text-white/30">
          <Clock className="w-3 h-3" />
          <span>{publishedDate}</span>
        </div>
      </div>
    </div>
    </>
  );
}
