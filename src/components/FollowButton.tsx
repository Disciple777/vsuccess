"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Check, Loader2, UserMinus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { followChannel, unfollowChannel } from "@/lib/api";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
  channelId: string;
  channelTitle: string;
  channelAvatar?: string;
  /** Initial followed state */
  initialFollowed?: boolean;
  /** Size variant */
  size?: "sm" | "xs";
  /** Called with the new state after a successful follow/unfollow */
  onStateChange?: (followed: boolean) => void;
}

export default function FollowButton({
  channelId,
  channelTitle,
  channelAvatar,
  initialFollowed = false,
  size = "xs",
  onStateChange,
}: FollowButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [followed, setFollowed] = useState(initialFollowed);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ref to prevent prop sync from overwriting the user's manual toggle
  const userToggled = useRef(false);

  // Sync internal state when initialFollowed changes (async fetch may resolve
  // after the card mounts) — but only if the user hasn't manually toggled.
  useEffect(() => {
    if (!userToggled.current) {
      setFollowed(initialFollowed);
    }
  }, [initialFollowed]);

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Mark that the user has interacted — prop sync will be ignored
      userToggled.current = true;

      setLoading(true);
      const newState = !followed;
      setFollowed(newState);

      try {
        if (newState) {
          await followChannel({
            channel_id: channelId,
            channel_title: channelTitle,
            channel_avatar: channelAvatar,
          });
        } else {
          await unfollowChannel(channelId);
        }
        onStateChange?.(newState);
        setAnimating(true);
        setTimeout(() => setAnimating(false), 600);
      } catch {
        // Revert on failure
        setFollowed(!newState);
      } finally {
        setLoading(false);
      }
    },
    [user, followed, channelId, channelTitle, channelAvatar, onStateChange, router]
  );

  const sizeClasses = size === "sm" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]";

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1 rounded-lg border transition-all duration-300 font-medium cursor-pointer whitespace-nowrap
        ${followed
          ? "bg-blue-500/10 border-blue-500/25 text-blue-400/80 hover:bg-blue-500/20 hover:border-blue-500/40"
          : "bg-white/[0.04] border-white/[0.06] text-white/50 hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white/70"
        }
        ${loading ? "opacity-50" : ""}
        ${sizeClasses}
      `}
      title={followed ? "Unfollow channel" : "Follow channel"}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : followed ? (
        <>
          {animating ? (
            <Check className="w-3 h-3" />
          ) : (
            <UserMinus className="w-3 h-3" />
          )}
          <span>Following</span>
        </>
      ) : (
        <>
          <Plus className="w-3 h-3" />
          <span>Follow</span>
        </>
      )}
    </button>
  );
}
