"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  BarChart3,
  Users,
  Clapperboard,
  Eye,
  Film,
  Smartphone,
  Monitor,
  ArrowUpDown,
  Calendar,
  AlertCircle,
  ExternalLink,
  Clock,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useFollowedChannelIds } from "@/hooks/useFollowedChannelIds";
import VideoCard from "@/components/VideoCard";
import VideoPlayerModal from "@/components/VideoPlayerModal";
import FollowButton from "@/components/FollowButton";
import { formatCount, getOutlierInfo, getEngagementLabel } from "@/lib/youtube";
import { checkBookmarks } from "@/lib/api";
import type { ChannelInspectResponse, ChannelInspectVideo } from "@/app/api/channel-inspect/route";

type SortMode = "date" | "views" | "outlier" | "engagement";
type VideoTypeFilter = "all" | "short" | "long";

/** Filter threshold: YouTube considers videos < 4 min (240s) as Shorts */
const SHORT_DURATION_THRESHOLD = 240;

interface Params {
  channelId: string;
}

export default function ChannelInspectPage({ params }: { params: Promise<Params> }) {
  const { channelId } = use(params);
  return <ChannelInspectContent channelId={channelId} />;
}

function ChannelInspectContent({ channelId }: { channelId: string }) {
  const { user: authUser } = useAuth();
  const { followedChannelIds, toggleFollowedChannel } = useFollowedChannelIds();
  const [data, setData] = useState<ChannelInspectResponse | null>(null);
  const [allVideos, setAllVideos] = useState<ChannelInspectVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [videoTypeFilter, setVideoTypeFilter] = useState<VideoTypeFilter>("all");
  const [viewMode, setViewMode] = useState<"latest" | "top">("latest");
  const [playingVideo, setPlayingVideo] = useState<ChannelInspectVideo | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // ── Fetch data ────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const maxResults = viewMode === "top" ? 50 : 30;
        const sort = viewMode === "top" ? "views" : "date";
        const res = await fetch(`/api/channel-inspect?channelId=${channelId}&maxResults=${maxResults}&sort=${sort}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.details || err.error || "Failed to fetch");
        }
        const result: ChannelInspectResponse = await res.json();
        if (cancelled) return;

        setData(result);
        setAllVideos(result.videos || []);

        // Bulk check bookmarks
        const ids = (result.videos || []).map((v) => v.id);
        if (ids.length > 0) {
          checkBookmarks(ids)
            .then((bookmarked) => {
              if (!cancelled) setBookmarkedIds(new Set(bookmarked));
            })
            .catch(() => {});
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [channelId, viewMode]);

  // ── Filtering (using actual video duration from contentDetails) ──
  const filteredAndSorted = allVideos
    .filter((v) => {
      if (videoTypeFilter === "short") {
        return v.durationSeconds > 0 && v.durationSeconds < SHORT_DURATION_THRESHOLD;
      }
      if (videoTypeFilter === "long") {
        return v.durationSeconds >= SHORT_DURATION_THRESHOLD;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortMode) {
        case "date":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case "views":
          return b.viewCount - a.viewCount;
        case "outlier":
          return b.outlierMultiplier - a.outlierMultiplier;
        case "engagement":
          return b.engagementRate - a.engagementRate;
        default:
          return 0;
      }
    });

  const SORT_OPTIONS: { value: SortMode; label: string; icon: typeof ArrowUpDown }[] = [
    { value: "date", label: "Date", icon: Calendar },
    { value: "views", label: "Views", icon: Eye },
    { value: "outlier", label: "Outlier", icon: TrendingUp },
    { value: "engagement", label: "Engagement", icon: BarChart3 },
  ];

  const TYPE_FILTERS: { value: VideoTypeFilter; label: string; icon: typeof Film }[] = [
    { value: "all", label: "All", icon: Film },
    { value: "short", label: "Shorts", icon: Smartphone },
    { value: "long", label: "Long Form", icon: Monitor },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="fixed inset-0 noise pointer-events-none" />

      {/* Gradient Orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header with back button ── */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/following"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10
                       border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 text-white/50" />
          </Link>

          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full shimmer" />
              <div className="space-y-2">
                <div className="h-5 shimmer rounded-lg w-48" />
                <div className="h-3 shimmer rounded-lg w-32" />
              </div>
            </div>
          ) : data ? (
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Channel avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {data.channelAvatar ? (
                  <img
                    src={data.channelAvatar}
                    alt={data.channelTitle}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-sm font-bold text-white/60">
                    {data.channelTitle.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-white truncate">
                    {data.channelTitle}
                  </h1>
                  <FollowButton
                    channelId={channelId}
                    channelTitle={data.channelTitle}
                    channelAvatar={data.channelAvatar}
                    size="sm"
                    initialFollowed={followedChannelIds.has(channelId)}
                    onStateChange={(nowFollowed) => toggleFollowedChannel(channelId, nowFollowed)}
                  />
                  <a
                    href={`https://www.youtube.com/channel/${channelId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10
                               border border-white/[0.06] text-white/30 hover:text-white/60 transition-all duration-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-400/60" />
                    <span className="text-xs text-white/50">{formatCount(data.subscriberCount)} subs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clapperboard className="w-3 h-3 text-purple-400/60" />
                    <span className="text-xs text-white/50">{formatCount(data.channelVideoTotalCount)} videos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-green-400/60" />
                    <span className="text-xs text-white/50">
                      {formatCount(Math.round(data.channelTotalViews / Math.max(data.channelVideoTotalCount, 1)))} avg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* ── View Mode Toggle (Latest vs Top Performing) ── */}
        {data && !loading && (
          <div className="mb-4 animate-fade-in-up">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
              <button
                onClick={() => setViewMode("latest")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer
                  ${viewMode === "latest"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/20 shadow-lg shadow-blue-500/5"
                    : "text-white/40 border border-transparent hover:text-white/60"
                  }
                `}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Latest</span>
                <span className="text-[10px] opacity-60">(30 videos)</span>
              </button>
              <button
                onClick={() => setViewMode("top")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer
                  ${viewMode === "top"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/20 shadow-lg shadow-amber-500/5"
                    : "text-white/40 border border-transparent hover:text-white/60"
                  }
                `}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Top Performing</span>
                <span className="text-[10px] opacity-60">(top 50)</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Sort & Filter Controls ── */}
        {data && !loading && (
          <div className="mb-6 animate-fade-in-up">
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              {/* Sort (only for Latest — Top Performing is already sorted by views server-side) */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <div className="flex gap-0.5">
                  {SORT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setSortMode(opt.value)}
                        title={viewMode === "top" && opt.value === "date" ? "Already sorted by views from server" : undefined}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap cursor-pointer
                          ${sortMode === opt.value
                            ? "bg-white/[0.08] text-white border border-white/[0.12]"
                            : "text-white/30 border border-transparent hover:text-white/50"
                          }
                        `}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-px h-5 bg-white/[0.06]" />

              {/* Video Type Filter */}
              <div className="flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <div className="flex gap-0.5">
                  {TYPE_FILTERS.map((tf) => {
                    const Icon = tf.icon;
                    return (
                      <button
                        key={tf.value}
                        onClick={() => setVideoTypeFilter(tf.value)}
                        title={tf.value === "short" ? "Videos shorter than 4 minutes (YouTube Shorts)" : tf.value === "long" ? "Videos 4 minutes or longer" : "All video types"}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap cursor-pointer
                          ${videoTypeFilter === tf.value
                            ? "bg-white/[0.08] text-white border border-white/[0.12]"
                            : "text-white/30 border border-transparent hover:text-white/50"
                          }
                        `}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{tf.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Count badge */}
              <div className="ml-auto">
                <span className="text-[11px] text-white/30">
                  {filteredAndSorted.length} of {allVideos.length} videos
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-white/[0.06]">
                <div className="aspect-video shimmer" />
                <div className="p-4 space-y-3">
                  <div className="h-4 shimmer rounded-lg w-3/4" />
                  <div className="h-3 shimmer rounded-lg w-1/2" />
                  <div className="flex gap-3">
                    <div className="h-3 shimmer rounded-lg w-16" />
                    <div className="h-3 shimmer rounded-lg w-16" />
                    <div className="h-3 shimmer rounded-lg w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSorted.length > 0 ? (
          <>
            {/* Stats bar */}
            <div className="flex items-center gap-4 mb-6 animate-fade-in">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-white/50">
                  <strong className="text-white/80">{filteredAndSorted.length}</strong>{" "}
                  {videoTypeFilter !== "all" ? videoTypeFilter : ""} videos
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-white/50">
                  <strong className="text-white/80">
                    {formatCount(filteredAndSorted.reduce((sum, v) => sum + v.viewCount, 0))}
                  </strong>{" "}
                  total views
                </span>
              </div>
            </div>

            {/* Video grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSorted.map((video, i) => (
                <div
                  key={video.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <VideoCard
                    video={video as any}
                    rank={i + 1}
                    onPlay={(v) => setPlayingVideo(v as any)}
                    initialBookmarked={bookmarkedIds.has(video.id)}
                    initialFollowed={followedChannelIds.has(video.channelId)}
                    onFollowToggle={(nowFollowed) =>
                      toggleFollowedChannel(video.channelId, nowFollowed)
                    }
                  />
                </div>
              ))}
            </div>
          </>
        ) : !loading && !error && data ? (
          /* Empty state */
          <div className="text-center py-20 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
              <Film className="w-6 h-6 text-white/20" />
            </div>
            <h2 className="text-lg font-semibold text-white/60 mb-2">No videos found</h2>
            <p className="text-sm text-white/30 max-w-md mx-auto">
              {videoTypeFilter !== "all"
                ? `No ${videoTypeFilter} videos found for this channel. Try a different filter.`
                : "This channel has no public videos or they may have been removed."}
            </p>
          </div>
        ) : null}

        {/* ── Footer ── */}
        <footer className="border-t border-white/[0.06] py-6 mt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white/20" />
              <span className="text-xs text-white/20">VSuccess — Channel Inspect</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal
        video={playingVideo ? {
          id: playingVideo.id,
          title: playingVideo.title,
          description: playingVideo.description,
          thumbnail: playingVideo.thumbnail,
          channelTitle: playingVideo.channelTitle,
          channelId: playingVideo.channelId,
          publishedAt: playingVideo.publishedAt,
          viewCount: playingVideo.viewCount,
          likeCount: playingVideo.likeCount,
          commentCount: playingVideo.commentCount,
          engagementRate: playingVideo.engagementRate,
          url: playingVideo.url,
          subscriberCount: playingVideo.subscriberCount,
          channelCreatedAt: playingVideo.channelCreatedAt,
          channelAvgViews: playingVideo.channelAvgViews,
          outlierMultiplier: playingVideo.outlierMultiplier,
          channelVideoCount: playingVideo.channelVideoCount,
        } : null}
        onClose={() => setPlayingVideo(null)}
      />
    </div>
  );
}
