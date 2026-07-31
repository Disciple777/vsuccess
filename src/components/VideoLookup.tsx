"use client";

import { useState, useCallback } from "react";
import { Link2, Search, Loader2, FolderPlus, Check, PlayCircle } from "lucide-react";
import type { YouTubeVideo } from "@/lib/youtube";
import VideoCard from "@/components/VideoCard";
import VideoPlayerModal from "@/components/VideoPlayerModal";
import { checkBookmarks, saveBookmark, addToCollection, listBookmarks } from "@/lib/api";
import { useFollowedChannelIds } from "@/hooks/useFollowedChannelIds";

interface VideoLookupProps {
  /** When on a collection detail page, shows an "Add to this collection" quick action */
  quickAddCollectionId?: number;
  /** Name of the collection, for the quick-add button label */
  quickAddCollectionName?: string;
  /** Called after the video is added to the collection (e.g. refresh items) */
  onQuickAdded?: () => void;
  /** Called when bookmark state changes (e.g. refresh the bookmarks list) */
  onBookmarkToggle?: (nowBookmarked: boolean) => void;
}

export default function VideoLookup({
  quickAddCollectionId,
  quickAddCollectionName,
  onQuickAdded,
  onBookmarkToggle,
}: VideoLookupProps) {
  const { followedChannelIds, toggleFollowedChannel } = useFollowedChannelIds();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<YouTubeVideo | null>(null);

  // Quick-add state
  const [quickAdding, setQuickAdding] = useState(false);
  const [quickAdded, setQuickAdded] = useState(false);
  const [quickError, setQuickError] = useState("");

  // ── Look up a video by URL / ID ──────────────────────
  const handleLookup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const query = input.trim();
      if (!query || loading) return;

      setLoading(true);
      setError("");
      setVideo(null);
      setBookmarked(false);
      setQuickAdded(false);
      setQuickError("");

      try {
        const res = await fetch(`/api/video-lookup?input=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Couldn't find that video.");
          return;
        }

        setVideo(data.video);

        // Check whether it's already bookmarked
        try {
          const ids = await checkBookmarks([data.video.id]);
          if (ids.includes(data.video.id)) setBookmarked(true);
        } catch {
          // Best-effort
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [input, loading]
  );

  // ── Quick-add to a specific collection ───────────────
  const handleQuickAdd = useCallback(async () => {
    if (!video || !quickAddCollectionId || quickAdding) return;
    setQuickAdding(true);
    setQuickError("");

    try {
      // Resolve a bookmark ID for this video (create one if needed)
      let bookmarkId: number | null = null;

      if (!bookmarked) {
        try {
          bookmarkId = await saveBookmark({
            video_id: video.id,
            video_title: video.title,
            channel_title: video.channelTitle,
            channel_id: video.channelId,
            thumbnail_url: video.thumbnail,
            view_count: video.viewCount,
          });
          setBookmarked(true);
        } catch (err) {
          // Only treat as "already bookmarked" — rethrow real failures
          if (!(err instanceof Error) || !err.message.toLowerCase().includes("already bookmarked")) {
            throw err;
          }
        }
      }

      // Locate the existing bookmark ID (search through paginated bookmarks)
      if (!bookmarkId) {
        let page = 1;
        while (page <= 10) {
          const data = await listBookmarks(page, 100);
          const found = data?.bookmarks.find((b) => b.video_id === video.id);
          if (found?.id) {
            bookmarkId = found.id;
            break;
          }
          if (!data?.has_more) break;
          page += 1;
        }
      }

      if (!bookmarkId) {
        throw new Error("Couldn't locate the bookmark for this video.");
      }

      await addToCollection(quickAddCollectionId, bookmarkId);
      setQuickAdded(true);
      onQuickAdded?.();
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : "Failed to add to collection");
    } finally {
      setQuickAdding(false);
    }
  }, [video, quickAddCollectionId, quickAdding, bookmarked, onQuickAdded]);

  return (
    <div className="mb-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <PlayCircle className="w-4 h-4 text-red-400/70" />
        <h2 className="text-sm font-semibold text-white/70">Find a video</h2>
        <span className="text-[10px] text-white/25 ml-auto">~2 API units · 5k free/day</span>
      </div>

      {/* Input */}
      <form onSubmit={handleLookup} className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a video URL or ID — e.g. youtube.com/watch?v=..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]
                       text-sm text-white placeholder-white/25 outline-none
                       focus:border-red-500/40 focus:bg-white/[0.05] transition-all duration-300"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-600
                     hover:from-red-400 hover:to-orange-500 text-white font-medium text-sm
                     transition-all duration-300 shadow-lg shadow-red-500/10
                     disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>{loading ? "Looking up…" : "Find"}</span>
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-red-400/80">{error}</p>}

      {/* Result */}
      {video && (
        <div className="mt-4 space-y-3">
          {/* Quick-add to this collection (collection detail page only) */}
          {quickAddCollectionId && (
            <div>
              <button
                onClick={handleQuickAdd}
                disabled={quickAdding || quickAdded}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                           transition-all duration-300 cursor-pointer
                           ${
                             quickAdded
                               ? "bg-green-500/15 border border-green-500/25 text-green-400"
                               : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white shadow-lg shadow-purple-500/10"
                           } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {quickAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : quickAdded ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <FolderPlus className="w-4 h-4" />
                )}
                <span>
                  {quickAdding
                    ? "Adding…"
                    : quickAdded
                      ? `Added to “${quickAddCollectionName || "this collection"}”`
                      : `Add to “${quickAddCollectionName || "this collection"}”`}
                </span>
              </button>
              {quickError && <p className="mt-1.5 text-xs text-red-400/80">{quickError}</p>}
            </div>
          )}

          {/* Full VideoCard — same stats as the main page */}
          <div className="w-full max-w-sm">
            <VideoCard
              video={video}
              rank={1}
              onPlay={setPlayingVideo}
              initialBookmarked={bookmarked}
              onBookmarkToggle={(now) => {
                setBookmarked(now);
                onBookmarkToggle?.(now);
              }}
              initialFollowed={followedChannelIds.has(video.channelId)}
              onFollowToggle={(nowFollowed) =>
                toggleFollowedChannel(video.channelId, nowFollowed)
              }
            />
          </div>
        </div>
      )}

      {/* Inline player */}
      <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
    </div>
  );
}
