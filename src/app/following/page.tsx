"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  ExternalLink,
  Eye,
  Heart,
  Link2,
  MessageCircle,
  Clock,
  Loader2,
  UserMinus,
  UserPlus,
  Film,
  TrendingUp,
  BarChart3,
  Search,
} from "lucide-react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import FollowButton from "@/components/FollowButton";
import { listFollowedChannels, unfollowChannel, type FollowedChannel } from "@/lib/api";
import { formatCount, type ChannelLookupResult } from "@/lib/youtube";
import type { ChannelVideo } from "@/app/api/channel-videos/route";

export default function FollowingPage() {
  return (
    <AuthGuard>
      <FollowingContent />
    </AuthGuard>
  );
}

function FollowingContent() {
  const [channels, setChannels] = useState<FollowedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [channelVideos, setChannelVideos] = useState<Record<string, ChannelVideo[]>>({});
  const [loadingVideos, setLoadingVideos] = useState<Record<string, boolean>>({});
  const [unfollowing, setUnfollowing] = useState<string | null>(null);

  // Channel lookup (paste URL / @handle)
  const [lookupInput, setLookupInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupResult, setLookupResult] = useState<ChannelLookupResult | null>(null);
  const [lookupFollowed, setLookupFollowed] = useState(false);

  // ── Fetch followed channels ─────────────────
  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listFollowedChannels();
      setChannels(data);
    } catch {
      setError("Failed to load followed channels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // ── Fetch latest videos for a channel ──────
  const fetchChannelVideos = useCallback(async (channelId: string) => {
    setLoadingVideos((prev) => ({ ...prev, [channelId]: true }));
    try {
      const res = await fetch(`/api/channel-videos?channelId=${channelId}&maxResults=5`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setChannelVideos((prev) => ({ ...prev, [channelId]: data.videos || [] }));
    } catch {
      setChannelVideos((prev) => ({ ...prev, [channelId]: [] }));
    } finally {
      setLoadingVideos((prev) => ({ ...prev, [channelId]: false }));
    }
  }, []); // Fetch function is stable — guard check lives in handleToggleExpand

  // ── Toggle expand channel ──────────────────
  const handleToggleExpand = useCallback(
    (channelId: string) => {
      if (expandedChannel === channelId) {
        setExpandedChannel(null);
      } else {
        setExpandedChannel(channelId);
        // Only fetch if not already loaded (avoids unnecessary API calls 
        // without referencing channelVideos in the callback deps)
        if (!channelVideos[channelId]) {
          fetchChannelVideos(channelId);
        }
      }
    },
    [expandedChannel, channelVideos, fetchChannelVideos]
  );

  // ── Unfollow channel ───────────────────────
  const handleUnfollow = useCallback(
    async (e: React.MouseEvent, channel: FollowedChannel) => {
      e.stopPropagation();
      setUnfollowing(channel.channel_id);
      try {
        await unfollowChannel(channel.channel_id);
        setChannels((prev) => prev.filter((c) => c.channel_id !== channel.channel_id));
      } catch {
        // Best-effort
      } finally {
        setUnfollowing(null);
      }
    },
    []
  );

  // ── Lookup channel by URL / @handle ────────
  const handleLookup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const query = lookupInput.trim();
      if (!query || lookupLoading) return;

      setLookupLoading(true);
      setLookupError("");
      setLookupResult(null);

      try {
        const res = await fetch(`/api/channel-lookup?input=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!res.ok) {
          setLookupError(data.error || "Couldn't find that channel.");
          return;
        }
        setLookupResult(data.channel);
        setLookupFollowed(channels.some((c) => c.channel_id === data.channel.channelId));
      } catch {
        setLookupError("Network error. Please try again.");
      } finally {
        setLookupLoading(false);
      }
    },
    [lookupInput, lookupLoading, channels]
  );

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="fixed inset-0 noise pointer-events-none" />

      {/* Gradient Orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        {/* Top Bar */}
        <TopBar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Following</h1>
            <p className="text-sm text-white/40">Channels you follow</p>
          </div>
        </div>

        {/* Find a channel — paste URL or @handle */}
        <div className="mb-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-4 h-4 text-blue-400/70" />
            <h2 className="text-sm font-semibold text-white/70">Find a channel</h2>
            <span className="text-[10px] text-white/25 ml-auto">~1 API unit · 10k free/day</span>
          </div>

          <form onSubmit={handleLookup} className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="text"
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value)}
                placeholder="Paste a channel URL or @handle — e.g. youtube.com/@MrBeast"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]
                           text-sm text-white placeholder-white/25 outline-none
                           focus:border-blue-500/40 focus:bg-white/[0.05] transition-all duration-300"
              />
            </div>
            <button
              type="submit"
              disabled={!lookupInput.trim() || lookupLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600
                         hover:from-blue-400 hover:to-purple-500 text-white font-medium text-sm
                         transition-all duration-300 shadow-lg shadow-purple-500/10
                         disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {lookupLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>{lookupLoading ? "Looking up…" : "Find"}</span>
            </button>
          </form>

          {lookupError && (
            <p className="mt-2 text-xs text-red-400/80">{lookupError}</p>
          )}

          {/* Lookup result */}
          {lookupResult && (
            <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3 animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {lookupResult.avatar ? (
                  <img
                    src={lookupResult.avatar}
                    alt={lookupResult.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.classList.add("avatar-fallback");
                    }}
                  />
                ) : (
                  <span className="text-sm font-bold text-white/60">
                    {lookupResult.title.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/90 truncate">{lookupResult.title}</p>
                <p className="text-[11px] text-blue-400/50 truncate">
                  {lookupResult.handle || `youtube.com/channel/${lookupResult.channelId}`}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-white/40">
                  <span>{formatCount(lookupResult.subscriberCount)} subs</span>
                  <span>{formatCount(lookupResult.videoCount)} videos</span>
                  <span>{formatCount(lookupResult.totalViews)} views</span>
                </div>
              </div>

              <FollowButton
                key={lookupResult.channelId}
                channelId={lookupResult.channelId}
                channelTitle={lookupResult.title}
                channelAvatar={lookupResult.avatar}
                initialFollowed={lookupFollowed}
                onStateChange={(followed) => {
                  setLookupFollowed(followed);
                  fetchChannels();
                }}
              />

              {lookupFollowed && (
                <Link
                  href={`/channels/${lookupResult.channelId}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/15
                             text-blue-400/70 hover:bg-blue-500/15 hover:border-blue-500/30
                             text-xs font-medium transition-all duration-300 whitespace-nowrap"
                >
                  <Search className="w-3 h-3" />
                  <span>Inspect</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full shimmer" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 shimmer rounded-lg w-1/3" />
                    <div className="h-3 shimmer rounded-lg w-1/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : channels.length > 0 ? (
          <div className="space-y-3">
            {channels.map((channel) => (
              <div key={channel.id}>
                {/* Channel card — div with role="button" to avoid nested <button> issue */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleToggleExpand(channel.channel_id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggleExpand(channel.channel_id);
                    }
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left cursor-pointer
                    ${expandedChannel === channel.channel_id
                      ? "bg-white/[0.05] border-white/[0.12]"
                      : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]"
                    }
                  `}
                >
                  {/* Channel avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {channel.channel_avatar ? (
                      <img
                        src={channel.channel_avatar}
                        alt={channel.channel_title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).parentElement!.classList.add("avatar-fallback");
                        }}
                      />
                    ) : (
                      <span className="text-sm font-bold text-white/60">
                        {channel.channel_title.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Channel info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 truncate">
                      {channel.channel_title}
                    </p>
                    <p className="text-[11px] text-white/30">
                      Followed {new Date(channel.followed_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Inspect button */}
                  <Link
                    href={`/channels/${channel.channel_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                               bg-blue-500/5 border border-blue-500/15 text-blue-400/70
                               hover:bg-blue-500/15 hover:border-blue-500/30
                               text-xs font-medium transition-all duration-300"
                  >
                    <Search className="w-3 h-3" />
                    <span>Inspect</span>
                  </Link>

                  {/* Unfollow button */}
                  <button
                    onClick={(e) => handleUnfollow(e, channel)}
                    disabled={unfollowing === channel.channel_id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                               bg-red-500/5 border border-red-500/15 text-red-400/70
                               hover:bg-red-500/15 hover:border-red-500/30
                               text-xs font-medium transition-all duration-300 cursor-pointer
                               disabled:opacity-50"
                  >
                    {unfollowing === channel.channel_id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UserMinus className="w-3 h-3" />
                    )}
                    <span>Unfollow</span>
                  </button>

                  {/* Expand indicator */}
                  <div className={`w-5 h-5 flex items-center justify-center transition-transform duration-300 ${
                    expandedChannel === channel.channel_id ? "rotate-180" : ""
                  }`}>
                    <svg className="w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* Expanded videos section */}
                {expandedChannel === channel.channel_id && (
                  <div className="ml-14 mt-2 space-y-2 animate-fade-in">
                    {/* Loading videos */}
                    {loadingVideos[channel.channel_id] ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                      </div>
                    ) : channelVideos[channel.channel_id]?.length > 0 ? (
                      <div className="space-y-1">
                        {channelVideos[channel.channel_id].map((video, i) => (
                          <div
                            key={video.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200"
                          >
                            {/* Rank */}
                            <span className="text-[10px] font-bold text-white/20 w-4 text-right flex-shrink-0">
                              {i + 1}
                            </span>

                            {/* Thumbnail */}
                            <div className="w-20 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex-shrink-0">
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <a
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-white/80 hover:text-blue-400 line-clamp-1 transition-colors duration-200"
                              >
                                {video.title}
                              </a>
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3 text-white/30" />
                                  <span className="text-[10px] text-white/30">{formatCount(video.viewCount)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="w-3 h-3 text-red-400/40" />
                                  <span className="text-[10px] text-white/30">{formatCount(video.likeCount)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <BarChart3 className="w-3 h-3 text-green-400/40" />
                                  <span className="text-[10px] text-white/30">{video.engagementRate.toFixed(1)}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-white/30" />
                                  <span className="text-[10px] text-white/30">
                                    {new Date(video.publishedAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Watch link */}
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10
                                         border border-white/[0.06] hover:border-white/[0.12] text-white/30 hover:text-white/60
                                         transition-all duration-200 flex-shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-4 px-3">
                        <Film className="w-4 h-4 text-white/20" />
                        <p className="text-xs text-white/30">No recent videos found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-20 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
              <Users className="w-6 h-6 text-white/20" />
            </div>
            <h2 className="text-lg font-semibold text-white/60 mb-2">No channels followed yet</h2>
            <p className="text-sm text-white/30 max-w-md mx-auto mb-6">
              Paste a channel URL or @handle above to add it, or click the &quot;Follow&quot; button next to any channel in your video searches to start tracking their uploads here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600
                         hover:from-blue-400 hover:to-purple-500 text-white font-medium text-sm transition-all duration-300
                         shadow-lg shadow-purple-500/20"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Discover Videos</span>
            </Link>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
