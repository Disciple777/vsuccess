"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  Search,
  Clapperboard,
  Music2,
  Camera,
  TrendingUp,
  Sparkles,
  Clock,
  Hash,
  Loader2,
  AlertCircle,
  Zap,
  BarChart3,
  Lightbulb,
  Globe,
  Key,
  Film,
  Smartphone,
  Monitor,
  Users,
  Calendar,
  Eye,
  Filter,
  ArrowUpDown,
  MousePointerClick,
} from "lucide-react";
import VideoCard from "@/components/VideoCard";
import VideoPlayerModal from "@/components/VideoPlayerModal";
import HelpTip from "@/components/HelpTip";
import TopBar from "@/components/TopBar";
import type { YouTubeVideo } from "@/lib/youtube";
import { formatCount } from "@/lib/youtube";
import { useSearchQuota } from "@/hooks/useSearchQuota";
import { useFollowedChannelIds } from "@/hooks/useFollowedChannelIds";
import UpgradeBanner from "@/components/UpgradeBanner";
import { checkBookmarks } from "@/lib/api";

type Interval = "24h" | "7d" | "30d";
type Platform = "youtube" | "tiktok" | "instagram";
type VideoType = "all" | "short" | "long";
type SortMode = "relevance" | "views";
type ResultsSort = "original" | "date" | "views" | "outlier" | "engagement";

interface ApiResponse {
  niche: string;
  interval: string;
  count: number;
  videos: YouTubeVideo[];
  nextPageToken?: string;
  generatedAt: string;
  error?: string;
  message?: string;
  details?: string;
}

const VIDEO_TYPES: { value: VideoType; label: string; icon: typeof Smartphone; description: string }[] = [
  { value: "all", label: "All Types", icon: Film, description: "All video durations" },
  { value: "short", label: "Shorts", icon: Smartphone, description: "Videos under 4 minutes" },
  { value: "long", label: "Long Form", icon: Monitor, description: "Videos over 4 minutes" },
];

const SORT_OPTIONS: { value: SortMode; label: string; icon: typeof ArrowUpDown; description: string }[] = [
  { value: "views", label: "Views", icon: TrendingUp, description: "Most-viewed videos first" },
  { value: "relevance", label: "Relevance", icon: MousePointerClick, description: "Best-matched results first (YouTube's own ranking)" },
];

// Client-side sort options for the results box (re-sorts the already-loaded videos)
const RESULT_SORT_OPTIONS: { value: ResultsSort; label: string; icon: typeof ArrowUpDown }[] = [
  { value: "original", label: "Original", icon: MousePointerClick },
  { value: "date", label: "Date", icon: Calendar },
  { value: "views", label: "Views", icon: Eye },
  { value: "outlier", label: "Outlier", icon: TrendingUp },
  { value: "engagement", label: "Engagement", icon: BarChart3 },
];

const INTERVALS: { value: Interval; label: string; icon: typeof Clock }[] = [
  { value: "24h", label: "Last 24 Hours", icon: Zap },
  { value: "7d", label: "Last 7 Days", icon: Clock },
  { value: "30d", label: "Last 30 Days", icon: TrendingUp },
];

const PLATFORMS: { value: Platform; label: string; icon: typeof Clapperboard; color: string; available: boolean }[] = [
  { value: "youtube", label: "YouTube", icon: Clapperboard, color: "text-red-400", available: true },
  { value: "tiktok", label: "TikTok", icon: Music2, color: "text-pink-400", available: false },
  { value: "instagram", label: "Instagram", icon: Camera, color: "text-orange-400", available: false },
];

// Example niches for quick select
const EXAMPLE_NICHES = [
  "fitness",
  "cooking",
  "tech reviews",
  "gaming",
  "travel vlog",
  "personal finance",
  "beauty & makeup",
  "productivity",
];

