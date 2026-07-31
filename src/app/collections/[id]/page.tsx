"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  ExternalLink,
  Eye,
  Clock,
  ArrowLeft,
  Loader2,
  Trash2,
  Edit3,
  Bookmark,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import {
  getCollectionDetail,
  updateCollection,
  deleteCollection,
  removeFromCollection,
  type CollectionDetailData,
  type CollectionItem,
} from "@/lib/api";
import { formatCount } from "@/lib/youtube";
import { useRouter } from "next/navigation";
import VideoLookup from "@/components/VideoLookup";

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = Number(params.id);

  const [data, setData] = useState<CollectionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Confirm delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Removing item
  const [removingId, setRemovingId] = useState<number | null>(null);

  // ── Fetch ─────────────────────────────────────────────
  const fetchDetail = useCallback(async () => {
    if (!collectionId) return;
    setLoading(true);
    setError("");
    try {
      const result = await getCollectionDetail(collectionId);
      if (!result) {
        setError("Collection not found");
        return;
      }
      setData(result);
    } catch {
      setError("Failed to load collection");
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // ── Edit ──────────────────────────────────────────────
  const handleStartEdit = () => {
    if (!data) return;
    setEditName(data.collection.name);
    setEditDesc(data.collection.description || "");
    setEditing(true);
  };

  const handleSaveEdit = useCallback(async () => {
    if (!editName.trim() || !data) return;
    try {
      const updated = await updateCollection(
        collectionId,
        editName.trim(),
        editDesc.trim() || undefined
      );
      setData((prev) =>
        prev ? { ...prev, collection: updated } : prev
      );
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update collection"
      );
    }
  }, [editName, editDesc, collectionId, data]);

  // ── Delete ────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    try {
      await deleteCollection(collectionId);
      router.push("/collections");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete collection"
      );
    }
  }, [collectionId, router]);

  // ── Remove item ───────────────────────────────────────
  const handleRemoveItem = useCallback(
    async (item: CollectionItem) => {
      setRemovingId(item.item_id);
      try {
        await removeFromCollection(collectionId, item.bookmark_id);
        setData((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((i) => i.item_id !== item.item_id),
                total: prev.total - 1,
              }
            : prev
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to remove from collection"
        );
      } finally {
        setRemovingId(null);
      }
    },
    [collectionId]
  );

  const collection = data?.collection;
  const items = data?.items || [];

  return (
    <AuthGuard>
      <div className="relative min-h-screen">
        <div className="fixed inset-0 bg-grid pointer-events-none" />
        <div className="fixed inset-0 noise pointer-events-none" />
        <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <Link
                    href="/collections"
                    className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Collections</span>
                  </Link>
                  <div className="w-px h-5 bg-white/[0.06]" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/20">
                    <FolderOpen className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    {collection && (
                      <>
                        <h1 className="text-lg font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-[400px]">
                          {collection.name}
                        </h1>
                        <p className="text-[10px] text-white/40 font-medium tracking-wider uppercase">
                          {data?.total || 0} video{(data?.total || 0) !== 1 ? "s" : ""}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {collection && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleStartEdit}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10
                               border border-white/[0.06] transition-all text-xs text-white/40 hover:text-white/70"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/15
                               border border-white/[0.06] hover:border-red-500/25 transition-all
                               text-xs text-white/40 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main */}
          <main className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
              {/* Video lookup — paste a URL to analyze & add directly to this collection */}
              <VideoLookup
                quickAddCollectionId={collectionId}
                quickAddCollectionName={collection?.name}
                onQuickAdded={fetchDetail}
              />

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Edit form */}
              {editing && collection && (
                <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-fade-in">
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={160}
                      autoFocus
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]
                               text-sm text-white/80 outline-none focus:border-purple-500/40 transition-all"
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]
                               text-sm text-white/60 outline-none focus:border-purple-500/40 transition-all"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditing(false)}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10
                                 border border-white/[0.06] text-xs text-white/50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editName.trim()}
                        className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30
                                 border border-green-500/25 text-xs text-green-400 transition-all
                                 disabled:opacity-40"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete confirm */}
              {showDeleteConfirm && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 animate-fade-in">
                  <p className="text-sm text-white/70 mb-3">
                    Delete &ldquo;{collection?.name}&rdquo; and all its videos?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.06]
                               text-xs text-white/50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30
                               border border-red-500/25 text-xs text-red-400 transition-all"
                    >
                      Delete Collection
                    </button>
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
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

              {/* Items Grid */}
              {!loading && items.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((item, i) => (
                    <div
                      key={item.item_id}
                      className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden
                                hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500
                                hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)]
                                animate-fade-in-up"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 overflow-hidden">
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt={item.video_title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-4xl opacity-20">🎬</div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Play overlay */}
                        <a
                          href={`https://www.youtube.com/watch?v=${item.video_id}`}
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
                          <span className="text-xs font-medium text-white">{formatCount(item.view_count)}</span>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => handleRemoveItem(item)}
                          disabled={removingId === item.item_id}
                          className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-lg
                                   bg-black/60 backdrop-blur-sm border border-white/[0.08]
                                   text-white/40 hover:text-red-400 hover:bg-red-500/20 hover:border-red-500/30
                                   transition-all duration-200 disabled:opacity-50"
                          title="Remove from collection"
                        >
                          {removingId === item.item_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                        </button>

                        {/* Date badge */}
                        <div className="absolute top-3 left-3">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/[0.08]">
                            <Clock className="w-3 h-3 text-white/50" />
                            <span className="text-[10px] text-white/60">
                              {new Date(item.added_at).toLocaleDateString("en-US", {
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
                          {item.video_title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/50 truncate max-w-[60%]">
                            {item.channel_title}
                          </span>
                          <a
                            href={`https://www.youtube.com/watch?v=${item.video_id}`}
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
              )}

              {/* Empty items */}
              {!loading && items.length === 0 && !error && (
                <div className="text-center py-32 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
                    <FolderOpen className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-xl font-semibold text-white/60 mb-3">
                    This collection is empty
                  </h3>
                  <p className="text-sm text-white/30 max-w-md mx-auto mb-8">
                    Add some bookmarked videos to this collection from the bookmarks page or the search results.
                  </p>
                  <Link
                    href="/bookmarks"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                             bg-gradient-to-r from-purple-500 to-pink-600
                             hover:from-purple-400 hover:to-pink-500 text-white font-medium text-sm
                             transition-all duration-300 shadow-lg shadow-purple-500/20"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>Go to Bookmarks</span>
                  </Link>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
