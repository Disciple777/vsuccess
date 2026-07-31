"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bookmark,
  Heart,
  Loader2,
  ExternalLink,
  Eye,
  BarChart3,
  TrendingUp,
  Clock,
  ArrowLeft,
  BookOpen,
  FolderPlus,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { listBookmarks, type Bookmark as BookmarkType } from "@/lib/api";
import { formatCount } from "@/lib/youtube";
import CollectionPicker from "@/components/CollectionPicker";
import VideoLookup from "@/components/VideoLookup";

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [pickerBmId, setPickerBmId] = useState<number | null>(null);

  const fetchBookmarks = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError("");

    try {
      const data = await listBookmarks(pageNum, 20);
      if (!data) {
        setError("Failed to load bookmarks. Make sure you're logged in.");
        return;
      }

      if (pageNum === 1) {
        setBookmarks(data.bookmarks);
      } else {
        setBookmarks((prev) => [...prev, ...data.bookmarks]);
      }

      setTotal(data.total);
      setHasMore(data.has_more);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks(1);
  }, [fetchBookmarks]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchBookmarks(page + 1);
    }
  };

  // ── Render ──────────────────────────────────────────
  return (
    <AuthGuard>
      <div className="relative min-h-screen">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-grid pointer-events-none" />
        <div className="fixed inset-0 noise pointer-events-none" />

        {/* Gradient Orbs */}
        <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back</span>
                  </Link>
                  <div className="w-px h-5 bg-white/[0.06]" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg shadow-red-500/20">
                    <Bookmark className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white tracking-tight">
                      My Bookmarks
                    </h1>
                    <p className="text-[10px] text-white/40 font-medium tracking-wider uppercase">
                      Saved videos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <Heart className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs text-white/50">
                    <strong className="text-white/80">{total}</strong> saved
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
              {/* Video lookup — paste a URL to analyze & save */}
              <VideoLookup onBookmarkToggle={() => fetchBookmarks(1)} />

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Loading */}
              {loading && bookmarks.length === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-white/[0.06]">
                      <div className="aspect-video shimmer" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 shimmer rounded-lg w-3/4" />
                        <div className="h-3 shimmer rounded-lg w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bookmarks Grid */}
              {!loading && bookmarks.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {bookmarks.map((bm, i) => (
                      <div
                        key={bm.id}
                        className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden
                                  hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500
                                  hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)]
                                  animate-fade-in-up"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 overflow-hidden">
                          {bm.thumbnail_url ? (
                            <img
                              src={bm.thumbnail_url}
                              alt={bm.video_title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-4xl opacity-20">🎬</div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                          {/* Video link overlay */}
                          <a
                            href={`https://www.youtube.com/watch?v=${bm.video_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                          >
                            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30
                                          flex items-center justify-center transition-all duration-300
                                          group-hover:bg-white/30 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                              <ExternalLink className="w-6 h-6 text-white" />
                            </div>
                          </a>

                          {/* View count */}
                          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/[0.08]">
                            <Eye className="w-3 h-3 text-white/70" />
                            <span className="text-xs font-medium text-white">{formatCount(bm.view_count)}</span>
                          </div>

                          {/* Bookmark icon + Add to Collection on thumbnail */}
                          <div className="absolute top-3 right-3 flex items-center gap-1">
                            <button
                              onClick={() => setPickerBmId(bm.id)}
                              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 cursor-pointer
                                       bg-black/40 backdrop-blur-sm border border-white/[0.08]
                                       hover:bg-purple-500/15 hover:border-purple-500/25"
                              title="Add to collection"
                            >
                              <FolderPlus className="w-3.5 h-3.5 text-white/50 hover:text-purple-400 transition-colors" />
                            </button>
                            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/25">
                              <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                            </div>
                          </div>

                          {/* Date badge */}
                          <div className="absolute top-3 left-3">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/[0.08]">
                              <Clock className="w-3 h-3 text-white/50" />
                              <span className="text-[10px] text-white/60">
                                {new Date(bm.saved_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3">
                          <h3 className="font-semibold text-sm leading-snug text-white/90 line-clamp-2 group-hover:text-white transition-colors">
                            {bm.video_title}
                          </h3>

                          {/* Channel + Stats */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/50 truncate max-w-[60%]">
                              {bm.channel_title}
                            </span>
                            <a
                              href={`https://www.youtube.com/watch?v=${bm.video_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10
                                       border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300
                                       text-xs text-white/50 hover:text-white/80 flex-shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Watch</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More */}
                  {hasMore && (
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08]
                                 border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300
                                 text-sm font-medium text-white/50 hover:text-white/80
                                 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                            <span>Load More</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {!loading && bookmarks.length === 0 && !error && (
                <div className="text-center py-32 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
                    <BookOpen className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-xl font-semibold text-white/60 mb-3">No bookmarks yet</h3>
                  <p className="text-sm text-white/30 max-w-md mx-auto mb-8">
                    Start saving videos you find interesting! Click the heart icon on any video to bookmark it.
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600
                             hover:from-blue-400 hover:to-purple-500 text-white font-medium text-sm transition-all duration-300
                             shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Discover Videos</span>
                  </Link>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Collection Picker */}
      {pickerBmId && (
        <CollectionPicker
          bookmarkId={pickerBmId}
          onAdded={() => setPickerBmId(null)}
          onClose={() => setPickerBmId(null)}
        />
      )}
    </AuthGuard>
  );
}
