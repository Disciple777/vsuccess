"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Heart, FolderPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { saveBookmark, deleteBookmark } from "@/lib/api";
import { useRouter } from "next/navigation";
import CollectionPicker from "@/components/CollectionPicker";

interface BookmarkButtonProps {
  videoId: string;
  videoTitle: string;
  channelTitle: string;
  channelId?: string;
  thumbnailUrl?: string;
  viewCount: number;
  /** Initial bookmarked state (e.g., after checking search results) */
  initialBookmarked?: boolean;
  /** Called after the toggle completes (for parent to refresh state) */
  onToggle?: (nowBookmarked: boolean) => void;
  /** Optional bookmark ID if already known (e.g., from bookmarks page) */
  knownBookmarkId?: number;
}

export default function BookmarkButton({
  videoId,
  videoTitle,
  channelTitle,
  channelId,
  thumbnailUrl,
  viewCount,
  initialBookmarked = false,
  onToggle,
  knownBookmarkId,
}: BookmarkButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [animating, setAnimating] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<number | null>(knownBookmarkId ?? null);
  const [showPicker, setShowPicker] = useState(false);

  // Ref to prevent prop sync from overwriting user's manual toggle
  const userToggled = useRef(false);

  // Sync internal state when initialBookmarked changes — but only if
  // the user hasn't manually toggled. This prevents the async bulk-check
  // (which was initiated before the user clicked) from reverting the
  // optimistic update.
  useEffect(() => {
    if (!userToggled.current) {
      setBookmarked(initialBookmarked);
    }
  }, [initialBookmarked]);

  // Sync bookmark ID if knownBookmarkId is provided
  useEffect(() => {
    if (knownBookmarkId !== undefined) {
      setBookmarkId(knownBookmarkId);
    }
  }, [knownBookmarkId]);

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Mark that user has interacted — prop sync will be ignored
      userToggled.current = true;

      // Optimistic toggle
      const newState = !bookmarked;
      setBookmarked(newState);
      setAnimating(true);

      try {
        if (newState) {
          const id = await saveBookmark({
            video_id: videoId,
            video_title: videoTitle,
            channel_title: channelTitle,
            channel_id: channelId,
            thumbnail_url: thumbnailUrl,
            view_count: viewCount,
          });
          setBookmarkId(id);
          onToggle?.(true);
        } else {
          await deleteBookmark(videoId);
          setBookmarkId(null);
          onToggle?.(false);
        }
      } catch {
        // Revert on failure
        setBookmarked(!newState);
      } finally {
        setTimeout(() => setAnimating(false), 600);
      }
    },
    [user, bookmarked, videoId, videoTitle, channelTitle, channelId, thumbnailUrl, viewCount, router, onToggle]
  );

  const handleShowPicker = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (bookmarkId) {
        setShowPicker(true);
      }
    },
    [bookmarkId]
  );

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={handleToggle}
          className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 z-10 cursor-pointer
            ${
              bookmarked
                ? "bg-red-500/15 border border-red-500/25 hover:bg-red-500/25"
                : "bg-black/40 backdrop-blur-sm border border-white/[0.08] hover:bg-white/15 group-hover:border-white/[0.15]"
            }
          `}
          title={bookmarked ? "Remove from saved" : "Save video"}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-all duration-300 ${
              bookmarked
                ? "fill-red-400 text-red-400"
                : "text-white/50 hover:text-white/80"
            } ${animating ? (bookmarked ? "animate-ping" : "animate-pulse") : ""}`}
          />
        </button>

        {/* Collection button — visible when bookmarked */}
        {bookmarked && bookmarkId && (
          <button
            onClick={handleShowPicker}
            className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 z-10 cursor-pointer
                       bg-black/40 backdrop-blur-sm border border-white/[0.08]
                       hover:bg-purple-500/15 hover:border-purple-500/25"
            title="Add to collection"
          >
            <FolderPlus className="w-3.5 h-3.5 text-white/50 hover:text-purple-400 transition-colors" />
          </button>
        )}
      </div>

      {/* Collection Picker Modal */}
      {showPicker && bookmarkId && (
        <CollectionPicker
          bookmarkId={bookmarkId}
          onAdded={() => setShowPicker(false)}
          onClose={() => setShowPicker(false)}
          videoTitle={videoTitle}
        />
      )}
    </>
  );
}