export default function Home() {
  const [niche, setNiche] = useState("");
  const [interval, setInterval] = useState<Interval>("7d");
  const [videoType, setVideoType] = useState<VideoType>("all");
  const [sort, setSort] = useState<SortMode>("views");
  const [resultsSort, setResultsSort] = useState<ResultsSort>("original");
  const [strict, setStrict] = useState(false);
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [apiKey, setApiKey] = useState("");
  const [maxSubscribers, setMaxSubscribers] = useState("");
  const [maxChannelAge, setMaxChannelAge] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const { followedChannelIds, toggleFollowedChannel } = useFollowedChannelIds();
  const {
    remaining: quotaRemaining,
    totalLimit: quotaTotal,
    showBanner: quotaShowBanner,
    dismissBanner: quotaDismissBanner,
    trackSearch: quotaTrackSearch,
  } = useSearchQuota();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [totalViews, setTotalViews] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<YouTubeVideo | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(async () => {
    const trimmedNiche = niche.trim();
    if (!trimmedNiche) {
      setError("Please enter a niche to search for");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(false);
    setVideos([]);

    try {
      const params = new URLSearchParams({
        niche: trimmedNiche,
        interval,
        videoType,
        platform,
        sort,
      });
      if (strict) {
        params.set("strict", "true");
      }
      if (apiKey.trim()) {
        params.set("apiKey", apiKey.trim());
      }
      if (maxSubscribers.trim()) {
        params.set("subscriberLimit", maxSubscribers.trim());
      }
      if (maxChannelAge.trim()) {
        params.set("maxChannelAge", maxChannelAge.trim());
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`/api/videos?${params}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.details || data.error || data.message || "Failed to fetch videos");
      }

      const newVideos = data.videos || [];
      setVideos(newVideos);
      setSearched(true);
      setNextPageToken(data.nextPageToken);
      setTotalViews(
        newVideos.reduce((sum, v) => sum + v.viewCount, 0)
      );

      // Bulk check which videos are bookmarked
      if (newVideos.length > 0) {
        checkBookmarks(newVideos.map((v) => v.id))
          .then((ids) => setBookmarkedIds(new Set(ids)))
          .catch(() => {});
      } else {
        setBookmarkedIds(new Set());
      }

      // Track search for free tier quota
      quotaTrackSearch(trimmedNiche);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [niche, interval, videoType, platform, sort, strict, apiKey, maxSubscribers, maxChannelAge, quotaTrackSearch]);

  const handleLoadMore = useCallback(async () => {
    if (!nextPageToken || loadingMore) return;

    setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        niche: niche.trim(),
        interval,
        videoType,
        platform,
        sort,
        pageToken: nextPageToken,
      });
      if (strict) {
        params.set("strict", "true");
      }
      if (apiKey.trim()) {
        params.set("apiKey", apiKey.trim());
      }
      if (maxSubscribers.trim()) {
        params.set("subscriberLimit", maxSubscribers.trim());
      }
      if (maxChannelAge.trim()) {
        params.set("maxChannelAge", maxChannelAge.trim());
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`/api/videos?${params}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.details || data.error || data.message || "Failed to load more videos");
      }

      const newVideos = data.videos || [];

      // Deduplicate by video ID
      const existingIds = new Set(videos.map((v) => v.id));
      const uniqueNewVideos = newVideos.filter((v) => !existingIds.has(v.id));

      setVideos((prev) => [...prev, ...uniqueNewVideos]);
      setNextPageToken(data.nextPageToken);
      setTotalViews((prev) => prev + uniqueNewVideos.reduce((sum, v) => sum + v.viewCount, 0));

      // Check bookmark status for new videos
      if (uniqueNewVideos.length > 0) {
        checkBookmarks(uniqueNewVideos.map((v) => v.id))
          .then((ids) => setBookmarkedIds((prev) => new Set([...prev, ...ids])))
          .catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong loading more videos");
    } finally {
      setLoadingMore(false);
    }
  }, [nextPageToken, loadingMore, niche, interval, videoType, platform, sort, strict, apiKey, videos, maxSubscribers, maxChannelAge]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // Client-side sorting of the currently loaded results. "original" preserves
  // the order the server returned (Relevance or Views from the top toggle).
  const sortedVideos = useMemo(() => {
    if (resultsSort === "original") return videos;
    const sorted = [...videos];
    switch (resultsSort) {
      case "date":
        return sorted.sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      case "views":
        return sorted.sort((a, b) => b.viewCount - a.viewCount);
      case "outlier":
        return sorted.sort((a, b) => b.outlierMultiplier - a.outlierMultiplier);
      case "engagement":
        return sorted.sort((a, b) => b.engagementRate - a.engagementRate);
      default:
        return videos;
    }
  }, [videos, resultsSort]);

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="fixed inset-0 noise pointer-events-none" />
      
      {/* Gradient Orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent blur-[120px] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Top Bar */}
        <TopBar />

        {/* Hero Section */}
        <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full 
                          bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 
                          border border-white/[0.08] mb-6 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-medium text-white/60">
                Viral Content Discovery
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-4 animate-fade-in-up">
              Find What&apos;s{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Popping
              </span>{" "}
              in Your Niche
            </h1>

            <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Enter any niche — from fitness to finance — and instantly discover 
              the most viral videos. Uncover what works, why it works, and get 
              inspired for your next hit.
            </p>

            {/* Search Form */}
            <div className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              {/* API Key Input */}
              {showApiKey && (
                <div className="mb-4 animate-fade-in">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Key className="w-4 h-4 text-white/30 flex-shrink-0" />
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your YouTube Data API v3 key (or set YOUTUBE_API_KEY in .env.local)"
                      className="flex-1 bg-transparent text-sm text-white/70 placeholder-white/30 outline-none"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-white/30 text-left">
                    Get your key from{" "}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400/60 hover:text-blue-400 underline underline-offset-2"
                    >
                      Google Cloud Console
                    </a>
                  </p>
                </div>
              )}

              {/* Main Input */}
              <div className="relative">
                <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] 
                              focus-within:border-white/[0.15] focus-within:bg-white/[0.05] transition-all duration-300
                              shadow-[0_0_30px_-10px_rgba(99,102,241,0.1)]">
                  <div className="flex items-center gap-2 pl-3">
                    <Hash className="w-5 h-5 text-white/30" />
                    <span className="text-sm text-white/30 hidden sm:block">niche</span>
                  </div>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., fitness, cooking, tech reviews..."
                    className="flex-1 bg-transparent text-base text-white placeholder-white/30 outline-none py-2"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading || !niche.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 
                             hover:from-blue-400 hover:to-purple-500 disabled:from-blue-500/30 disabled:to-purple-600/30
                             disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-300
                             shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{loading ? "Searching..." : "Find Videos"}</span>
                  </button>
                </div>
              </div>

              {/* Quick Niche Pills */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className="text-xs text-white/30 mr-1">Try:</span>
                {EXAMPLE_NICHES.map((example) => (
                  <button
                    key={example}
                    onClick={() => {
                      setNiche(example);
                    }}
                    className="px-3 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] 
                             border border-white/[0.06] hover:border-white/[0.12] 
                             text-xs text-white/40 hover:text-white/70 transition-all duration-300"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="pb-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              {/* Platform Selector */}
              <div className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-white/30 flex-shrink-0 hidden sm:block" />
                <div className="flex gap-0.5">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.value}
                        disabled={!p.available}
                        onClick={() => setPlatform(p.value)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap
                          ${platform === p.value && p.available
                            ? "bg-white/[0.08] text-white border border-white/[0.12]"
                            : "text-white/30 border border-transparent hover:text-white/50"
                          }
                          ${!p.available ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                        `}
                        title={!p.available ? `${p.label} — coming soon` : p.label}
                      >
                        <Icon className={`w-3.5 h-3.5 ${p.available ? p.color : ""}`} />
                        <span>{p.label}</span>
                        {!p.available && (
                          <span className="text-[9px] text-white/20 font-normal">soon</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-px h-5 bg-white/[0.06] hidden md:block" />

              {/* Interval Selector */}
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-white/30 flex-shrink-0 hidden sm:block" />
                <div className="flex gap-0.5">
                  {INTERVALS.map((int) => {
                    const Icon = int.icon;
                    return (
                      <button
                        key={int.value}
                        onClick={() => setInterval(int.value)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap
                          ${interval === int.value
                            ? "bg-white/[0.08] text-white border border-white/[0.12]"
                            : "text-white/30 border border-transparent hover:text-white/50"
                          }
                        `}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{int.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-px h-5 bg-white/[0.06] hidden md:block" />

              {/* Video Type Selector */}
              <div className="flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-white/30 flex-shrink-0 hidden sm:block" />
                <div className="flex gap-0.5">
                  {VIDEO_TYPES.map((vt) => {
                    const Icon = vt.icon;
                    return (
                      <button
                        key={vt.value}
                        onClick={() => setVideoType(vt.value)}
                        title={vt.description}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap
                          ${videoType === vt.value
                            ? "bg-white/[0.08] text-white border border-white/[0.12]"
                            : "text-white/30 border border-transparent hover:text-white/50"
                          }
                        `}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{vt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-px h-5 bg-white/[0.06] hidden md:block" />

              {/* Sort Selector */}
              <div className="flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0 hidden sm:block" />
                <div className="flex gap-0.5">
                  {SORT_OPTIONS.map((so) => {
                    const Icon = so.icon;
                    return (
                      <button
                        key={so.value}
                        onClick={() => setSort(so.value)}
                        title={so.description}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap
                          ${sort === so.value
                            ? "bg-white/[0.08] text-white border border-white/[0.12]"
                            : "text-white/30 border border-transparent hover:text-white/50"
                          }
                        `}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{so.label}</span>
                      </button>
                    );
                  })}
                </div>
                <HelpTip
                  align="right"
                  text={"Views — most-watched videos first.\nRelevance — YouTube's best-matched results first, softly re-ranked so videos containing your exact niche phrase float to the top."}
                />
              </div>

              <div className="w-px h-5 bg-white/[0.06] hidden md:block" />

              {/* Strict Relevance Toggle */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStrict(!strict)}
                  title={strict
                    ? "Strict relevance ON — only showing videos that clearly match your niche"
                    : "Strict relevance OFF — showing best-matched videos first (soft re-rank)"}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap border
                    ${strict
                      ? "bg-amber-500/10 text-amber-300 border-amber-400/30"
                      : "text-white/30 border-transparent hover:text-white/50"
                    }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Strict</span>
                  <span className={`text-[9px] font-normal ${strict ? "text-amber-400/70" : "text-white/20"}`}>
                    {strict ? "ON" : "OFF"}
                  </span>
                </button>
                <HelpTip
                  align="right"
                  text={"Strict OFF — everything is shown; best-matching videos are promoted to the top (soft re-rank).\n\nStrict ON — videos that don't clearly match your niche are hidden entirely (must contain your exact phrase or at least 2 of your search words)."}
                />
              </div>

              <div className="w-px h-5 bg-white/[0.06] hidden md:block" />

              {/* Subscriber Limit Filter */}
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-white/30 flex-shrink-0 hidden sm:block" />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white/30 font-medium hidden sm:block">Max Subs</span>
                  <input
                    type="number"
                    value={maxSubscribers}
                    onChange={(e) => setMaxSubscribers(e.target.value)}
                    placeholder="All"
                    min="0"
                    className="w-20 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] 
                             text-xs text-white/70 placeholder-white/30 outline-none
                             focus:border-white/[0.15] focus:bg-white/[0.06] transition-all duration-200
                             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {maxSubscribers.trim() && (
                  <button
                    onClick={() => setMaxSubscribers("")}
                    className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="w-px h-5 bg-white/[0.06] hidden md:block" />

              {/* Channel Age Filter */}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-white/30 flex-shrink-0 hidden sm:block" />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white/30 font-medium hidden sm:block">Max Age</span>
                  <input
                    type="number"
                    value={maxChannelAge}
                    onChange={(e) => setMaxChannelAge(e.target.value)}
                    placeholder="Any"
                    min="0"
                    className="w-16 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] 
                             text-xs text-white/70 placeholder-white/30 outline-none
                             focus:border-white/[0.15] focus:bg-white/[0.06] transition-all duration-200
                             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] text-white/30 font-medium hidden sm:block">months</span>
                </div>
                {maxChannelAge.trim() && (
                  <button
                    onClick={() => setMaxChannelAge("")}
                    className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Error State */}
        {error && (
          <section className="px-4 sm:px-6 lg:px-8 mb-6 animate-fade-in">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-300 font-medium">Error</p>
                  <p className="text-sm text-red-200/60 mt-0.5">{error}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <section className="px-4 sm:px-6 lg:px-8 mb-12 animate-fade-in">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
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
            </div>
          </section>
        )}

        {/* Results Section */}
        {(videos.length > 0 || searched) && !loading && (
          <section ref={resultsRef} className="px-4 sm:px-6 lg:px-8 pb-20">
            <div className="max-w-7xl mx-auto">
              {/* Upgrade Banner */}
              {quotaShowBanner && quotaRemaining !== null && (
                <UpgradeBanner
                  remaining={quotaRemaining}
                  totalLimit={quotaTotal}
                  onDismiss={quotaDismissBanner}
                />
              )}

              {/* Stats Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Results for &ldquo;{niche}&rdquo;
                  </h3>
                  <p className="text-sm text-white/40 mt-1">
                    Based on {interval === "24h" ? "the last 24 hours" : interval === "7d" ? "the last 7 days" : "the last 30 days"} of YouTube data
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-white/50">
                      <strong className="text-white/80">{videos.length}</strong> videos
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-white/50">
                      <strong className="text-white/80">{formatCount(totalViews)}</strong> total views
                    </span>
                  </div>
                </div>
              </div>

              {/* Results Sort Box — re-sorts the already-loaded videos (client-side) */}
              {videos.length > 0 && (
                <div className="mb-6 animate-fade-in">
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    {/* Sort buttons */}
                    <div className="flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      <div className="flex gap-0.5">
                        {RESULT_SORT_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setResultsSort(opt.value)}
                              title={
                                opt.value === "original"
                                  ? "Preserve the order from the Relevance / Views toggle"
                                  : `Sort by ${opt.label.toLowerCase()}`
                              }
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap cursor-pointer
                                ${resultsSort === opt.value
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

                    <div className="w-px h-5 bg-white/[0.06] hidden sm:block" />

                    {/* Count badge */}
                    <div className="ml-auto">
                      <span className="text-[11px] text-white/30">
                        {sortedVideos.length} of {videos.length} videos
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Grid */}
              {videos.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedVideos.map((video, i) => (
                      <div
                        key={video.id}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <VideoCard
                          video={video}
                          rank={i + 1}
                          onPlay={setPlayingVideo}
                          initialBookmarked={bookmarkedIds.has(video.id)}
                          initialFollowed={followedChannelIds.has(video.channelId)}
                          onFollowToggle={(nowFollowed) =>
                            toggleFollowedChannel(video.channelId, nowFollowed)
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  <div className="flex justify-center mt-8">
                    {nextPageToken ? (
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] 
                                   border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300
                                   text-sm font-medium text-white/50 hover:text-white/80
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                            <span>Load More Videos</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <p className="text-xs text-white/20">
                        {videos.length >= 20 ? "No more results available" : "All results loaded"}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
                    <Search className="w-6 h-6 text-white/20" />
                  </div>
                  <h4 className="text-lg font-semibold text-white/60 mb-2">No videos found</h4>
                  <p className="text-sm text-white/30 max-w-md mx-auto">
                    Try a different niche or time interval. Make sure your niche is specific enough 
                    to return relevant results.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Empty State (before first search) */}
        {!searched && !loading && videos.length === 0 && (
          <section className="px-4 sm:px-6 lg:px-8 pb-20">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                {/* Step 1 */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-white/[0.08] mb-4">
                    <Hash className="w-5 h-5 text-blue-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-white/80 mb-2">1. Enter Your Niche</h4>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Any niche works — from broad topics like &quot;fitness&quot; to hyper-specific 
                    ones like &quot;calisthenics for beginners&quot;
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-white/[0.08] mb-4">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-white/80 mb-2">2. Pick Your Interval</h4>
                  <p className="text-xs text-white/40 leading-relaxed">
                    See what&apos;s popping in the last 24 hours, 7 days, or 30 days 
                    — catch trends early or analyze established hits
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-white/[0.08] mb-4">
                    <Lightbulb className="w-5 h-5 text-pink-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-white/80 mb-2">3. Get Inspired</h4>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Analyze what&apos;s working — titles, hooks, engagement patterns 
                    — and create your own viral spin
                  </p>
                </div>
              </div>

              {/* Coming Soon Banner */}
              <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 
                            border border-white/[0.06] text-center animate-fade-in" style={{ animationDelay: "0.6s" }}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white/60">Coming Soon</span>
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-xs text-white/30">
                  TikTok & Instagram support — AI-powered viral analysis — Personalized idea generation — Save & compare niches
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-white/[0.06] py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white/20" />
              <span className="text-xs text-white/20">VSuccess — Viral Video Ideas Finder</span>
            </div>
            <p className="text-[11px] text-white/20">
              Powered by YouTube Data API v3. TikTok & Instagram integration coming soon.
            </p>
          </div>
        </footer>
      </div>

      {/* Global Video Player Modal — rendered at app root level for true fullscreen */}
      <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
    </div>
  );
}
