"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FolderPlus,
  Plus,
  Check,
  Loader2,
  FolderOpen,
  X,
} from "lucide-react";
import {
  listCollections,
  createCollection,
  addToCollection,
  deleteCollection,
  type Collection,
} from "@/lib/api";

interface CollectionPickerProps {
  /** The bookmark ID to add to a collection */
  bookmarkId: number;
  /** Called after successfully adding to a collection */
  onAdded?: () => void;
  /** Called to close the picker */
  onClose: () => void;
  /** Optional video title for display */
  videoTitle?: string;
}

export default function CollectionPicker({
  bookmarkId,
  onAdded,
  onClose,
  videoTitle,
}: CollectionPickerProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Ref to prevent double-submission (instant guard, not subject to React batching)
  const submittingRef = useRef(false);

  // ── Fetch collections ─────────────────────────────
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

  // ── Add to collection ────────────────────────────
  const handleAddTo = useCallback(
    async (collectionId: number) => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      setAddingTo(collectionId);
      setError("");
      try {
        await addToCollection(collectionId, bookmarkId);
        onAdded?.();
        onClose();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to add to collection"
        );
      } finally {
        setAddingTo(null);
        submittingRef.current = false;
      }
    },
    [bookmarkId, onAdded, onClose]
  );

  // ── Create collection then add ────────────────────
  const handleCreateAndAdd = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Guard against double-submission (instant ref check, not React state)
      if (submittingRef.current || !newName.trim()) return;
      submittingRef.current = true;

      setCreating(true);
      setError("");

      let createdCollectionId: number | null = null;

      try {
        const col = await createCollection(
          newName.trim(),
          newDesc.trim() || undefined
        );
        createdCollectionId = col.id;

        // Now add the bookmark to the new collection
        await addToCollection(col.id, bookmarkId);

        onAdded?.();
        onClose();
      } catch (err) {
        // If we created the collection but adding the item failed,
        // roll back by deleting the collection
        if (createdCollectionId !== null) {
          try {
            await deleteCollection(createdCollectionId);
          } catch {
            // Best-effort cleanup
          }
        }

        setError(
          err instanceof Error ? err.message : "Failed to add to collection"
        );
      } finally {
        setCreating(false);
        submittingRef.current = false;
      }
    },
    [newName, newDesc, bookmarkId, onAdded, onClose]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 border border-white/[0.08] shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/25">
              <FolderPlus className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Add to Collection</h3>
              {videoTitle && (
                <p className="text-[11px] text-white/40 truncate max-w-[280px]">
                  {videoTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 
                       border border-white/[0.06] text-white/40 hover:text-white/70 transition-all duration-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[320px] overflow-y-auto">
          {error && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
            </div>
          ) : collections.length > 0 ? (
            <div className="space-y-1">
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => handleAddTo(col.id)}
                  disabled={addingTo === col.id || submittingRef.current}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                             bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08]
                             transition-all duration-200 group disabled:opacity-50"
                >
                  <FolderOpen className="w-4 h-4 text-purple-400/70 flex-shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm text-white/80 group-hover:text-white truncate">
                      {col.name}
                    </p>
                    <p className="text-[10px] text-white/30">
                      {col.item_count} video{col.item_count !== 1 ? "s" : ""}
                      {col.description ? ` — ${col.description}` : ""}
                    </p>
                  </div>
                  {addingTo === col.id ? (
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.06] 
                                   flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-3 h-3 text-white/40" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <FolderOpen className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/50 mb-1">No collections yet</p>
              <p className="text-xs text-white/30">Create one below to get started</p>
            </div>
          )}

          {/* Divider */}
          <div className="my-3 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] text-white/30 font-medium uppercase">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Create new collection form */}
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              disabled={submittingRef.current}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         border border-dashed border-white/[0.1] hover:border-purple-500/30
                         text-xs text-white/50 hover:text-purple-400 transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create new collection</span>
            </button>
          ) : (
            <form onSubmit={handleCreateAndAdd} className="space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name"
                maxLength={160}
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08]
                         text-sm text-white/80 placeholder-white/30 outline-none
                         focus:border-purple-500/40 focus:bg-white/[0.06] transition-all duration-200"
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08]
                         text-sm text-white/60 placeholder-white/30 outline-none
                         focus:border-purple-500/40 focus:bg-white/[0.06] transition-all duration-200"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10
                           border border-white/[0.06] text-xs text-white/50 hover:text-white/70 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || submittingRef.current || !newName.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                           bg-gradient-to-r from-purple-500 to-pink-600
                           hover:from-purple-400 hover:to-pink-500
                           disabled:from-purple-500/30 disabled:to-pink-600/30 disabled:cursor-not-allowed
                           text-xs text-white font-medium transition-all duration-300
                           shadow-lg shadow-purple-500/20"
                >
                  {creating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{creating ? "Creating..." : "Create & Add"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
