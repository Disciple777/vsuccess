"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FolderPlus,
  FolderOpen,
  Plus,
  Loader2,
  TrendingUp,
  Trash2,
  Edit3,
  MoreHorizontal,
  Check,
  X,
  Bookmark,
} from "lucide-react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import {
  listCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  type Collection,
} from "@/lib/api";
import VideoLookup from "@/components/VideoLookup";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Confirm delete
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Fetch ─────────────────────────────────────────────
  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listCollections();
      setCollections(data);
    } catch {
      setError("Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // ── Create ────────────────────────────────────────────
  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newName.trim()) return;
      setCreating(true);
      try {
        const col = await createCollection(
          newName.trim(),
          newDesc.trim() || undefined
        );
        setCollections((prev) => [col, ...prev]);
        setShowCreate(false);
        setNewName("");
        setNewDesc("");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create collection"
        );
      } finally {
        setCreating(false);
      }
    },
    [newName, newDesc]
  );

  // ── Edit ──────────────────────────────────────────────
  const handleStartEdit = (col: Collection) => {
    setEditingId(col.id);
    setEditName(col.name);
    setEditDesc(col.description || "");
  };

  const handleSaveEdit = useCallback(
    async (collectionId: number) => {
      if (!editName.trim()) return;
      try {
        const updated = await updateCollection(
          collectionId,
          editName.trim(),
          editDesc.trim() || undefined
        );
        setCollections((prev) =>
          prev.map((c) => (c.id === collectionId ? updated : c))
        );
        setEditingId(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update collection"
        );
      }
    },
    [editName, editDesc]
  );

  // ── Delete ────────────────────────────────────────────
  const handleDelete = useCallback(async (collectionId: number) => {
    try {
      await deleteCollection(collectionId);
      setCollections((prev) => prev.filter((c) => c.id !== collectionId));
      setDeletingId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete collection"
      );
    }
  }, []);

  return (
    <AuthGuard>
      <div className="relative min-h-screen">
        <div className="fixed inset-0 bg-grid pointer-events-none" />
        <div className="fixed inset-0 noise pointer-events-none" />
        <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Top Bar */}
          <TopBar />

          {/* Main */}
          <main className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Page Title */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/20">
                  <FolderOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    My Collections
                  </h1>
                  <p className="text-[10px] text-white/40 font-medium tracking-wider uppercase">
                    Organize your saved videos
                  </p>
                </div>
                <button
                  onClick={() => setShowCreate(!showCreate)}
                  className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600
                           hover:from-purple-400 hover:to-pink-500 text-white font-medium text-xs
                           transition-all duration-300 shadow-lg shadow-purple-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Collection</span>
                </button>
              </div>
              {/* Video lookup — paste a URL to analyze & save */}
              <VideoLookup />

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Create form */}
              {showCreate && (
                <form
                  onSubmit={handleCreate}
                  className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-fade-in"
                >
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Collection name"
                      maxLength={160}
                      autoFocus
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]
                               text-sm text-white/80 placeholder-white/30 outline-none
                               focus:border-purple-500/40 focus:bg-white/[0.06] transition-all"
                    />
                    <input
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]
                               text-sm text-white/60 placeholder-white/30 outline-none
                               focus:border-purple-500/40 focus:bg-white/[0.06] transition-all"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreate(false);
                          setNewName("");
                          setNewDesc("");
                        }}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10
                                 border border-white/[0.06] text-xs text-white/50 hover:text-white/70 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={creating || !newName.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg
                                 bg-gradient-to-r from-purple-500 to-pink-600
                                 hover:from-purple-400 hover:to-pink-500
                                 disabled:from-purple-500/30 disabled:to-pink-600/30 disabled:cursor-not-allowed
                                 text-xs text-white font-medium transition-all"
                      >
                        {creating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>Create</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Loading */}
              {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-2xl shimmer border border-white/[0.06]" />
                  ))}
                </div>
              )}

              {/* Collections Grid */}
              {!loading && collections.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {collections.map((col) => (
                    <div
                      key={col.id}
                      className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl
                                hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500
                                hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)]
                                overflow-hidden animate-fade-in-up"
                    >
                      {editingId === col.id ? (
                        // ── Edit Mode ──
                        <div className="p-4 space-y-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            maxLength={160}
                            autoFocus
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08]
                                     text-sm text-white/80 outline-none focus:border-purple-500/40 transition-all"
                          />
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Description"
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08]
                                     text-sm text-white/60 outline-none focus:border-purple-500/40 transition-all"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/50 hover:text-white/70 transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(col.id)}
                              disabled={!editName.trim()}
                              className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30
                                       border border-green-500/25 text-xs text-green-400 transition-all
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : deletingId === col.id ? (
                        // ── Delete Confirm Mode ──
                        <div className="p-4">
                          <p className="text-sm text-white/70 mb-3">
                            Delete &ldquo;{col.name}&rdquo; and all its items?
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/50 hover:text-white/70 transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDelete(col.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30
                                       border border-red-500/25 text-xs text-red-400 transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        // ── Display Mode ──
                        <Link
                          href={`/collections/${col.id}`}
                          className="block p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex-shrink-0">
                                <FolderOpen className="w-5 h-5 text-purple-400" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-white/90 truncate group-hover:text-white transition-colors">
                                  {col.name}
                                </h3>
                                <p className="text-xs text-white/40 mt-0.5">
                                  {col.item_count} video
                                  {col.item_count !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleStartEdit(col);
                                }}
                                className="flex items-center justify-center w-7 h-7 rounded-lg
                                         bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/[0.08]
                                         text-white/30 hover:text-white/60 transition-all"
                                title="Edit"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDeletingId(col.id);
                                }}
                                className="flex items-center justify-center w-7 h-7 rounded-lg
                                         bg-white/5 hover:bg-red-500/15 border border-transparent hover:border-red-500/25
                                         text-white/30 hover:text-red-400 transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {col.description && (
                            <p className="mt-2 text-xs text-white/40 line-clamp-2">
                              {col.description}
                            </p>
                          )}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && collections.length === 0 && !error && (
                <div className="text-center py-32 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
                    <FolderPlus className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-xl font-semibold text-white/60 mb-3">
                    No collections yet
                  </h3>
                  <p className="text-sm text-white/30 max-w-md mx-auto mb-8">
                    Create collections to organize your saved videos by topic,
                    project, or any way you like.
                  </p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                             bg-gradient-to-r from-purple-500 to-pink-600
                             hover:from-purple-400 hover:to-pink-500 text-white font-medium text-sm
                             transition-all duration-300 shadow-lg shadow-purple-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Collection</span>
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
